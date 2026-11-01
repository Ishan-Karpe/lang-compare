import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { getHighlighter } from 'shiki';

const INPUT_MD_PATH = path.resolve('data/language_comparison.md');
const BRIDGE_NOTES_PATH = path.resolve('data/bridge_notes.md');
const SNIPPET_OUTPUTS_PATH = path.resolve('data/snippet_outputs.json');
const OUTPUT_JSON_PATH = path.resolve('src/lib/data/comparison-data.json');
const LANGS_TO_HIGHLIGHT = [
	'bash',
	'python',
	'typescript',
	'javascript',
	'java',
	'rust',
	'go',
	'c',
	'cpp',
	'js',
	'ts',
	'py'
];

/**
 * Some tables use variant column headers ("TypeScript (Node.js/Browser)",
 * "JavaScript (Browser/Node.js)"). Canonicalize so language filtering and
 * Bridge Mode treat them as one language.
 */
function canonicalizeLanguageName(langName) {
	if (langName.startsWith('TypeScript')) return 'TypeScript';
	if (langName.startsWith('JavaScript')) return 'JavaScript (ES6+)';
	return langName;
}

function normalizeLanguageToShikiId(langName) {
	const lower = langName.toLowerCase();
	if (lower.startsWith('javascript')) return 'js';
	if (lower.startsWith('typescript')) return 'ts';
	if (lower.startsWith('python')) return 'py';
	if (lower.startsWith('c++')) return 'cpp';
	if (lower.startsWith('c (c17)')) return 'c';
	if (lower.startsWith('c ')) return 'c';
	if (lower.startsWith('java (lts)')) return 'java';
	if (lower.startsWith('java ')) return 'java';
	return lower;
}

