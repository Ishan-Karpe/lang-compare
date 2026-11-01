<script lang="ts">
	import { page } from '$app/stores';
	import comparisonData from '$lib/data/comparison-data.json';
	import type { ComparisonRow, Snippet } from '$lib/types';
	import { selectedFeatures, visibleLanguages, homeLanguage } from '$lib/stores/uiStore';
	import { bridgeBadge } from '$lib/utils/bridge';
	import { decodeSelection, encodeSelection } from '$lib/utils/cheatsheet';
	import { slugify } from '$lib/utils/slugify';

	const rows = comparisonData.rows as unknown as ComparisonRow[];

	// URL params win (shared link); otherwise fall back to the live session state.
	const selection = $derived(
		(() => {
			const fromUrl = decodeSelection($page.url.searchParams);
			return {
				features: fromUrl.features.length ? fromUrl.features : $selectedFeatures,
				langs: fromUrl.langs.length ? fromUrl.langs : $visibleLanguages,
				home: fromUrl.home ?? $homeLanguage
			};
		})()
	);

	const sheetRows = $derived(
		rows
			.filter((r) => selection.features.includes(slugify(r.feature)))
			.map((r) => {
				// Same rule as the main page: the home language is always shown, and pinned first.
				const homeSnippet = r.snippets.find((s: Snippet) => s.language === selection.home);
				const others = r.snippets.filter(
					(s: Snippet) =>
						s !== homeSnippet &&
						(selection.langs.length === 0 || selection.langs.includes(s.language))
				);
				return {
					...r,
					homeSnippet,
					snippets: homeSnippet ? [homeSnippet, ...others] : others
				};
			})
	);

	let copied = $state(false);

	async function copyShareLink() {
		const url = `${location.origin}/cheatsheet${encodeSelection(selection)}`;
		await navigator.clipboard.writeText(url);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<svelte:head>
	<title>My Cheatsheet — LangCompare</title>
</svelte:head>

<div class="container mx-auto max-w-5xl px-4 py-6">
	<div class="mb-6 flex flex-wrap items-center gap-3 print:hidden">
		<h1 class="flex-1 text-2xl font-bold">My Cheatsheet</h1>
		<a href="/" class="btn btn-ghost btn-sm">← Back</a>
		<button class="btn btn-outline btn-sm" onclick={copyShareLink}>
			{copied ? 'Link copied!' : 'Copy share link'}
		</button>
		<button class="btn btn-sm btn-primary" onclick={() => window.print()}>
			Print / Save as PDF
		</button>
	</div>

	{#if sheetRows.length === 0}
		<div class="alert print:hidden">
			<span>
				Your cheatsheet is empty. Go back and tap the <strong>+</strong> next to any feature title to
				add it.
			</span>
		</div>
	{:else}
		{#each sheetRows as row (row.feature)}
			<section class="cheat-section mb-6 break-inside-avoid">
				<h2 class="mb-2 border-b border-base-300 pb-1 text-lg font-semibold">
					{row.feature}
					<span class="ml-2 text-xs font-normal text-base-content/50">{row.category}</span>
				</h2>
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
					{#each row.snippets as snippet (snippet.language)}
						{@const badge = bridgeBadge(row, row.homeSnippet, snippet)}
						<div class="rounded-lg border border-base-300 bg-base-100 p-3">
							<div class="mb-1 text-xs font-medium tracking-wide text-base-content/60 uppercase">
								{snippet.language}
								{#if snippet.language === selection.home}
									<span class="badge badge-xs badge-primary">your language</span>
								{/if}
							</div>
							{#if badge?.note}
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								<p class="bridge-note mb-2 text-xs">{@html badge.note}</p>
							{/if}
							<div class="code-content font-mono text-xs whitespace-pre-wrap">
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								{@html snippet.contentHtml}
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/each}
	{/if}
</div>

<style>
	.code-content :global(pre) {
		margin: 0;
		padding: 0;
		background: transparent;
	}

	.bridge-note :global(code) {
		border-radius: 0.25rem;
		background: var(--color-base-300);
		padding: 0 0.25rem;
	}

	@media print {
		.cheat-section {
			page-break-inside: avoid;
		}
	}
</style>
