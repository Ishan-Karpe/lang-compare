<script lang="ts">
	import comparisonData from '$lib/data/comparison-data.json';
	import {
		visibleLanguages,
		toggleLanguage,
		setLanguages,
		clearLanguages
	} from '$lib/stores/uiStore';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';

	// Derive a stable ordered list of languages from the data (first-seen order)
	const allLanguages: string[] = (() => {
		const list: string[] = [];
		for (const row of comparisonData.rows as Array<{ snippets: Array<{ language: string }> }>) {
			for (const s of row.snippets as Array<{ language: string }>) {
				if (!list.includes(s.language)) {
					list.push(s.language);
				}
			}
		}
		return list;
	})();

	// Default languages to show when first launching the site
	const defaultLanguages = ['Java (LTS)', 'Python 3.12'];

	// Language emoji/icon mapping
	const languageIcons: Record<string, string> = {
		'Python 3.12': '🐍',
		'JavaScript (ES6+)': '💛',
		'TypeScript': '💙',
		'Java (LTS)': '☕',
		'Rust': '🦀',
		'Go': '🐹',
		'C (C17)': '⚙️',
		'C++ (C++20)': '⚡'
	};

	// Count snippets per language for display
	const languageCounts: Record<string, number> = (() => {
		const counts: Record<string, number> = {};
		for (const row of comparisonData.rows as Array<{ snippets: Array<{ language: string }> }>) {
			for (const s of row.snippets as Array<{ language: string }>) {
				counts[s.language] = (counts[s.language] || 0) + 1;
			}
		}
		return counts;
	})();

	// Initialize persisted store on first mount if empty
	onMount(() => {
		const cur = get(visibleLanguages) || [];
		if (!cur || cur.length === 0) {
			// Filter defaultLanguages to only include those that exist in allLanguages
			const availableDefaults = defaultLanguages.filter((lang) => allLanguages.includes(lang));
			setLanguages(availableDefaults.length > 0 ? availableDefaults : allLanguages);
		}
	});

	function toggle(lang: string) {
		toggleLanguage(lang);
	}

	function selectAll() {
		setLanguages(allLanguages);
	}

	function unselectAll() {
		// Setting to empty will be interpreted as "show none" by UI,
		// but ComparisonTable treats empty as "all" — we prefer explicit empty;
		// callers can use this to clear selection.
		clearLanguages();
	}
</script>

<div class="language-toolbar sticky top-16 z-10 border-b border-base-200 bg-base-100/95 backdrop-blur-sm shadow-sm max-w-full overflow-hidden">
	<div class="container mx-auto py-3 px-4 max-w-full">
		<div
			class="flex items-center gap-3 overflow-x-auto scrollbar-hide"
			role="toolbar"
			aria-label="Language selection controls"
		>
			<!-- Quick Select Section -->
			<div class="flex items-center gap-2 pr-3 border-r border-base-300">
				<span class="text-sm font-medium text-base-content/70 hidden sm:inline">Quick:</span>
				<button
					class="btn btn-sm btn-primary btn-outline gap-1"
					on:click={selectAll}
					aria-label="Show all languages"
					title="Show all languages"
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
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					All
				</button>
				<button
					class="btn btn-sm btn-ghost gap-1"
					on:click={unselectAll}
					aria-label="Clear language selection"
					title="Clear language selection"
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
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
					None
				</button>
			</div>

			<!-- Language Pills -->
			<div class="flex items-center gap-2 flex-wrap">
				{#if allLanguages.length > 0}
					{#each allLanguages as lang (lang)}
						{@const isActive = $visibleLanguages && $visibleLanguages.includes(lang)}
						{@const count = languageCounts[lang] || 0}
						<button
							class="language-pill btn btn-sm gap-2 transition-all duration-200"
							class:btn-primary={isActive}
							class:btn-outline={!isActive}
							class:pill-active={isActive}
							aria-pressed={isActive}
							aria-label={`Toggle ${lang} - ${count} examples`}
							title={`${lang} (${count} examples)`}
							on:click={() => toggle(lang)}
						>
							<span class="font-medium whitespace-nowrap">{lang}</span>
							{#if isActive}
								<span class="badge badge-sm badge-primary opacity-70">{count}</span>
							{/if}
						</button>
					{/each}
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.language-toolbar {
		animation: slideDown 0.3s ease-out;
	}

	@keyframes slideDown {
		from {
			transform: translateY(-10px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.language-pill {
		min-height: 2.5rem;
		border-radius: 9999px;
	}

	.language-pill:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.pill-active {
		transform: scale(1.05);
	}

	.pill-active:hover {
		transform: translateY(-2px) scale(1.05);
	}

	/* Hide scrollbar but keep functionality */
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}

	/* Mobile optimizations */
	@media (max-width: 640px) {
		.language-toolbar {
			position: relative;
			top: auto;
		}

		.language-pill {
			min-height: 2.25rem;
			font-size: 0.875rem;
			flex-shrink: 0;
		}
	}
</style>
