<script lang="ts">
	// This would normally come from the page data
	// For now, we'll extract it from the JSON file
	import comparisonData from '$lib/data/comparison-data.json';
	import { slugify } from '$lib/utils/slugify';
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

<nav class="sidebar-nav">
	<ul
		id="feature-menu"
		class="menu min-h-full w-60 border-r border-base-300 bg-base-100 p-4 text-base-content lg:w-72"
	>
		<li class="mb-4 menu-title">
			<span class="text-xl font-bold">Categories</span>
		</li>
		{#each menuItems as item (item.id)}
			<li class="mb-1">
				<a
					href="#{item.id}"
					class="nav-link rounded-lg font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary"
				>
					<span class="text-base">{item.label}</span>
				</a>
			</li>
		{/each}
	</ul>
</nav>

<style>
	.sidebar-nav {
		height: 100%;
		overflow-y: auto;
	}

	.nav-link {
		padding: 0.75rem 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.nav-link:hover {
		transform: translateX(4px);
	}

	/* Active link styling */
	:global(.nav-link.active) {
		background-color: hsl(var(--p) / 0.15);
		color: hsl(var(--p));
		font-weight: 600;
	}

	/* Smooth scrollbar for sidebar */
	.sidebar-nav::-webkit-scrollbar {
		width: 8px;
	}

	.sidebar-nav::-webkit-scrollbar-track {
		background: transparent;
	}

	.sidebar-nav::-webkit-scrollbar-thumb {
		background: hsl(var(--bc) / 0.2);
		border-radius: 4px;
	}

	.sidebar-nav::-webkit-scrollbar-thumb:hover {
		background: hsl(var(--bc) / 0.3);
	}
</style>
