<script lang="ts">
	import type { PageData } from './$types';
	import ComparisonTable from '$lib/components/ComparisonTable.svelte';
	import LanguageToggles from '$lib/components/LanguageToggles.svelte';
	import { onMount } from 'svelte';
	import { setupSmoothScroll } from '$lib/utils/smoothScroll';
	import { setupCopyButtons } from '$lib/utils/clipboard';

	let { data } = $props<{ data: PageData }>();

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
