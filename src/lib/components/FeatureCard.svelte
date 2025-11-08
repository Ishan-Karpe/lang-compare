<script lang="ts">
	import type { Snippet } from '$lib/types';
	import CodeCard from './CodeCard.svelte';

	let {
		feature,
		snippets,
		visibleLanguages
	} = $props<{
		feature: string;
		snippets: Snippet[];
		visibleLanguages: string[];
	}>();

	// Filter snippets to only show visible languages
	const visibleSnippets = $derived(
		snippets.filter((snippet) => visibleLanguages.includes(snippet.language))
	);
</script>

{#if visibleSnippets.length > 0}
	<div class="feature-section mb-12 max-w-full">
		<h3 class="text-xl font-semibold text-base-content/90 mb-4 px-2">{feature}</h3>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-full">
			{#each visibleSnippets as snippet}
				<div class="code-card-wrapper">
					<div
						class="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 border border-base-300"
					>
						<div class="card-body p-0">
							<!-- Language Header -->
							<div
								class="flex items-center gap-2 px-5 pt-4 pb-3 border-b border-base-300 bg-base-200/50"
							>
								<div class="flex-1">
									<h4 class="font-medium text-sm uppercase tracking-wide text-base-content/80">
										{snippet.language}
									</h4>
								</div>
								<button
									class="btn btn-ghost btn-xs btn-square copy-btn"
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
							<div class="px-3 sm:px-5 py-4 bg-base-100 rounded-b-2xl overflow-x-auto max-w-full">
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
			grid-template-columns: repeat(
				auto-fit,
				minmax(max(300px, calc((100% - 3rem) / 3)), 1fr)
			);
		}
	}
</style>
