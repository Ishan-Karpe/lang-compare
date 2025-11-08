<script lang="ts">
	function scrollToTop() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

<footer class="mt-16 border-t border-base-300 bg-base-200">
	<div class="container mx-auto max-w-screen-2xl px-4 py-8">
		<div class="flex flex-col items-center gap-6">
			<!-- Back to Top Link -->
			<button
				on:click={scrollToTop}
				class="btn gap-2 btn-ghost transition-all duration-200 btn-sm hover:bg-base-300"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5 10l7-7m0 0l7 7m-7-7v18"
					/>
				</svg>
				Home
			</button>

			<!-- Built By Section -->
			<div class="space-y-3 text-center">
				<h3 class="text-lg font-semibold text-base-content/90">BUILT BY</h3>
				<p class="text-base-content/70">
					<span class="font-medium text-primary">Ishan Karpe</span>
				</p>
				<div class="space-y-1 text-sm text-base-content/60">
					<p>Built with SvelteKit</p>
					<p>Styled with Tailwind CSS & DaisyUI</p>
				</div>
			</div>

			<!-- Copyright -->
			<p class="text-xs text-base-content/50">
				© {new Date().getFullYear()} LangCompare. All rights reserved.
			</p>
		</div>
	</div>
</footer>

<style>
	footer {
		animation: fadeIn 0.5s ease-out;
	}

	@keyframes fadeIn {
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
