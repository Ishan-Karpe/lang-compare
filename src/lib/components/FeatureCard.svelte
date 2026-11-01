<script lang="ts">
	import { tick } from 'svelte';
	import type { Snippet } from '$lib/types';
	import CodeCard from './CodeCard.svelte';
	import PracticePanel from './PracticePanel.svelte';
	import {
		assistedFeatures,
		attemptDrafts,
		homeLanguage,
		learnedFeatures,
		postponeRetest,
		retestSchedule,
		reviewFeatures,
		saveDraft,
		scheduleRetest,
		selectedFeatures,
		setAssisted,
		setForReview,
		setLearned,
		toggleFeature
	} from '$lib/stores/uiStore';
	import { bridgeBadge, type BridgeBadge } from '$lib/utils/bridge';
	import {
		learningTarget,
		pairKey,
		practiceMode,
		scrollToFeature,
		type UpcomingLesson
	} from '$lib/utils/learning';
	import { slugify } from '$lib/utils/slugify';

	let {
		feature,
		snippets,
		visibleLanguages,
		bridgeNotes = {},
		exercises = {},
		requirements = {},
		examples = {},
		upcomingLesson = null
	} = $props<{
		feature: string;
		snippets: Snippet[];
		visibleLanguages: string[];
		bridgeNotes?: Record<string, string>;
		exercises?: Record<string, { errorCode: string; starter: string }>;
		requirements?: Record<string, string[][]>;
		examples?: Record<string, { raw: string; html: string }>;
		upcomingLesson?: UpcomingLesson | null;
	}>();

	const homeSnippet = $derived(
		$homeLanguage ? snippets.find((s: Snippet) => s.language === $homeLanguage) : undefined
	);

	// Filter snippets to visible languages; in Bridge Mode the home language is
	// always shown (it's the anchor) and pinned first.
	const visibleSnippets = $derived(
		(() => {
			const visible = snippets.filter(
				(snippet: Snippet) =>
					snippet.contentHtml &&
					(visibleLanguages.includes(snippet.language) || snippet.language === $homeLanguage)
			);
			if (!homeSnippet) return visible;
			return [
				...visible.filter((s: Snippet) => s.language === $homeLanguage),
				...visible.filter((s: Snippet) => s.language !== $homeLanguage)
			];
		})()
	);

	function badgeFor(snippet: Snippet): BridgeBadge | null {
		return bridgeBadge({ bridgeNotes }, homeSnippet, snippet);
	}

	const featureSlug = $derived(slugify(feature));
	const inCheatsheet = $derived($selectedFeatures.includes(featureSlug));

	// Learning loop: progress and practice apply to the language being learned.
	const target = $derived(learningTarget($homeLanguage, visibleLanguages));
	const pair = $derived($homeLanguage && target ? pairKey($homeLanguage, target) : null);
	const isLearned = $derived(pair ? ($learnedFeatures[pair] ?? []).includes(featureSlug) : false);
	const isForReview = $derived(pair ? ($reviewFeatures[pair] ?? []).includes(featureSlug) : false);
	const isAssisted = $derived(pair ? ($assistedFeatures[pair] ?? []).includes(featureSlug) : false);
	const retestEntry = $derived(pair ? $retestSchedule[pair]?.[featureSlug] : undefined);
	const isDue = $derived(retestEntry ? retestEntry.due <= Date.now() : false);
	const draftKey = $derived(`${pair}|${featureSlug}`);

	// Practice is the default way into a topic, so the answer stays hidden until it's
	// been attempted. A learned topic shows its answer, with Practice again on offer.
	let practicing = $state(false);

	function showsPractice(snippet: Snippet): boolean {
		return (
			snippet.language === target &&
			practiceMode(snippet) !== null &&
			(!isLearned || practicing || isDue)
		);
	}

	function completeTopic(answerShown: boolean) {
		// Keep the panel open so the learner sees the result until they choose to move on.
		practicing = true;
		if (!pair) return;
		const wasLearned = isLearned;
		// A peek on an earlier visit still counts, until a later clean pass clears it.
		const helped = answerShown || (!wasLearned && isAssisted);
		if (helped) {
			setAssisted(pair, featureSlug, true);
		} else if (wasLearned) {
			setAssisted(pair, featureSlug, false);
		}
		if (!wasLearned || isDue) scheduleRetest(pair, featureSlug, helped, Date.now());
		setLearned(pair, featureSlug, true);
		saveDraft(draftKey, null);
	}

	async function goToUpcoming() {
		await tick();
		if (upcomingLesson) scrollToFeature(upcomingLesson.slug);
	}

	function finishPractice() {
		practicing = false;
		return goToUpcoming();
	}

	function skip() {
		if (pair && isDue) {
			postponeRetest(pair, featureSlug, Date.now());
		} else if (pair) {
			setForReview(pair, featureSlug, true);
		}
		practicing = false;
		return goToUpcoming();
	}

	const BADGES: Record<string, { label: string; className: string }> = {
		same: { label: '≈ same idea', className: 'badge-success badge-outline' },
		shift: { label: '↔ new syntax', className: 'badge-info badge-outline' },
		gotcha: { label: '⚠ gotcha', className: 'badge-warning' },
		differs: { label: 'differs', className: 'badge-warning badge-outline' }
	};
