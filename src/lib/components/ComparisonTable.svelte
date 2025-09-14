<script lang="ts">
	import type { Snippet } from '$lib/types';
	import CodeCard from './CodeCard.svelte';
	import { detailLevel, visibleLanguages } from '$lib/stores/uiStore';
	import slugify from '$lib/utils/slugify';

	interface ComparisonRow {
		category: string;
		categoryDetailLevel: 'simple' | 'detailed' | 'expert';
		feature: string;
		snippets: Snippet[];
	}

	// accept comparison data as a prop
	let { comparisonData = [] }: { comparisonData: ComparisonRow[] } = $props();

	// Active languages (from persisted store). If empty, we treat as "all languages"
	// Svelte auto-subscription via $visibleLanguages
	const activeLangs = $derived(
		$visibleLanguages && $visibleLanguages.length > 0
			? $visibleLanguages
			: (() => {
					// derive full list from comparisonData (first-seen order)
					const list: string[] = [];
					for (const row of comparisonData) {
						for (const s of row.snippets) {
							if (!list.includes(s.language)) {
								list.push(s.language);
							}
						}
					}
					return list;
				})()
	);

	// Reactive derived groupedData based on comparisonData and currentDetailLevel
	const groupedData = $derived(
		(() => {
			// Filter categories based on detail level
			const filteredData = comparisonData.filter((row) => {
				// Show categories that match or are less complex than current detail level
				if ($detailLevel === 'expert') {
					return true; // Show all categories in expert mode
				} else if ($detailLevel === 'detailed') {
					// Show simple and detailed categories
					return row.categoryDetailLevel === 'simple' || row.categoryDetailLevel === 'detailed';
				} else {
					// Show only simple categories in simple mode
					return row.categoryDetailLevel === 'simple';
				}
			});

			// Group the filtered data
			const newGroupedData: Record<string, ComparisonRow[]> = {};
			for (const row of filteredData) {
				if (!newGroupedData[row.category]) {
					newGroupedData[row.category] = [];
				}
				newGroupedData[row.category].push(row);
			}

			return newGroupedData;
		})()
	);

	// Helper: given a row and a language name, find the snippet or undefined
	function findSnippet(row: ComparisonRow, lang: string): Snippet | undefined {
		return row.snippets.find((s) => s.language === lang);
	}
</script>

{#each Object.entries(groupedData) as [category, rows] (category)}
	<section id={slugify(category)} class="mt-12 transition-all duration-300">
		<h2 class="mb-6 text-3xl font-extrabold transition-all duration-300">{category}</h2>
		<div class="overflow-x-auto rounded-box transition-all duration-300">
			<table class="table w-full table-zebra transition-all duration-300">
				<thead>
					<tr>
						<th class="transition-all duration-200">Description</th>
						{#if activeLangs && activeLangs.length > 0}
							{#each activeLangs as lang (lang)}
								<th class="transition-all duration-200">{lang}</th>
							{/each}
						{/if}
					</tr>
				</thead>
				<tbody>
					{#each rows as row (row.feature)}
						<tr
							id={`${slugify(category)}-${slugify(row.feature)}`}
							class="transition-all duration-200 hover:bg-base-200"
						>
							<td class="transition-all duration-200">{row.feature}</td>
							{#each activeLangs as lang (lang)}
								{@const s = findSnippet(row, lang)}
								<td class="transition-all duration-200">
									{#if s}
										<CodeCard snippet={s} />
									{/if}
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>
{/each}