function escapeHtml(text) {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function processSnippetCell(cellNode, highlighter, langId) {
	let detailLevel = 'simple';
	let runMode = null;
	let isShell = false;
	let contentHtml = '';
	let contentRaw = '';

	if (!cellNode || !cellNode.children || cellNode.children.length === 0) {
		return { detailLevel, runMode, isShell, contentHtml: '', contentRaw: '' };
	}

	// Consecutive code spans separated only by <br> are one multi-line block, so
	// they highlight together and keep their indentation.
	let pendingCode = [];
	const flushCode = () => {
		if (pendingCode.length === 0) return;
		const code = pendingCode.join('\n');
		contentHtml += highlighter.codeToHtml(code, {
			lang: isShell ? 'bash' : langId,
			theme: 'github-dark'
		});
		contentRaw += code + '\n';
		pendingCode = [];
	};

	// Process each child node
	for (const node of cellNode.children) {
		if (node.type === 'html') {
			const detail = node.value.match(/^<!-- detail:(simple|detailed|expert) -->$/);
			const run = node.value.match(/^<!-- run(:local)? -->$/);
			if (detail) detailLevel = detail[1];
			if (run) runMode = run[1] ? 'local' : 'browser';
			if (node.value === '<!-- shell -->') isShell = true;
			if (/^<br\s*\/?>$/.test(node.value) && pendingCode.length === 0) contentHtml += '<br>';
		} else if (node.type === 'code' || node.type === 'inlineCode') {
			pendingCode.push(node.value || '');
		} else if (node.type === 'text') {
			if (!node.value.trim()) continue;
			flushCode();
			contentHtml += escapeHtml(node.value);
		} else if (node.type === 'strong' || node.type === 'emphasis') {
			flushCode();
			const tag = node.type === 'strong' ? 'strong' : 'em';
			const inner = (node.children || []).map((child) => escapeHtml(child.value || '')).join('');
			contentHtml += `<${tag}>${inner}</${tag}>`;
		}
		// Skip other node types for now
	}
	flushCode();

	return { detailLevel, runMode, isShell, contentHtml, contentRaw: contentRaw.trimEnd() };
}

/** Read a `<!-- fix:E0382 -->` cell: the compiler error it teaches, plus its broken code. */
function parseFixCell(cellNode) {
	const children = cellNode?.children || [];
	const marker = children
		.map((node) => (node.type === 'html' ? node.value.match(/^<!-- fix:(\w+) -->$/) : null))
		.find(Boolean);
	if (!marker) return null;
	const starter = children
		.filter((node) => node.type === 'inlineCode')
		.map((node) => node.value)
		.join('\n');
	return { errorCode: marker[1], starter };
}

/** Read a `Must Use` cell: each line needs any one of the code spans on that line. */
function parseMustUseCell(cellNode) {
	const groups = [[]];
	for (const node of cellNode?.children || []) {
		if (node.type === 'inlineCode') groups[groups.length - 1].push(node.value);
		if (node.type === 'html' && /^<br\s*\/?>$/.test(node.value)) groups.push([]);
	}
	return groups.filter((group) => group.length > 0);
}

/** Render a table note cell (text plus inline code) as HTML. */
function noteCellToHtml(cellNode) {
	return (cellNode?.children || [])
		.map((node) =>
			node.type === 'inlineCode'
				? `<code>${escapeHtml(node.value || '')}</code>`
				: escapeHtml(node.value || '')
		)
		.join('')
		.trim();
}

/** Render a note written in data/bridge_notes.md as HTML. */
function noteTextToHtml(text) {
	return escapeHtml(text).replace(/`([^`]+)`/g, '<code>$1</code>');
}

/** Real program outputs recorded by `npm run verify:snippets`. */
async function readSnippetOutputs() {
	try {
		return JSON.parse(await fs.readFile(SNIPPET_OUTPUTS_PATH, 'utf-8'));
	} catch {
		return {}; // file is optional
	}
}

/** An output only counts if it was recorded for exactly this code. */
function verifiedOutputFor(outputs, feature, language, code) {
	const entry = outputs[`${feature}|${language}`];
	if (!entry) return undefined;
	const hash = createHash('sha1').update(code).digest('hex');
	return entry.hash === hash ? entry.output : undefined;
}

/**
 * Parse data/bridge_notes.md into { "<feature>": { "<from>-><to>": "note" } }.
 * Format: "## <Feature>" sections containing "### <From> -> <To>" subsections
 * whose body text is the note.
 */
async function parseBridgeNotes() {
	let raw;
	try {
		raw = await fs.readFile(BRIDGE_NOTES_PATH, 'utf-8');
	} catch {
		return {}; // file is optional
	}

	const notes = {};
	let feature = null;
	let pairKey = null;

	for (const line of raw.split('\n')) {
		const featureMatch = line.match(/^##\s+(?!#)(.+)$/);
		const pairMatch = line.match(/^###\s+(.+?)\s*->\s*(.+)$/);

		if (pairMatch && feature) {
			pairKey = `${pairMatch[1].trim()}->${pairMatch[2].trim()}`;
			notes[feature][pairKey] = '';
		} else if (featureMatch && !line.startsWith('###')) {
			feature = featureMatch[1].trim();
			notes[feature] = notes[feature] || {};
			pairKey = null;
		} else if (pairKey && feature && line.trim()) {
			notes[feature][pairKey] = (notes[feature][pairKey] + ' ' + line.trim()).trim();
		}
	}

	// Drop features that ended up with no pairs
	for (const key of Object.keys(notes)) {
		if (Object.keys(notes[key]).length === 0) {
			delete notes[key];
			continue;
		}
		for (const pair of Object.keys(notes[key])) {
			notes[key][pair] = noteTextToHtml(notes[key][pair]);
		}
	}
	return notes;
}

(async () => {
	try {
		console.log('Starting data preparation script (v2)...');

		const highlighter = await getHighlighter({
			themes: ['github-dark', 'github-light'],
			langs: LANGS_TO_HIGHLIGHT
		});

		const bridgeNotesByFeature = await parseBridgeNotes();
		const snippetOutputs = await readSnippetOutputs();
		const markdown = await fs.readFile(INPUT_MD_PATH, 'utf-8');
		const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown);

		const comparisonData = [];
		let currentCategory = '';

		// Process the markdown tree directly
		console.log('Total nodes in tree:', tree.children.length);
		const categoryDetailLevels = new Map(); // Store detail level for each category
		for (const [index, node] of tree.children.entries()) {
			console.log(`Processing node ${index}:`, node.type);

			// Check if this node is a heading and the previous node was an HTML comment with detail level
			if (node.type === 'heading' && node.depth === 2) {
				// Look for an HTML comment with detail level in the previous node
				let detailLevel = 'simple'; // default

				// Check previous nodes for HTML comments with detail level
				for (let i = index - 1; i >= 0; i--) {
					const prevNode = tree.children[i];
					if (prevNode.type === 'html' && prevNode.value.startsWith('<!-- detail:')) {
						const match = prevNode.value.match(/detail:(simple|detailed|expert)/);
						if (match) {
							detailLevel = match[1];
							break;
						}
					} else if (
						prevNode.type === 'heading' ||
						prevNode.type === 'table' ||
						prevNode.type === 'paragraph'
					) {
						// Stop looking if we hit another major element
						break;
					}
				}

				currentCategory = node.children[0]?.value || '';
				categoryDetailLevels.set(currentCategory, detailLevel);
				console.log('Found category:', currentCategory, 'with detail level:', detailLevel);
			} else if (node.type === 'table') {
				console.log('Processing table...');
				const headerRow = node.children[0];
				if (!headerRow) {
					console.log('No header row found');
					continue;
				}

				// Extract column names from header cells (skip first two columns: Concept, Description).
				// A "<From> -> <To>" column holds bridge notes rather than a language.
				const columns = headerRow.children.slice(2).map((th) => {
					// Handle nested strong elements
					if (th.children && th.children.length > 0) {
						const strongElement = th.children[0];
						if (
							strongElement.type === 'strong' &&
							strongElement.children &&
							strongElement.children.length > 0
						) {
							return strongElement.children[0].value || '';
						} else if (strongElement.type === 'text') {
							return strongElement.value || '';
						}
					}
					return '';
				});
				console.log('Columns found:', columns);

				const bodyRows = node.children.slice(1);
				console.log('Body rows count:', bodyRows.length);

				for (const [rowIndex, row] of bodyRows.entries()) {
					console.log(`Processing row ${rowIndex}`);
					const feature = row.children[0]?.children[0]?.children[0]?.value || '';
					console.log('Processing feature:', feature);
					const snippetCells = row.children.slice(2);
					const snippets = [];
					const tableNotes = {};
					const exercises = {};
					const requirements = {};
					const examples = {};
					const focus = (row.children[0]?.children || [])
						.map((node) =>
							node.type === 'html' ? node.value.match(/^<!-- focus:(.+) -->$/) : null
						)
						.find(Boolean)?.[1];

					snippetCells.forEach((cell, index) => {
						const columnName = columns[index];
						if (!columnName) return;

						// "Must Use: <Language>" lists the concepts an attempt has to use.
						const mustColumn = columnName.match(/^Must Use:\s*(.+)$/);
						if (mustColumn) {
							const groups = parseMustUseCell(cell);
							if (groups.length > 0) requirements[mustColumn[1]] = groups;
							return;
						}

						// "Example: <Language>" is a worked example shown before the attempt.
						const exampleColumn = columnName.match(/^Example:\s*(.+)$/);
						if (exampleColumn) {
							const lang = exampleColumn[1];
							const example = processSnippetCell(
								cell,
								highlighter,
								normalizeLanguageToShikiId(lang)
							);
							if (example.contentRaw) {
								examples[lang] = { raw: example.contentRaw, html: example.contentHtml };
							}
							return;
						}

						// A "Fix This: <Language>" cell holds broken code for the learner to repair.
						const fixColumn = columnName.match(/^Fix This:\s*(.+)$/);
						if (fixColumn) {
							const exercise = parseFixCell(cell);
							if (exercise) exercises[fixColumn[1]] = exercise;
							return;
						}

						const notePair = columnName.match(/^(.+?)\s*->\s*(.+)$/);
						if (notePair) {
							const html = noteCellToHtml(cell);
							if (html) tableNotes[`${notePair[1]}->${notePair[2]}`] = html;
							return;
						}

						const langName = canonicalizeLanguageName(columnName);
						const shikiLangId = normalizeLanguageToShikiId(langName);
						const { detailLevel, runMode, isShell, contentHtml, contentRaw } = processSnippetCell(
							cell,
							highlighter,
							shikiLangId
						);

						snippets.push({
							language: langName,
							detailLevel: detailLevel,
							runMode,
							isShell,
							contentHtml: contentHtml,
							contentRaw: contentRaw,
							verifiedOutput: verifiedOutputFor(snippetOutputs, feature, langName, contentRaw)
						});
					});

					if (feature && snippets.length > 0) {
						comparisonData.push({
							category: currentCategory,
							categoryDetailLevel: categoryDetailLevels.get(currentCategory) || 'simple',
							feature,
							snippets,
							bridgeNotes: { ...(bridgeNotesByFeature[feature] || {}), ...tableNotes },
							exercises,
							requirements,
							examples,
							focus
						});
					}
				}
			}
		}

		await fs.mkdir(path.dirname(OUTPUT_JSON_PATH), { recursive: true });
		await fs.writeFile(OUTPUT_JSON_PATH, JSON.stringify({ rows: comparisonData }, null, 2));

		console.log(
			`✅ Successfully generated ${OUTPUT_JSON_PATH} with ${comparisonData.length} rows.`
		);
		if (comparisonData.length === 0) {
			console.warn(
				'⚠️ Warning: The output file is empty. Check the input Markdown and script logic.'
			);
		}
	} catch (error) {
		console.error('❌ Error during data preparation:', error);
		process.exit(1);
	}
})();
