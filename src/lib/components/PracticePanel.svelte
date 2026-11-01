<script lang="ts">
	import { untrack } from 'svelte';
	import type { Snippet } from '$lib/types';
	import { missingConcepts } from '$lib/utils/conceptCheck.js';
	import {
		firstCompilerError,
		gradeAttempt,
		lessonLabel,
		matchesReference,
		type AttemptGrade,
		type UpcomingLesson
	} from '$lib/utils/learning';
	import { runSnippet, type RunResult } from '$lib/utils/runner';

	let {
		snippet,
		home,
		mode,
		exercise,
		example,
		requirements = [],
		note,
		isRetest = false,
		draft,
		upcomingLesson = null,
		onDraft,
		onPeek,
		onLearned,
		onSkip,
		onContinue
	} = $props<{
		snippet: Snippet;
		home: string;
		mode: 'auto' | 'self';
		exercise?: { errorCode: string; starter: string };
		example?: { raw: string; html: string };
		requirements?: string[][];
		note?: string;
		isRetest?: boolean;
		draft?: string;
		upcomingLesson?: UpcomingLesson | null;
		onDraft: (text: string | null) => void;
		onPeek: () => void;
		onLearned: (helped: boolean) => void;
		onSkip: () => void;
		onContinue: () => void;
	}>();

	// A fix exercise starts from its broken code; a saved draft wins over that.
	const starter = $derived(exercise?.starter ?? '');
	let attempt = $state(untrack(() => draft ?? exercise?.starter ?? ''));

	let checking = $state(false);
	let result = $state<RunResult | null>(null);
	let grade = $state<AttemptGrade | null>(null);
	let missing = $state<string[][]>([]);
	let answerShown = $state(false);
	let fullErrorShown = $state(false);
	// Self-graded languages can't be checked, so checking just reveals the answer to compare.
	let selfChecked = $state(false);

	const blank = $derived(attempt.trim().length === 0);
	const expected = $derived(snippet.verifiedOutput ?? '');
	const exact = $derived(matchesReference(attempt, snippet.contentRaw ?? ''));
	const attempted = $derived(result !== null || selfChecked);
	const compilerError = $derived(firstCompilerError(result?.error ?? ''));

	function edit(text: string) {
		attempt = text;
		onDraft(text);
	}

	function resetAttempt() {
		attempt = starter;
		onDraft(null);
		result = null;
		grade = null;
	}

	function showAnswer() {
		answerShown = true;
		onPeek();
	}

	async function check() {
		if (blank || checking) return;
		checking = true;
		result = null;
		grade = null;
		fullErrorShown = false;
		const run = await runSnippet('rust', attempt);
		missing = missingConcepts(attempt, requirements);
		result = run;
		grade = gradeAttempt(run, expected, missing.length);
		checking = false;
		if (grade === 'pass') onLearned(answerShown);
	}
</script>

