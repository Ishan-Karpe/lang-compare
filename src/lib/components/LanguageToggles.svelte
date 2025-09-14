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

	// Initialize persisted store on first mount if empty
	onMount(() => {
		const cur = get(visibleLanguages) || [];
		if (!cur || cur.length === 0) {
			setLanguages(allLanguages);
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

<div class="z-20 border-b border-base-200 bg-base-100/90 backdrop-blur-sm">
	<div class="container mx-auto py-2">
		<div
			class="flex items-center gap-2 overflow-x-auto px-2"
			role="toolbar"
			aria-label="Language column toggles"
		>
			<button
				class="btn btn-ghost btn-sm"
				on:click={selectAll}
				aria-label="Show all languages"
				title="Show all languages"
			>
				All
			</button>
			<button
				class="btn btn-ghost btn-sm"
				on:click={unselectAll}
				aria-label="Clear language selection"
				title="Clear language selection"
			>
				None
			</button>

			{#if allLanguages.length > 0}
				{#each allLanguages as lang (lang)}
					<button
						class="btn whitespace-nowrap lowercase btn-outline btn-sm focus-visible:ring focus-visible:ring-primary"
						class:btn-active={$visibleLanguages && $visibleLanguages.includes(lang)}
						aria-pressed={$visibleLanguages ? $visibleLanguages.includes(lang) : false}
						aria-label={`Toggle ${lang} column`}
						title={`Toggle ${lang} column`}
						on:click={() => toggle(lang)}
					>
						{lang}
					</button>
				{/each}
			{/if}
		</div>
	</div>
</div>
