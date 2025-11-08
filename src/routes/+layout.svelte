<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { theme } from '$lib/stores/uiStore';
	import { onMount } from 'svelte';

	let { children } = $props();

	// Drawer state - closed by default on all screen sizes
	let drawerOpen = $state(false);

	$effect(() => {
		document.documentElement.setAttribute('data-theme', $theme);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="drawer transition-all duration-300 max-w-full overflow-x-hidden">
	<input id="my-drawer" type="checkbox" class="drawer-toggle" bind:checked={drawerOpen} />
	<div class="drawer-content flex flex-col max-w-full overflow-x-hidden">
		<Header />
		<main class="p-4 sm:p-6 lg:p-8 transition-all duration-300 max-w-screen-2xl mx-auto w-full box-border">
			{@render children?.()}
		</main>
	</div>
	<div class="drawer-side transition-all duration-300 z-50">
		<label
			for="my-drawer"
			aria-label="close sidebar"
			class="drawer-overlay transition-all duration-300"
		></label>
		<Sidebar />
	</div>
</div>

<style>
	/* Ensure drawer overlay is also at high z-index */
	:global(.drawer-overlay) {
		z-index: 50;
	}

	/* Ensure sidebar content is above overlay */
	:global(.drawer-side > nav) {
		z-index: 51;
	}
</style>
