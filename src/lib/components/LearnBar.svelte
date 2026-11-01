<script lang="ts">
	import type { ComparisonRow } from '$lib/types';
	import {
		changeHomeLanguage,
		detailLevel,
		homeLanguage,
		assistedFeatures,
		learnedFeatures,
		retestSchedule,
		reviewFeatures,
		setLanguages,
		visibleLanguages
	} from '$lib/stores/uiStore';
	import {
		dueSlugs,
		learningTarget,
		lessonFeatures,
		lessonLabel,
		nextDetailLevel,
		nextLesson,
		pairKey,
		scrollToFeature
	} from '$lib/utils/learning';

	let { rows } = $props<{ rows: ComparisonRow[] }>();

	const languages = $derived(
		Array.from(
			new Set<string>(rows.flatMap((r: ComparisonRow) => r.snippets.map((s) => s.language)))
		)
	);

	let startHome = $state('Python 3.12');
	let startTarget = $state('Rust');

	const target = $derived(learningTarget($homeLanguage, $visibleLanguages));
	const lessons = $derived(target ? lessonFeatures(rows, $detailLevel, target) : []);
	const learned = $derived(
		$homeLanguage && target ? ($learnedFeatures[pairKey($homeLanguage, target)] ?? []) : []
	);
	const learnedCount = $derived(lessons.filter((l) => learned.includes(l.slug)).length);
	const forReview = $derived(
		$homeLanguage && target ? ($reviewFeatures[pairKey($homeLanguage, target)] ?? []) : []
	);
	const pair = $derived($homeLanguage && target ? pairKey($homeLanguage, target) : '');
	const due = $derived(dueSlugs($retestSchedule[pair], Date.now()));
	const upcoming = $derived(nextLesson(lessons, learned, forReview, due));
	const dueCount = $derived(lessons.filter((l) => due.includes(l.slug)).length);
	const assistedCount = $derived(
		lessons.filter(
			(l) => learned.includes(l.slug) && ($assistedFeatures[pair] ?? []).includes(l.slug)
		).length
	);
	const reviewCount = $derived(lessons.filter((l) => forReview.includes(l.slug)).length);
	const nextLevel = $derived(nextDetailLevel($detailLevel));

	function start() {
		homeLanguage.set(startHome);
		setLanguages([startHome, startTarget]);
	}
</script>

<section
	class="learn-bar mb-4 rounded-box border border-base-300 bg-base-200 p-3 sm:p-4 print:hidden"
	class:learning={$homeLanguage && target}
>
	{#if !$homeLanguage || !target}
		<h1 class="text-xl font-bold sm:text-2xl">Learn a language from one you already know</h1>
		<p class="mt-1 text-sm text-base-content/70">
			Practice each concept side by side, with notes on what changes and what catches people out.
		</p>
		<div class="mt-3 flex flex-wrap items-end gap-3">
			<label class="flex flex-col gap-1 text-sm">
				I know
				<select class="select select-sm" aria-label="Language you know" bind:value={startHome}>
					{#each languages.filter((l: string) => l !== startTarget) as lang (lang)}
						<option value={lang}>{lang}</option>
					{/each}
				</select>
			</label>
			<label class="flex flex-col gap-1 text-sm">
				I'm learning
				<select class="select select-sm" aria-label="Language to learn" bind:value={startTarget}>
					{#each languages.filter((l: string) => l !== startHome) as lang (lang)}
						<option value={lang}>{lang}</option>
					{/each}
				</select>
			</label>
			<button class="btn btn-sm btn-primary" onclick={start}>Start learning</button>
		</div>
	{:else}
		<div class="flex flex-wrap items-center gap-x-4 gap-y-3">
			<h1 class="sr-only">Learning {target} from {$homeLanguage}</h1>
			<div class="flex flex-wrap items-center gap-2 text-sm">
				<select
					class="select w-auto select-sm"
					aria-label="Language you know"
					value={$homeLanguage}
					onchange={(e) => changeHomeLanguage(e.currentTarget.value)}
				>
					{#each languages as lang (lang)}
						<option value={lang}>{lang}</option>
					{/each}
				</select>
				<span aria-hidden="true">→</span>
				<select
					class="select w-auto select-sm"
					aria-label="Language to learn"
					value={target}
					onchange={(e) => setLanguages([$homeLanguage as string, e.currentTarget.value])}
				>
					{#each languages.filter((l: string) => l !== $homeLanguage) as lang (lang)}
						<option value={lang}>{lang}</option>
					{/each}
				</select>
			</div>

			<div class="flex min-w-32 flex-1 items-center gap-2">
				<progress
					class="progress w-full progress-primary"
					value={learnedCount}
					max={lessons.length || 1}
					aria-label="Learning progress"
				></progress>
				<span class="text-sm whitespace-nowrap">{learnedCount} / {lessons.length} learned</span>
				{#if reviewCount > 0}
					<span class="badge badge-sm whitespace-nowrap badge-warning">{reviewCount} to review</span
					>
				{/if}
				{#if assistedCount > 0}
					<span class="badge badge-outline badge-sm whitespace-nowrap"
						>{assistedCount} with answer shown</span
					>
				{/if}
				{#if dueCount > 0}
					<span class="badge badge-sm whitespace-nowrap badge-info"
						>{dueCount} {dueCount === 1 ? 'retest' : 'retests'} due</span
					>
				{/if}
			</div>

			{#if upcoming}
				<button class="btn btn-sm btn-primary" onclick={() => scrollToFeature(upcoming.slug)}>
					{lessonLabel(upcoming)}
				</button>
			{:else if nextLevel}
				<button class="btn btn-sm btn-primary" onclick={() => detailLevel.set(nextLevel)}>
					Continue to {nextLevel} topics
				</button>
			{:else}
				<span class="text-sm font-medium text-success">All topics learned</span>
			{/if}
			<button class="btn btn-ghost btn-sm" onclick={() => homeLanguage.set(null)}>Exit</button>
		</div>
	{/if}
</section>

<style>
	/* Keep progress and Next in reach while scrolling, except on small screens where it would crowd out the lesson. */
	@media (min-width: 640px) {
		.learn-bar.learning {
			position: sticky;
			top: 4rem;
			z-index: 20;
		}
	}
</style>
