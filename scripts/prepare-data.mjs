import { promises as fs } from 'fs';
import path from 'path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { getHighlighter } from 'shiki';

const INPUT_MD_PATH = path.resolve('data/language_comparison.md');
const OUTPUT_JSON_PATH = path.resolve('src/lib/data/comparison-data.json');
const LANGS_TO_HIGHLIGHT = [
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

function processSnippetCell(cellNode, highlighter, langId) {
	let detailLevel = 'simple';
	let contentHtml = '';

	if (!cellNode || !cellNode.children || cellNode.children.length === 0) {
		return { detailLevel, contentHtml: '' };
	}

	// Process each child node
	for (const node of cellNode.children) {
		if (node.type === 'html' && node.value.startsWith('<!-- detail:')) {
			const match = node.value.match(/detail:(simple|detailed|expert)/);
			if (match) {
				detailLevel = match[1];
			}
			// Skip detail comments
		} else if (node.type === 'code') {
			// Apply syntax highlighting to code blocks
			const highlightedHtml = highlighter.codeToHtml(node.value || '', {
				lang: langId,
				theme: 'github-dark'
			});
			contentHtml += highlightedHtml;
		} else if (node.type === 'inlineCode') {
			// Apply syntax highlighting to inline code
			const highlightedHtml = highlighter.codeToHtml(node.value || '', {
				lang: langId,
				theme: 'github-dark'
			});
			contentHtml += highlightedHtml;
		} else if (node.type === 'text') {
			// Add plain text
			contentHtml += node.value || '';
		} else if (node.type === 'strong') {
			// Process strong elements
			contentHtml += '<strong>';
			for (const child of node.children || []) {
				if (child.type === 'text') {
					contentHtml += child.value || '';
				}
			}
			contentHtml += '</strong>';
		} else if (node.type === 'br') {
			// Add line break
			contentHtml += '<br>';
		}
		// Skip other node types for now
	}

	return { detailLevel, contentHtml };
}

(async () => {
	try {
		console.log('Starting data preparation script (v2)...');

		const highlighter = await getHighlighter({
			themes: ['github-dark', 'github-light'],
			langs: LANGS_TO_HIGHLIGHT
		});

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

				// Extract language names from header cells (skip first two columns: Concept, Description)
				const languages = headerRow.children
					.slice(2)
					.map((th) => {
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
					})
					.filter(Boolean);
				console.log('Languages found:', languages);

				const bodyRows = node.children.slice(1);
				console.log('Body rows count:', bodyRows.length);

				for (const [rowIndex, row] of bodyRows.entries()) {
					console.log(`Processing row ${rowIndex}`);
					const feature = row.children[0]?.children[0]?.children[0]?.value || '';
					console.log('Processing feature:', feature);
					const snippetCells = row.children.slice(2);
					const snippets = [];

					snippetCells.forEach((cell, index) => {
						const langName = languages[index];
						if (!langName) return;

						const shikiLangId = normalizeLanguageToShikiId(langName);
						const { detailLevel, contentHtml } = processSnippetCell(cell, highlighter, shikiLangId);

						snippets.push({
							language: langName,
							detailLevel: detailLevel,
							contentHtml: contentHtml
						});
					});

					if (feature && snippets.length > 0) {
						comparisonData.push({
							category: currentCategory,
							categoryDetailLevel: categoryDetailLevels.get(currentCategory) || 'simple',
							feature,
							snippets
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
