import { transform } from 'sucrase';

export interface RunResult {
	ok: boolean;
	output: string;
	error?: string;
}

export type Runnability =
	| { kind: 'run'; engine: 'js' | 'ts' | 'py' }
	| { kind: 'playground'; url: string; label: string }
	| null;

const PYODIDE_VERSION = '0.26.2';
const JS_TIMEOUT_MS = 3_000;
// First Python run downloads the Pyodide runtime (~10 MB) inside the worker.
const PY_TIMEOUT_MS = 60_000;

export function runnability(language: string): Runnability {
	if (language.startsWith('JavaScript')) return { kind: 'run', engine: 'js' };
	if (language.startsWith('TypeScript')) return { kind: 'run', engine: 'ts' };
	if (language.startsWith('Python')) return { kind: 'run', engine: 'py' };
	if (language.startsWith('Rust'))
		return { kind: 'playground', url: 'https://play.rust-lang.org/', label: 'Rust Playground' };
	if (language.startsWith('Go'))
		return { kind: 'playground', url: 'https://go.dev/play/', label: 'Go Playground' };
	if (language.startsWith('Java'))
		return { kind: 'playground', url: 'https://dev.java/playground/', label: 'Java Playground' };
	if (language.startsWith('C'))
		return { kind: 'playground', url: 'https://godbolt.org/', label: 'Compiler Explorer' };
	return null;
}

// The worker source is inlined so no extra asset needs to be served. It handles
// plain JS and, on demand, boots Pyodide (kept warm between runs).
const WORKER_SOURCE = `
let pyodide = null;
self.onmessage = async (e) => {
	const { kind, code } = e.data;
	const logs = [];
	const capture = (...args) => logs.push(args.map((a) => String(a)).join(' '));

	try {
		if (kind === 'js') {
			const orig = { log: console.log, error: console.error, warn: console.warn, info: console.info };
			console.log = console.error = console.warn = console.info = capture;
			try {
				const result = new Function(code)();
				if (result !== undefined) capture(String(result));
			} finally {
				Object.assign(console, orig);
			}
		} else if (kind === 'py') {
			if (!pyodide) {
				importScripts('https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.js');
				pyodide = await loadPyodide({
					indexURL: 'https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/'
				});
			}
			pyodide.setStdout({ batched: capture });
			pyodide.setStderr({ batched: capture });
			const result = await pyodide.runPythonAsync(code);
			if (result !== undefined && result !== null) capture(String(result));
		}
		self.postMessage({ ok: true, output: logs.join('\\n') });
	} catch (err) {
		self.postMessage({ ok: false, output: logs.join('\\n'), error: String(err) });
	}
};
`;

let worker: Worker | null = null;

function getWorker(): Worker {
	if (!worker) {
		const blob = new Blob([WORKER_SOURCE], { type: 'application/javascript' });
		worker = new Worker(URL.createObjectURL(blob));
	}
	return worker;
}

/**
 * Run a snippet in the sandboxed worker. Infinite loops are handled by
 * terminating the worker on timeout (the next run gets a fresh one, at the
 * cost of re-downloading Pyodide for Python).
 */
export function runSnippet(engine: 'js' | 'ts' | 'py', code: string): Promise<RunResult> {
	let prepared = code;
	if (engine === 'ts') {
		try {
			prepared = transform(code, { transforms: ['typescript'] }).code;
		} catch (err) {
			return Promise.resolve({ ok: false, output: '', error: `TS parse error: ${String(err)}` });
		}
	}
	const kind = engine === 'py' ? 'py' : 'js';
	const timeoutMs = kind === 'py' ? PY_TIMEOUT_MS : JS_TIMEOUT_MS;

	return new Promise((resolve) => {
		const w = getWorker();
		const timer = setTimeout(() => {
			w.terminate();
			worker = null;
			resolve({ ok: false, output: '', error: `Timed out after ${timeoutMs / 1000}s` });
		}, timeoutMs);

		w.onmessage = (e: MessageEvent<RunResult>) => {
			clearTimeout(timer);
			resolve(e.data);
		};
		w.onerror = (e) => {
			clearTimeout(timer);
			resolve({ ok: false, output: '', error: e.message || 'Worker error' });
		};
		w.postMessage({ kind, code: prepared });
	});
}