</script>

{#if visibleSnippets.length > 0}
	<article id={featureSlug} class="feature-section mb-12 max-w-full scroll-mt-6">
		<div class="mb-4 flex items-center gap-2 px-2">
			<h3 class="text-xl font-semibold text-base-content/90">{feature}</h3>
			{#if isDue}
				<span class="badge badge-sm badge-info">retest due</span>
			{:else if isLearned && isAssisted}
				<span class="badge badge-outline badge-sm badge-success">learned with answer shown</span>
			{:else if isLearned}
				<span class="badge badge-sm badge-success">learned</span>
			{:else if isForReview}
				<span class="badge badge-sm badge-warning">to review</span>
			{/if}
			<button
				class="btn btn-ghost btn-xs"
				class:text-primary={inCheatsheet}
				aria-label={inCheatsheet ? 'Remove from cheatsheet' : 'Add to cheatsheet'}
				title={inCheatsheet ? 'Remove from cheatsheet' : 'Add to cheatsheet'}
				onclick={() => toggleFeature(featureSlug)}
			>
				{#if inCheatsheet}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4"
						viewBox="0 0 24 24"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z"
							clip-rule="evenodd"
						/>
					</svg>
				{:else}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
					</svg>
				{/if}
			</button>
		</div>

		<div class="grid max-w-full grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each visibleSnippets as snippet (snippet.language)}
				<div class="code-card-wrapper">
					<div
						class="card border border-base-300 bg-base-100 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
						class:border-primary={snippet.language === $homeLanguage}
						class:border-2={snippet.language === $homeLanguage}
					>
						<div class="card-body p-0">
							<!-- Language Header -->
							<div
								class="flex items-center gap-2 border-b border-base-300 bg-base-200/50 px-5 pt-4 pb-3"
							>
								<div class="flex flex-1 items-center gap-2">
									<h4 class="text-sm font-medium tracking-wide text-base-content/80 uppercase">
										{snippet.language}
									</h4>
									{#if snippet.language === $homeLanguage}
										<span class="badge badge-sm badge-primary">your language</span>
									{:else if homeSnippet}
										{@const badge = badgeFor(snippet)}
										{#if badge?.kind === 'similar'}
											<span class="badge badge-outline badge-sm badge-success"
												>≈ like {$homeLanguage}</span
											>
										{:else if badge}
											<span class="badge badge-sm {BADGES[badge.kind].className}"
												>{BADGES[badge.kind].label}</span
											>
										{/if}
									{/if}
								</div>
								{#if !showsPractice(snippet)}
									<button
										class="copy-btn btn btn-square btn-ghost btn-xs"
										aria-label="Copy code"
										data-code={snippet.contentHtml}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-4 w-4"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
											/>
										</svg>
									</button>
								{/if}
							</div>

							{#if showsPractice(snippet)}
								<div class="rounded-b-2xl bg-base-100 px-3 py-4 sm:px-5">
									<PracticePanel
										{snippet}
										home={$homeLanguage ?? ''}
										mode={practiceMode(snippet) ?? 'self'}
										exercise={exercises[snippet.language]}
										example={examples[snippet.language]}
										requirements={requirements[snippet.language]}
										isRetest={isDue}
										draft={$attemptDrafts[draftKey]}
										onDraft={(text: string | null) => saveDraft(draftKey, text)}
										onPeek={() => pair && setAssisted(pair, featureSlug, true)}
										note={badgeFor(snippet)?.note}
										{upcomingLesson}
										onLearned={completeTopic}
										onSkip={skip}
										onContinue={finishPractice}
									/>
								</div>
							{:else}
								<!-- Bridge note: what changes coming from the home language -->
								{#if homeSnippet && snippet.language !== $homeLanguage && badgeFor(snippet)?.note}
									{@const badge = badgeFor(snippet)}
									<div
										class="bridge-note border-b border-base-300 bg-base-200/30 px-5 py-3 text-sm"
									>
										<p class="mb-1 text-xs font-medium text-base-content/60">{badge?.direction}</p>
										<!-- eslint-disable-next-line svelte/no-at-html-tags -->
										<p>{@html badge?.note}</p>
									</div>
								{/if}

								<!-- Code Content -->
								<div class="max-w-full overflow-x-auto rounded-b-2xl bg-base-100 px-3 py-4 sm:px-5">
									<CodeCard {snippet} />
									{#if snippet.language === target}
										<div
											class="mt-3 flex flex-wrap items-center gap-2 border-t border-base-300 pt-3"
										>
											{#if practiceMode(snippet)}
												<span class="text-sm font-medium text-success">✓ Learned</span>
												<button class="btn btn-outline btn-sm" onclick={() => (practicing = true)}>
													Practice again
												</button>
											{:else}
												<button
													class="btn btn-outline btn-sm"
													class:btn-success={isLearned}
													aria-pressed={isLearned}
													onclick={() => pair && setLearned(pair, featureSlug, !isLearned)}
												>
													{isLearned ? '✓ Read' : 'Mark as read'}
												</button>
											{/if}
										</div>
									{/if}
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	</article>
{/if}

<style>
	.bridge-note :global(code) {
		border-radius: 0.25rem;
		background: var(--color-base-300);
		padding: 0 0.25rem;
		font-size: 0.85em;
	}

	.code-card-wrapper {
		/* Stops wide code from stretching a grid column past the page */
		min-width: 0;
		animation: fadeInScale 0.3s ease-out backwards;
	}

	.code-card-wrapper:nth-child(1) {
		animation-delay: 0ms;
	}
	.code-card-wrapper:nth-child(2) {
		animation-delay: 50ms;
	}
	.code-card-wrapper:nth-child(3) {
		animation-delay: 100ms;
	}
	.code-card-wrapper:nth-child(4) {
		animation-delay: 150ms;
	}
	.code-card-wrapper:nth-child(5) {
		animation-delay: 200ms;
	}

	@keyframes fadeInScale {
		from {
			opacity: 0;
			transform: scale(0.95) translateY(10px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	.copy-btn {
		opacity: 0.5;
		transition: all 0.15s ease;
	}

	.copy-btn:hover {
		opacity: 1;
		transform: scale(1.1);
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.grid {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	@media (min-width: 769px) and (max-width: 1024px) {
		.grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (min-width: 1025px) {
		.grid {
			grid-template-columns: repeat(auto-fit, minmax(max(300px, calc((100% - 3rem) / 3)), 1fr));
		}
	}
</style>
