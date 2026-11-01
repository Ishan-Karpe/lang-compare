<script lang="ts">
	import type { Snippet } from '$lib/types';
	import { activateRunner, activeRunnerLanguages, detailLevel } from '$lib/stores/uiStore';
	import { copyToClipboard } from '$lib/utils/clipboard';
	import { toJavaProgram } from '$lib/utils/javaProgram.js';
	import { runnability, runSnippet, type RunResult } from '$lib/utils/runner';

	let { snippet } = $props<{ snippet: Snippet }>();

	// In-browser engines only get a Run button on cells tagged <!-- run --> in the tables.
	const runInfo = $derived.by(() => {
		if (!snippet.contentRaw || snippet.isShell) return null;
		const info = runnability(snippet.language);
		if (info?.kind === 'run' && snippet.runMode !== 'browser') {
			return info.engine === 'rust'
				? {
						kind: 'playground' as const,
						url: 'https://play.rust-lang.org/',
						label: 'Rust Playground'
					}
				: null;
		}
		return info;
	});
	const isJava = $derived(snippet.language.startsWith('Java (') && Boolean(snippet.runMode));
	const runnerActive = $derived(
		$activeRunnerLanguages.length === 0 || $activeRunnerLanguages.includes(snippet.language)
	);
	const canEdit = $derived((runInfo?.kind === 'run' && runnerActive) || isJava);

	let edited = $state<string | null>(null);
	const code = $derived(edited ?? snippet.contentRaw ?? '');

	let running = $state(false);
	let result = $state<RunResult | null>(null);
	let programCopied = $state(false);

	async function handleRun() {
		if (!runInfo || runInfo.kind !== 'run' || running) return;
		running = true;
		result = null;
		result = await runSnippet(runInfo.engine, code);
		running = false;
	}

	function startEditing() {
		edited = snippet.contentRaw ?? '';
	}

	function resetEdits() {
		edited = null;
		result = null;
		programCopied = false;
	}

	async function copyProgram() {
		programCopied = await copyToClipboard(toJavaProgram(code));
	}

	// Define the hierarchy of detail levels
	const detailHierarchy: Record<'simple' | 'detailed' | 'expert', number> = {
		simple: 0,
		detailed: 1,
		expert: 2
	};

	// Determine if this card should be visible based on the current detail level
	const isVisible = $derived(
		detailHierarchy[snippet.detailLevel as keyof typeof detailHierarchy] <=
			detailHierarchy[$detailLevel]
	);
</script>

<div
	class="code-content font-mono text-sm whitespace-pre-wrap transition-all duration-300 ease-in-out"
	class:hidden={!isVisible}
>
	{#if edited !== null}
		<textarea
			class="textarea h-40 w-full font-mono text-sm"
			spellcheck="false"
			aria-label="Edit {snippet.language} code"
			bind:value={edited}
		></textarea>
	{:else}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html snippet.contentHtml}
	{/if}

	{#if runInfo}
		<div class="mt-3 flex flex-wrap items-center gap-2 font-sans">
			{#if runInfo.kind === 'run' && !runnerActive}
				<button class="btn btn-ghost btn-xs" onclick={() => activateRunner(snippet.language)}>
					Learn {snippet.language} to run this
				</button>
			{:else if runInfo.kind === 'run'}
				<button class="btn btn-outline btn-xs" onclick={handleRun} disabled={running}>
					{#if running}
						<span class="loading loading-xs loading-spinner"></span> Running…
					{:else}
						▶ Run
					{/if}
				</button>
				{#if runInfo.engine === 'py' && running}
					<span class="text-xs opacity-60">the first Python run can take a few seconds</span>
				{/if}
				{#if runInfo.engine === 'rust'}
					<span class="text-xs opacity-60">runs on play.rust-lang.org</span>
				{/if}
			{:else if isJava}
				<a
					href={runInfo.url}
					target="_blank"
					rel="noopener noreferrer"
					class="btn btn-outline btn-xs"
					onclick={copyProgram}
				>
					Copy program &amp; open {runInfo.label}
				</a>
			{:else}
				<a
					href={runInfo.url}
					target="_blank"
					rel="noopener noreferrer"
					class="btn opacity-70 btn-ghost btn-xs"
				>
					↗ Try on {runInfo.label}
				</a>
			{/if}
			{#if canEdit}
				{#if edited === null}
					<button class="btn btn-ghost btn-xs" onclick={startEditing}>✎ Edit</button>
				{:else}
					<button class="btn btn-ghost btn-xs" onclick={resetEdits}>↺ Reset</button>
				{/if}
			{/if}
		</div>
		{#if programCopied}
			<p class="mt-2 font-sans text-xs whitespace-normal text-base-content/70">
				Copied a complete Main.java. Paste it into the Playground, or save it and run
				<code>java Main.java</code>.
			</p>
		{/if}
		{#if result}
			<div
				class="mt-2 rounded-lg p-2 font-sans text-xs whitespace-normal {result.ok
					? 'bg-base-200'
					: 'bg-error/10'}"
			>
				{#if result.output}
					<pre class="whitespace-pre-wrap">{result.output}</pre>
				{/if}
				{#if result.error}
					<pre class="whitespace-pre-wrap text-error">{result.error}</pre>
				{/if}
				{#if !result.output && !result.error}
					<span class="opacity-60">(no output)</span>
				{/if}
			</div>
		{/if}
	{/if}

	{#if snippet.verifiedOutput && edited === null && !result}
		<div class="mt-2 rounded-lg bg-base-200 p-2 font-sans text-xs whitespace-normal">
			<p class="mb-1 font-medium opacity-60">Output</p>
			<pre class="font-mono whitespace-pre-wrap">{snippet.verifiedOutput}</pre>
		</div>
	{/if}
</div>

<style>
	.code-content {
		line-height: 1.6;
		max-width: 100%;
		overflow-x: auto;
	}

	/* Enhanced code block styling */
	.code-content :global(pre) {
		margin: 0;
		padding: 0;
		background: transparent;
		border-radius: 0.5rem;
	}

	.code-content :global(code) {
		font-family: 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;
		font-size: 0.875rem;
	}
</style>
