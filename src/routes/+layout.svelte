<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { theme } from '$lib/stores/uiStore';

	let { children } = $props();

	$effect(() => {
		document.documentElement.setAttribute('data-theme', $theme);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="drawer transition-all duration-300">
	<input id="my-drawer" type="checkbox" class="drawer-toggle" />
	<div class="drawer-content flex flex-col">
		<Header />
		<main class="p-4 transition-all duration-300">
			{@render children?.()}
		</main>
	</div>
	<div class="drawer-side transition-all duration-300">
		<label
			for="my-drawer"
			aria-label="close sidebar"
			class="drawer-overlay transition-all duration-300"
		></label>
		<Sidebar />
	</div>
</div>
