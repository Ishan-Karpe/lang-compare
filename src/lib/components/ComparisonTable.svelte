<script lang="ts">
	import type { ComparisonRow } from '$lib/types';
	import CategoryHeader from './CategoryHeader.svelte';
	import FeatureCard from './FeatureCard.svelte';
	import {
		detailLevel,
		homeLanguage,
		learnedFeatures,
		retestSchedule,
		reviewFeatures,
		visibleLanguages
	} from '$lib/stores/uiStore';
	import {
		dueSlugs,
		learningTarget,
		lessonFeatures,
		nextLesson,
		pairKey,
		rowVisible
	} from '$lib/utils/learning';

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

	// The topic a finished card's Next button goes to
	const upcomingLesson = $derived.by(() => {
		const target = learningTarget($homeLanguage, $visibleLanguages);
		if (!$homeLanguage || !target) return null;
		const pair = pairKey($homeLanguage, target);
		return nextLesson(
			lessonFeatures(comparisonData, $detailLevel, target),
			$learnedFeatures[pair] ?? [],
			$reviewFeatures[pair] ?? [],
			dueSlugs($retestSchedule[pair], Date.now())
		);
	});

	// Reactive derived groupedData based on comparisonData and currentDetailLevel
	const groupedData = $derived(
		(() => {
			// Filter categories based on detail level
			const filteredData = comparisonData.filter((row) => {
				if (!rowVisible(row, $visibleLanguages, $homeLanguage)) return false;
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
		'Getting Started: Build, Run & Output': 'Compiling, Running, and Printing Your First Program',
		'Language Core & Typing': 'Variables, Types, Null, and Simple Data Objects',
		'Control Flow': 'Conditional Statements, Loops, and Flow Control',
		'Common Data Structures': 'Arrays, Lists, Maps, Sets, and Collection Types',
		'String Handling': 'Creating, Combining, and Slicing Text',
		'Functions & Classes': 'Function Declarations, Classes, Inheritance, and Polymorphism',
		'Ownership & Borrowing': 'Who Owns a Value, and How to Lend It',
		'Modules, Crates & Tests': 'Organizing Code, Adding Libraries, and Testing',
		'Errors & Files': 'Exception Handling, File Reading and Writing, and Input',
		'Functional Programming & Closures': 'Closures, Lambdas, and Map/Filter Pipelines',
		'Expressive Data Operations': 'Destructuring and Variable-Length Arguments',
		'Generics & Templates': 'Type Parameters on Functions and Classes',
		'System Interaction & Tooling': 'Modules, Packages, Logging, Debugging, and Memory',
		'Testing Frameworks & Ecosystem': 'Unit Tests, Assertions, and Test Frameworks',
		'Standard Library Capabilities': 'What Each Language Ships With',
		'Performance Profile (Conceptual)': 'Runtime Model and What Affects Speed',
		'Typical Use Cases & Ecosystem': 'Where Each Language Is Most Used',
		'Asynchronous Programming & Concurrency Models':
			'Async/Await, Threads, and Concurrent Programming',
		Metaprogramming: 'Reflection, Decorators, and Runtime Manipulation',
		'Interoperability (FFI)': 'Calling Native Code and Being Called by It'
	};
</script>

{#each Object.entries(groupedData) as [category, rows] (category)}
	<section class="category-section">
		<CategoryHeader {category} description={categoryDescriptions[category] || ''} />

		<div class="space-y-8">
			{#each rows as row (row.feature)}
				<FeatureCard
					feature={row.feature}
					snippets={row.snippets}
					bridgeNotes={row.bridgeNotes || {}}
					exercises={row.exercises || {}}
					requirements={row.requirements || {}}
					examples={row.examples || {}}
					{upcomingLesson}
					visibleLanguages={activeLangs}
				/>
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
