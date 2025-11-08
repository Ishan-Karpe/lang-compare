<script lang="ts">
	import { slugify } from '$lib/utils/slugify';

	let { category, description = '' } = $props<{ category: string; description?: string }>();

	// Generate ID for anchor navigation
	const categoryId = slugify(category);

	// Icon mapping for categories
	const categoryIcons: Record<string, string> = {
		'Data Structures': '📊',
		'Control Flow': '🔀',
		Functions: '⚡',
		'Object-Oriented Programming': '🎯',
		'Error Handling': '🛡️',
		'Concurrency & Async': '🔄',
		'File I/O': '📁',
		Networking: '🌐',
		Testing: '🧪',
		Metaprogramming: '🔮',
		'Standard Library': '📚',
		'Memory Management': '💾',
		'Type System': '🏷️'
	};

	const icon = categoryIcons[category] || '📌';
</script>

<div id={categoryId} class="category-header mb-8 scroll-mt-24">
	<div
		class="card border-l-4 border-primary bg-gradient-to-r from-primary/10 to-secondary/10 shadow-sm transition-shadow duration-200 hover:shadow-md"
	>
		<div class="card-body p-6">
			<h2 class="card-title flex items-center gap-3 text-3xl font-bold tracking-tight">
				<span class="text-4xl">{icon}</span>
				<span>{category}</span>
			</h2>
			{#if description}
				<p class="mt-2 text-base-content/70">{description}</p>
			{/if}
		</div>
	</div>
</div>

<style>
	.category-header {
		animation: fadeInUp 0.3s ease-out;
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
