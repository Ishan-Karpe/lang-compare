<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { theme } from '$lib/stores/uiStore';

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

<div class="drawer max-w-full overflow-x-hidden transition-all duration-300">
	<input id="my-drawer" type="checkbox" class="drawer-toggle" bind:checked={drawerOpen} />
	<div class="drawer-content flex min-h-screen max-w-full flex-col overflow-x-hidden">
		<Header />
		<main
			class="mx-auto box-border w-full max-w-screen-2xl flex-grow p-4 transition-all duration-300 sm:p-6 lg:p-8"
		>
			{@render children?.()}
		</main>
		<Footer />
	</div>
	<div class="drawer-side z-50 transition-all duration-300">
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
