import { toRustProgram } from './rustProgram.js';

export interface RunResult {
	ok: boolean;
	output: string;
	error?: string;
	/** The run never happened because the remote service couldn't be reached. */
	unreachable?: boolean;
}

export type Engine = 'js' | 'ts' | 'py' | 'rust';

/** TypeScript compiles to JS first, so it shares the JS worker. Rust has no worker: it runs remotely. */
type RuntimeKind = 'js' | 'py';
type LocalEngine = Exclude<Engine, 'rust'>;

export type Runnability =
	| { kind: 'run'; engine: Engine }
	| { kind: 'playground'; url: string; label: string }
	| null;

const PYODIDE_VERSION = '0.26.2';
const RUST_PLAYGROUND_URL = 'https://play.rust-lang.org/execute';
const RUST_TIMEOUT_MS = 30_000;
const JS_TIMEOUT_MS = 3_000;
// First Python run may wait on the Pyodide runtime (~10 MB) inside the worker.
const PY_TIMEOUT_MS = 60_000;

export function runnability(language: string): Runnability {
	if (language.startsWith('JavaScript')) return { kind: 'run', engine: 'js' };
	if (language.startsWith('TypeScript')) return { kind: 'run', engine: 'ts' };
	if (language.startsWith('Python')) return { kind: 'run', engine: 'py' };
	if (language.startsWith('Rust')) return { kind: 'run', engine: 'rust' };
	if (language.startsWith('Go'))
		return { kind: 'playground', url: 'https://go.dev/play/', label: 'Go Playground' };
	if (language.startsWith('Java'))
		return { kind: 'playground', url: 'https://dev.java/playground/', label: 'Java Playground' };
	if (language.startsWith('C'))
		return { kind: 'playground', url: 'https://godbolt.org/', label: 'Compiler Explorer' };
	return null;
}

// Worker sources are inlined so no extra asset needs to be served.
const WORKER_SOURCES: Record<RuntimeKind, string> = {
	js: `
self.onmessage = (e) => {
	const logs = [];
	const capture = (...args) => logs.push(args.map((a) => String(a)).join(' '));
	const orig = { log: console.log, error: console.error, warn: console.warn, info: console.info };
	console.log = console.error = console.warn = console.info = capture;
	try {
		const result = new Function(e.data.code)();
		if (result !== undefined) capture(String(result));
		self.postMessage({ ok: true, output: logs.join('\\n') });
	} catch (err) {
		self.postMessage({ ok: false, output: logs.join('\\n'), error: String(err) });
	} finally {
		Object.assign(console, orig);
	}
};
`,
	py: `
let booting = null;
function bootPyodide() {
	if (!booting) {
		booting = (async () => {
			importScripts('https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.js');
			return loadPyodide({
				indexURL: 'https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/'
			});
		})();
		// A failed download can be retried by the next run.
		booting.catch(() => (booting = null));
	}
	return booting;
}
self.onmessage = async (e) => {
	if (e.data.preload) {
		bootPyodide().catch(() => {});
		return;
	}
	const logs = [];
	const capture = (...args) => logs.push(args.map((a) => String(a)).join(' '));
	try {
		const pyodide = await bootPyodide();
		pyodide.setStdout({ batched: capture });
		pyodide.setStderr({ batched: capture });
		// A fresh namespace stops one snippet's variables leaking into the next.
		const namespace = pyodide.globals.get('dict')();
		namespace.set('__name__', '__main__');
		// The trailing pass matches a real script, which doesn't echo its last expression.
		// It also avoids Pyodide's echo wrapper, which fails after PEP 695 generic classes.
		await pyodide.runPythonAsync(e.data.code + '\\npass', { globals: namespace });
		namespace.destroy();
		self.postMessage({ ok: true, output: logs.join('\\n') });
	} catch (err) {
		self.postMessage({ ok: false, output: logs.join('\\n'), error: String(err) });
	}
};
`
};

interface Runtime {
	worker: Worker;
	// A worker handles one run at a time, so runs from different cards queue.
	queue: Promise<unknown>;
	stopped: boolean;
	cancelCurrent: (() => void) | null;
}

const STOPPED: RunResult = { ok: false, output: '', error: 'Runner stopped' };

const runtimes = new Map<RuntimeKind, Runtime>();
let cancelPreload: (() => void) | null = null;

function runtimeKind(engine: LocalEngine): RuntimeKind {
	return engine === 'py' ? 'py' : 'js';
}

function getRuntime(kind: RuntimeKind): Runtime {
	let runtime = runtimes.get(kind);
	if (!runtime) {
		const blob = new Blob([WORKER_SOURCES[kind]], { type: 'application/javascript' });
		runtime = {
			worker: new Worker(URL.createObjectURL(blob)),
			queue: Promise.resolve(),
			stopped: false,
			cancelCurrent: null
		};
		runtimes.set(kind, runtime);
	}
	return runtime;
}

