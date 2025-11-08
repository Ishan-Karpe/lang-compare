<script lang="ts">
	import type { Snippet } from '$lib/types';
	import CategoryHeader from './CategoryHeader.svelte';
	import FeatureCard from './FeatureCard.svelte';
	import { detailLevel, visibleLanguages } from '$lib/stores/uiStore';

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

	// Category descriptions for better context
	const categoryDescriptions: Record<string, string> = {
		'Data Structures': 'Arrays, Lists, Maps, Sets, and Collection Types',
		'Control Flow': 'Conditional Statements, Loops, and Flow Control',
		'Functions': 'Function Declarations, Parameters, and Return Values',
		'Object-Oriented Programming': 'Classes, Inheritance, and Polymorphism',
		'Error Handling': 'Exception Handling and Error Management',
		'Concurrency & Async': 'Async/Await, Promises, and Concurrent Programming',
		'File I/O': 'File Reading, Writing, and Management',
		'Networking': 'HTTP, Sockets, and Network Communication',
		'Testing': 'Unit Tests, Assertions, and Test Frameworks',
		'Metaprogramming': 'Reflection, Decorators, and Runtime Manipulation',
		'Standard Library': 'Built-in Functions and Standard Modules',
		'Memory Management': 'Allocation, Deallocation, and Memory Control',
		'Type System': 'Type Annotations, Generics, and Type Safety'
	};
</script>

{#each Object.entries(groupedData) as [category, rows] (category)}
	<section class="category-section">
		<CategoryHeader {category} description={categoryDescriptions[category] || ''} />

		<div class="space-y-8">
			{#each rows as row (row.feature)}
				<FeatureCard feature={row.feature} snippets={row.snippets} visibleLanguages={activeLangs} />
			{/each}
		</div>
	</section>
{/each}

<style>
	.category-section {
		margin-bottom: 4rem;
		animation: fadeIn 0.4s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
