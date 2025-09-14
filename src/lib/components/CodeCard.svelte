<script lang="ts">
	import type { Snippet } from '$lib/types';
	import { detailLevel } from '$lib/stores/uiStore';

	let { snippet } = $props<{ snippet: Snippet }>();

	// Define the hierarchy of detail levels
	const detailHierarchy: Record<'simple' | 'detailed' | 'expert', number> = {
		simple: 0,
		detailed: 1,
		expert: 2
	};

	// Determine if this card should be visible based on the current detail level
	let isVisible = $state(false);

	$effect(() => {
		const unsubscribe = detailLevel.subscribe((currentLevel: 'simple' | 'detailed' | 'expert') => {
			isVisible =
				detailHierarchy[snippet.detailLevel as keyof typeof detailHierarchy] <=
				detailHierarchy[currentLevel];
		});
		return () => unsubscribe();
	});
</script>

<div
	class="font-mono text-sm whitespace-pre-wrap transition-all duration-300 ease-in-out"
	class:hidden={!isVisible}
>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html snippet.contentHtml}
</div>