function stopRuntime(kind: RuntimeKind) {
	const runtime = runtimes.get(kind);
	if (!runtime) return;
	runtime.stopped = true;
	runtime.worker.terminate();
	runtime.cancelCurrent?.();
	runtimes.delete(kind);
}

/** The in-browser engines needed by these languages. Other languages have none. */
export function enginesFor(languages: string[]): Engine[] {
	return languages.flatMap((language) => {
		const info = runnability(language);
		return info?.kind === 'run' ? [info.engine] : [];
	});
}

function runOnIdle(task: () => void): () => void {
	if ('requestIdleCallback' in window) {
		const id = requestIdleCallback(task);
		return () => cancelIdleCallback(id);
	}
	const id = setTimeout(task, 200);
	return () => clearTimeout(id);
}

/**
 * Match the running runners to the selected languages: anything else is stopped,
 * which frees its memory. With `preload`, the selected runners also start loading
 * in the background, unless the browser has asked to save data.
 */
export function syncRunners(languages: string[], preload: boolean) {
	cancelPreload?.();
	cancelPreload = null;

	const engines = enginesFor(languages).filter((e): e is LocalEngine => e !== 'rust');
	const needed = new Set(engines.map(runtimeKind));
	for (const kind of [...runtimes.keys()]) {
		if (!needed.has(kind)) stopRuntime(kind);
	}

	const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
	if (!preload || engines.length === 0 || connection?.saveData) return;

	cancelPreload = runOnIdle(() => {
		for (const engine of engines) {
			const runtime = getRuntime(runtimeKind(engine));
			if (engine === 'py') runtime.worker.postMessage({ preload: true });
			if (engine === 'ts') void import('sucrase');
		}
	});
}

/**
 * Run a snippet in its language's sandboxed worker. Infinite loops are handled by
 * terminating the worker on timeout (the next run gets a fresh one, at the
 * cost of re-downloading Pyodide for Python).
 */
export function runSnippet(engine: Engine, code: string): Promise<RunResult> {
	if (engine === 'rust') return runRustRemotely(code);
	const kind = runtimeKind(engine);
	const runtime = getRuntime(kind);
	const run = runtime.queue.then(() =>
		runtime.stopped ? STOPPED : execute(runtime, kind, engine, code)
	);
	runtime.queue = run;
	return run;
}

/** Keep the compiler's message and drop Cargo's progress lines. */
function cleanRustStderr(stderr: string): string {
	return stderr
		.split('\n')
		.filter((line) => !/^\s*(Compiling|Finished|Running|Downloaded|Downloading) /.test(line))
		.join('\n')
		.trim();
}

/** Compile and run on the official Rust Playground, which allows calls from any site. */
async function runRustRemotely(code: string): Promise<RunResult> {
	try {
		const response = await fetch(RUST_PLAYGROUND_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			signal: AbortSignal.timeout(RUST_TIMEOUT_MS),
			body: JSON.stringify({
				channel: 'stable',
				mode: 'debug',
				edition: '2024',
				crateType: 'bin',
				tests: false,
				backtrace: false,
				code: toRustProgram(code)
			})
		});
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		const data: { success: boolean; stdout: string; stderr: string } = await response.json();
		return {
			ok: data.success,
			output: data.stdout.trimEnd(),
			error: data.success ? undefined : cleanRustStderr(data.stderr)
		};
	} catch (err) {
		return {
			ok: false,
			output: '',
			unreachable: true,
			error: `Couldn't reach the Rust Playground (${String(err)}). Your attempt wasn't graded.`
		};
	}
}

async function execute(
	runtime: Runtime,
	kind: RuntimeKind,
	engine: LocalEngine,
	code: string
): Promise<RunResult> {
	let prepared = code;
	if (engine === 'ts') {
		try {
			const { transform } = await import('sucrase');
			prepared = transform(code, { transforms: ['typescript'] }).code;
		} catch (err) {
			return { ok: false, output: '', error: `TS parse error: ${String(err)}` };
		}
		if (runtime.stopped) return STOPPED;
	}
	const timeoutMs = kind === 'py' ? PY_TIMEOUT_MS : JS_TIMEOUT_MS;

	return new Promise((resolve) => {
		const { worker } = runtime;
		const finish = (result: RunResult) => {
			clearTimeout(timer);
			runtime.cancelCurrent = null;
			resolve(result);
		};
		const timer = setTimeout(() => {
			stopRuntime(kind);
			finish({ ok: false, output: '', error: `Timed out after ${timeoutMs / 1000}s` });
		}, timeoutMs);

		runtime.cancelCurrent = () => finish(STOPPED);
		worker.onmessage = (e: MessageEvent<RunResult>) => finish(e.data);
		worker.onerror = (e) => finish({ ok: false, output: '', error: e.message || 'Worker error' });
		worker.postMessage({ code: prepared });
	});
}
