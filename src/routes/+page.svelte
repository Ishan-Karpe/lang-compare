<script lang="ts">
	import type { PageData } from './$types';
	import ComparisonTable from '$lib/components/ComparisonTable.svelte';
	import LanguageToggles from '$lib/components/LanguageToggles.svelte';
	import { onMount } from 'svelte';
	import { setupSmoothScroll } from '$lib/utils/smoothScroll';
	import { setupCopyButtons } from '$lib/utils/clipboard';
	import { selectedFeatures, visibleLanguages, homeLanguage } from '$lib/stores/uiStore';
	import { encodeSelection } from '$lib/utils/cheatsheet';

	let { data } = $props<{ data: PageData }>();

	const cheatsheetHref = $derived(
		`/cheatsheet${encodeSelection({
			features: $selectedFeatures,
			langs: $visibleLanguages,
			home: $homeLanguage
		})}`
	);

	onMount(() => {
		setupSmoothScroll();
		setupCopyButtons();
	});
</script>

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
