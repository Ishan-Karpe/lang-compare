<script lang="ts">
	import type { PageData } from './$types';
	import ComparisonTable from '$lib/components/ComparisonTable.svelte';
	import LanguageToggles from '$lib/components/LanguageToggles.svelte';
	import LearnBar from '$lib/components/LearnBar.svelte';
	import { onMount } from 'svelte';
	import { setupSmoothScroll } from '$lib/utils/smoothScroll';
	import { setupCopyButtons } from '$lib/utils/clipboard';
	import {
		activeRunnerLanguages,
		selectedFeatures,
		visibleLanguages,
		homeLanguage
	} from '$lib/stores/uiStore';
	import { encodeSelection } from '$lib/utils/cheatsheet';
	import { syncRunners } from '$lib/utils/runner';

	let { data } = $props<{ data: PageData }>();

	const cheatsheetHref = $derived(
		`/cheatsheet${encodeSelection({
			features: $selectedFeatures,
			langs: $visibleLanguages,
			home: $homeLanguage
		})}`
	);

	// Only a learning selection preloads. While browsing, runners load on the first Run click.
	$effect(() => {
		if ($activeRunnerLanguages.length > 0) {
			syncRunners($activeRunnerLanguages, Boolean($homeLanguage));
		}
	});

	onMount(() => {
		setupSmoothScroll();
		setupCopyButtons();
	});
</script>

<svelte:head>
	<title>LangCompare: learn a language from one you already know</title>
</svelte:head>

<LearnBar rows={data.comparisonData} />

<!-- Language toggles (sticky toolbar) -->
<LanguageToggles />

<div class="container mx-auto box-border max-w-full">
	<ComparisonTable comparisonData={data.comparisonData} />
</div>

{#if $selectedFeatures.length > 0}
	<a
		href={cheatsheetHref}
		class="btn fixed right-4 bottom-4 z-40 shadow-lg btn-primary"
		aria-label="Open cheatsheet"
	>
		📋 Cheatsheet ({$selectedFeatures.length})
	</a>
{/if}
