<script lang="ts">
	import type { Snippet } from '$lib/types';
	import CodeCard from './CodeCard.svelte';
	import { homeLanguage, selectedFeatures, toggleFeature } from '$lib/stores/uiStore';
	import { bridgeBadge, type BridgeBadge } from '$lib/utils/bridge';
	import { slugify } from '$lib/utils/slugify';

	let {
		feature,
		snippets,
		visibleLanguages,
		bridgeNotes = {}
	} = $props<{
		feature: string;
		snippets: Snippet[];
		visibleLanguages: string[];
		bridgeNotes?: Record<string, string>;
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
					visibleLanguages.includes(snippet.language) || snippet.language === $homeLanguage
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
</script>

{#if visibleSnippets.length > 0}
	<div class="feature-section mb-12 max-w-full">
		<div class="mb-4 flex items-center gap-2 px-2">
			<h3 class="text-xl font-semibold text-base-content/90">{feature}</h3>
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
											<span class="badge badge-sm badge-success badge-outline"
												>≈ like {$homeLanguage}</span
											>
										{:else if badge?.note}
											<span
												class="badge tooltip tooltip-bottom badge-sm cursor-help badge-warning"
												data-tip={badge.note}>⚠ differs</span
											>
										{:else if badge}
											<span class="badge badge-sm badge-outline badge-warning">differs</span>
										{/if}
									{/if}
								</div>
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
							</div>

							<!-- Code Content -->
							<div class="max-w-full overflow-x-auto rounded-b-2xl bg-base-100 px-3 py-4 sm:px-5">
								<CodeCard {snippet} />
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	.code-card-wrapper {
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
			grid-template-columns: 1fr;
		}
	}

	@media (min-width: 769px) and (max-width: 1024px) {
		.grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1025px) {
		.grid {
			grid-template-columns: repeat(auto-fit, minmax(max(300px, calc((100% - 3rem) / 3)), 1fr));
		}
	}
</style>
