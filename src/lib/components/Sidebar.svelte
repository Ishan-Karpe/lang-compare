<script lang="ts">
	// This would normally come from the page data
	// For now, we'll extract it from the JSON file
	import comparisonData from '$lib/data/comparison-data.json';
	import slugify from '$lib/utils/slugify';
	import { detailLevel } from '$lib/stores/uiStore';
	import { SvelteMap } from 'svelte/reactivity';

	// Extract unique categories with their features and detail levels
	const categories = new SvelteMap<
		string,
		{ features: string[]; detailLevel: 'simple' | 'detailed' | 'expert' }
	>();

	for (const row of comparisonData.rows) {
		if (!categories.has(row.category)) {
			categories.set(row.category, {
				features: [],
				detailLevel: row.categoryDetailLevel as 'simple' | 'detailed' | 'expert'
			});
		}
		const entry = categories.get(row.category)!;
		if (!entry.features.includes(row.feature)) {
			entry.features.push(row.feature);
		}
	}

	function shouldShowCategory(
		categoryLevel: 'simple' | 'detailed' | 'expert',
		currentLevel: 'simple' | 'detailed' | 'expert'
	) {
		if (currentLevel === 'expert') return true;
		if (currentLevel === 'detailed')
			return categoryLevel === 'simple' || categoryLevel === 'detailed';
		return categoryLevel === 'simple';
	}

	// Use $derived to properly react to detailLevel changes
	const menuItems = $derived(
		Array.from(categories.entries())
			.filter(([, entry]) => shouldShowCategory(entry.detailLevel, $detailLevel))
			.map(([category, entry]) => ({
				id: slugify(category),
				label: category,
				children: entry.features.map((feature) => ({ id: slugify(feature), label: feature }))
			}))
	);
</script>

<nav>
	<ul
		id="feature-menu"
		class="menu min-h-full w-60 bg-base-100 p-4 text-base-content transition-all duration-300"
	>
		<li class="menu-title">
			<span class="text-lg font-bold">Features</span>
		</li>
		{#each menuItems as item (item.id)}
			<li>
				<a href="#{item.id}" class="rounded-btn transition-all duration-200 hover:bg-base-200">
					{item.label}
				</a>
				{#if item.children && item.children.length > 0}
					<ul class="ml-4">
						{#each item.children as child (child.id)}
							<li>
								<a
									href="#{item.id}-{child.id}"
									class="rounded-btn transition-all duration-200 hover:bg-base-200"
								>
									{child.label}
								</a>
							</li>
						{/each}
					</ul>
				{/if}
			</li>
		{/each}
	</ul>
</nav>
