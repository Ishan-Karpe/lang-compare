<script lang="ts">
	import type { Snippet } from '$lib/types';
	import { detailLevel } from '$lib/stores/uiStore';
	import { runnability, runSnippet, type RunResult } from '$lib/utils/runner';

	let { snippet } = $props<{ snippet: Snippet }>();

	const runInfo = $derived(snippet.contentRaw ? runnability(snippet.language) : null);

	let running = $state(false);
	let result = $state<RunResult | null>(null);

	async function handleRun() {
		if (!runInfo || runInfo.kind !== 'run' || running) return;
		running = true;
		result = null;
		result = await runSnippet(runInfo.engine, snippet.contentRaw ?? '');
		running = false;
	}

	// Define the hierarchy of detail levels
	const detailHierarchy: Record<'simple' | 'detailed' | 'expert', number> = {
		simple: 0,
		detailed: 1,
		expert: 2
	};

	// Determine if this card should be visible based on the current detail level
	let isVisible = $state(false);

	$effect(() => {
		const unsubscribe = detailLevel.subscribe((currentLevel: 'simple' | 'detailed' | 'expert') => {
			isVisible =
				detailHierarchy[snippet.detailLevel as keyof typeof detailHierarchy] <=
				detailHierarchy[currentLevel];
		});
		return () => unsubscribe();
	});
</script>

<div
	class="code-content font-mono text-sm whitespace-pre-wrap transition-all duration-300 ease-in-out"
	class:hidden={!isVisible}
>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html snippet.contentHtml}

	{#if runInfo}
		<div class="mt-3 flex items-center gap-2">
			{#if runInfo.kind === 'run'}
				<button class="btn btn-outline btn-xs" onclick={handleRun} disabled={running}>
					{#if running}
						<span class="loading loading-xs loading-spinner"></span> Running…
					{:else}
						▶ Run
					{/if}
				</button>
				{#if runInfo.engine === 'py' && running}
					<span class="text-xs opacity-60">first Python run downloads the runtime</span>
				{/if}
			{:else}
				<a
					href={runInfo.url}
					target="_blank"
					rel="noopener noreferrer"
					class="btn btn-ghost btn-xs opacity-70"
				>
					↗ Try on {runInfo.label}
				</a>
			{/if}
		</div>
		{#if result}
			<div
				class="mt-2 rounded-lg p-2 font-sans text-xs {result.ok ? 'bg-base-200' : 'bg-error/10'}"
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

	/* Improve readability */
	.code-content :global(.line) {
		display: block;
		min-height: 1.5rem;
	}
</style>
