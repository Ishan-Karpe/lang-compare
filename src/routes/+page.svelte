<script lang="ts">
	import type { PageData } from './$types';
	import ComparisonTable from '$lib/components/ComparisonTable.svelte';
	import LanguageToggles from '$lib/components/LanguageToggles.svelte';

	let { data } = $props<{ data: PageData }>();
</script>

<!-- Language toggles (sticky toolbar) -->
<LanguageToggles />

<div class="container mx-auto">
	<ComparisonTable comparisonData={data.comparisonData} />
</div>
