/**
 * Compiles and runs every Python and Java snippet tagged `<!-- run -->` or
 * `<!-- run:local -->` with the real toolchains, then records stdout in
 * data/snippet_outputs.json. Deploys have no JDK, so the results are committed.
 *
 * Requires a JDK that supports `--release 21`. Point PYTHON at a 3.12 interpreter,
 * the version the tables and the in-browser runtime use.
 */
import { spawnSync } from 'child_process';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { missingConcepts } from '../src/lib/utils/conceptCheck.js';
import { toJavaProgram } from '../src/lib/utils/javaProgram.js';
import { toRustProgram } from '../src/lib/utils/rustProgram.js';

const DATA_PATH = path.resolve('src/lib/data/comparison-data.json');
const OUTPUTS_PATH = path.resolve('data/snippet_outputs.json');
const STDIN = 'Ada\n';
const TIMEOUT_MS = 30_000;
const PYTHON = process.env.PYTHON || 'python3';

function exec(command, args, cwd) {
	return spawnSync(command, args, { cwd, input: STDIN, encoding: 'utf8', timeout: TIMEOUT_MS });
}

async function runPython(code, dir) {
	await fs.writeFile(path.join(dir, 'main.py'), code);
	return exec(PYTHON, ['main.py'], dir);
}

async function runJava(code, dir) {
	await fs.writeFile(path.join(dir, 'Main.java'), toJavaProgram(code));
	const compiled = exec('javac', ['--release', '21', '-nowarn', 'Main.java'], dir);
	return compiled.status === 0 ? exec('java', ['-cp', '.', 'Main'], dir) : compiled;
}

async function compileRust(code, dir) {
	await fs.writeFile(path.join(dir, 'main.rs'), toRustProgram(code));
	return exec('rustc', ['--edition', '2024', 'main.rs'], dir);
}

async function runRust(code, dir) {
	const compiled = await compileRust(code, dir);
	return compiled.status === 0 ? exec(path.join(dir, 'main'), [], dir) : compiled;
}

const RUNNERS = { 'Python 3.12': runPython, 'Java (LTS)': runJava, Rust: runRust };

const pythonVersion = exec(PYTHON, ['--version']).stdout.trim();
if (!pythonVersion.startsWith('Python 3.12')) {
	console.warn(
		`⚠️ Tables target Python 3.12, but ${PYTHON} is ${pythonVersion || 'not available'}.`
	);
}

const { rows } = JSON.parse(await fs.readFile(DATA_PATH, 'utf-8'));
const outputs = {};
const failures = [];

for (const row of rows) {
	for (const snippet of row.snippets) {
		const run = RUNNERS[snippet.language];
		if (!run || !snippet.runMode) continue;

		const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'lang-compare-'));
		try {
			const result = await run(snippet.contentRaw, dir);
			if (result.status === 0) {
				outputs[`${row.feature}|${snippet.language}`] = {
					hash: createHash('sha1').update(snippet.contentRaw).digest('hex'),
					output: result.stdout.trimEnd()
				};
			} else {
				failures.push(`${row.feature} [${snippet.language}]\n${result.stderr || result.error}`);
			}
		} finally {
			await fs.rm(dir, { recursive: true, force: true });
		}
	}

	// The reference answer has to pass its own required-concept check.
	for (const [language, groups] of Object.entries(row.requirements ?? {})) {
		const reference = row.snippets.find((s) => s.language === language)?.contentRaw ?? '';
		const missing = missingConcepts(reference, groups);
		if (missing.length > 0) {
			failures.push(`${row.feature} [${language}] reference misses ${JSON.stringify(missing)}`);
		}
	}

	// A worked example has to run, and can't just be the answer.
	const example = row.examples?.Rust;
	if (example) {
		const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'lang-compare-'));
		try {
			const result = await runRust(example.raw, dir);
			if (result.status !== 0) {
				failures.push(`${row.feature} [example]\n${result.stderr || result.error}`);
			}
			const reference = row.snippets.find((s) => s.language === 'Rust')?.contentRaw ?? '';
			if (example.raw.replace(/\s+/g, '') === reference.replace(/\s+/g, '')) {
				failures.push(`${row.feature} [example] is the same as the answer`);
			}
		} finally {
			await fs.rm(dir, { recursive: true, force: true });
		}
	}

	// A "fix this" exercise is only useful if it fails with the error it teaches.
	const exercise = row.exercises?.Rust;
	if (exercise) {
		const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'lang-compare-'));
		try {
			const result = await compileRust(exercise.starter, dir);
			if (result.status === 0 || !result.stderr.includes(`error[${exercise.errorCode}]`)) {
				failures.push(
					`${row.feature} [fix exercise] should fail with ${exercise.errorCode}\n${result.stderr}`
				);
			}
		} finally {
			await fs.rm(dir, { recursive: true, force: true });
		}
	}
}

await fs.writeFile(OUTPUTS_PATH, `${JSON.stringify(outputs, null, '\t')}\n`);
console.log(`Verified ${Object.keys(outputs).length} snippets, ${failures.length} failed.`);
if (failures.length > 0) {
	console.error(failures.join('\n\n'));
	process.exit(1);
}