{#snippet conceptList(groups: string[][])}
	{#each groups as group, i (i)}{i > 0 ? ', ' : ''}{#each group as token, j (j)}{j > 0
				? ' or '
				: ''}<code>{token}</code>{/each}{/each}
{/snippet}

{#snippet workedExample(item: { html: string })}
	<div class="practice-reference font-mono text-sm">
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html item.html}
	</div>
{/snippet}

<div class="flex flex-col gap-3">
	{#if grade !== 'pass'}
		{#if isRetest}
			<div class="alert alert-info py-2 text-sm">
				Quick retest: can you still write this from memory?
			</div>
		{/if}

		{#if example && isRetest}
			<details class="text-sm">
				<summary class="cursor-pointer text-base-content/70">Show the example</summary>
				<div class="mt-2">{@render workedExample(example)}</div>
			</details>
		{:else if example}
			<div>
				<p class="mb-1 text-xs font-medium text-base-content/60">
					Worked example, with different code from your exercise
				</p>
				{@render workedExample(example)}
			</div>
		{/if}

		<label class="flex flex-col gap-1 text-sm">
			<span class="text-base-content/70">
				{#if exercise}
					This code fails with <code>{exercise.errorCode}</code>. Fix it so it compiles.
				{:else}
					Write this in {snippet.language} from the {home} code.
				{/if}
			</span>
			<textarea
				class="textarea h-40 w-full font-mono text-sm"
				spellcheck="false"
				aria-label="Your {snippet.language} attempt"
				readonly={selfChecked}
				value={attempt}
				oninput={(e) => edit(e.currentTarget.value)}
			></textarea>
		</label>
		{#if mode === 'auto'}
			<div>
				<p class="mb-1 text-xs font-medium text-base-content/60">It should print</p>
				<pre class="rounded-lg bg-base-200 p-2 font-mono text-xs whitespace-pre-wrap">{expected ||
						'(nothing on standard output)'}</pre>
			</div>
			{#if requirements.length > 0}
				<p class="must-use text-xs text-base-content/70">
					Your code must use:
					{@render conceptList(requirements)}
				</p>
			{/if}
		{/if}
	{/if}

	{#if grade === 'pass'}
		<div class="alert alert-success py-2 text-sm">
			{#if answerShown}
				Passed with the answer shown. It'll come back tomorrow to try from memory.
			{:else}
				Passed: it compiled and printed the expected output.
			{/if}
		</div>
		<div>
			<p class="mb-1 text-xs font-medium text-base-content/60">Your code</p>
			<pre class="rounded-lg bg-base-200 p-2 font-mono text-sm whitespace-pre-wrap">{attempt}</pre>
		</div>
	{:else if grade === 'failed'}
		<div class="alert alert-error py-2 text-sm">It didn't run. Here's what the compiler said:</div>
		<pre
			class="max-h-64 overflow-auto rounded-lg bg-base-200 p-2 font-mono text-xs whitespace-pre-wrap">{fullErrorShown
				? result?.error
				: compilerError.first}</pre>
		{#if compilerError.total > 1 || compilerError.first !== result?.error}
			<button
				class="btn self-start btn-ghost btn-xs"
				onclick={() => (fullErrorShown = !fullErrorShown)}
			>
				{#if fullErrorShown}
					Show first error only
				{:else if compilerError.total > 1}
					Show full output ({compilerError.total} errors)
				{:else}
					Show full output
				{/if}
			</button>
		{/if}
	{:else if grade === 'missing-concept'}
		<div class="alert alert-warning py-2 text-sm">
			It printed the right thing, but it doesn't practice this topic yet.
		</div>
		<p class="must-use text-sm">
			Still missing:
			{@render conceptList(missing)}
		</p>
	{:else if grade === 'wrong-output'}
		<div class="alert alert-warning py-2 text-sm">It ran, but printed something different:</div>
		<pre class="rounded-lg bg-base-200 p-2 font-mono text-xs whitespace-pre-wrap">{result?.output ||
				'(no output)'}</pre>
	{:else if grade === 'unreachable'}
		<div class="alert alert-warning py-2 text-sm">{result?.error}</div>
	{/if}

	{#if selfChecked && exact}
		<div class="alert alert-success py-2 text-sm">That matches the reference.</div>
	{/if}

	{#if note && (attempted || answerShown) && grade !== 'unreachable'}
		<div class="bridge-note rounded-lg bg-base-200/50 p-2 text-sm">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html note}
		</div>
	{/if}

	{#if answerShown || selfChecked || grade === 'pass'}
		<div>
			<p class="mb-1 text-xs font-medium text-base-content/60">Reference</p>
			<div class="practice-reference font-mono text-sm">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html snippet.contentHtml}
			</div>
		</div>
		{#if mode === 'self' && expected}
			<div>
				<p class="mb-1 text-xs font-medium text-base-content/60">Reference output</p>
				<pre
					class="rounded-lg bg-base-200 p-2 font-mono text-xs whitespace-pre-wrap">{expected}</pre>
			</div>
		{/if}
	{/if}

	<div class="flex flex-wrap items-center gap-2">
		{#if grade === 'pass'}
			<button class="btn btn-sm btn-primary" onclick={onContinue}>
				{upcomingLesson ? lessonLabel(upcomingLesson) : 'Done'}
			</button>
		{:else if mode === 'auto'}
			<button class="btn btn-sm btn-primary" onclick={check} disabled={blank || checking}>
				{#if checking}
					<span class="loading loading-xs loading-spinner"></span> Checking…
				{:else}
					Run &amp; check
				{/if}
			</button>
			{#if !answerShown}
				<button class="btn btn-ghost btn-sm" onclick={showAnswer}>Show answer</button>
			{/if}
			<button class="btn btn-ghost btn-sm" onclick={onSkip}>Skip for now</button>
			{#if attempt !== starter}
				<button class="btn btn-ghost btn-sm" onclick={resetAttempt}>Reset</button>
			{/if}
		{:else if !selfChecked}
			<button class="btn btn-sm btn-primary" onclick={() => (selfChecked = true)} disabled={blank}>
				Check answer
			</button>
			<button class="btn btn-ghost btn-sm" onclick={onSkip}>Skip for now</button>
		{:else}
			<button
				class="btn btn-outline btn-sm"
				onclick={() => {
					onLearned(false);
					onContinue();
				}}
			>
				I got it
			</button>
			<button class="btn btn-sm btn-primary" onclick={onSkip}>Review later</button>
		{/if}
	</div>

	{#if mode === 'auto' && grade !== 'pass'}
		<p class="text-xs text-base-content/50">
			Run &amp; check sends your code to play.rust-lang.org to compile and run it.
		</p>
	{/if}
</div>

<style>
	.practice-reference :global(pre) {
		margin: 0;
		padding: 0.5rem;
		border-radius: 0.5rem;
		overflow-x: auto;
	}

	.must-use code,
	.bridge-note :global(code) {
		border-radius: 0.25rem;
		background: var(--color-base-300);
		padding: 0 0.25rem;
		font-size: 0.85em;
	}
</style>
