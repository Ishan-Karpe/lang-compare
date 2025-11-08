<script lang="ts">
	import { theme, detailLevel, type DetailLevel } from '$lib/stores/uiStore';
	const themes = ['light', 'dark', 'black'];
	const detailLevels: DetailLevel[] = ['simple', 'detailed', 'expert'];

	// Refs for dropdown triggers to manage focus (close dropdown on mobile)
	let detailDropdownTrigger: HTMLElement;
	let themeDropdownTrigger: HTMLElement;

	function handleDetailChange(level: DetailLevel) {
		detailLevel.set(level);
		// Close dropdown by removing focus (works on mobile and desktop)
		if (detailDropdownTrigger) {
			detailDropdownTrigger.blur();
			if (document.activeElement instanceof HTMLElement) {
				document.activeElement.blur();
			}
		}
	}

	function handleThemeChange(newTheme: string) {
		theme.set(newTheme);
		// Close dropdown by removing focus (works on mobile and desktop)
		if (themeDropdownTrigger) {
			themeDropdownTrigger.blur();
			if (document.activeElement instanceof HTMLElement) {
				document.activeElement.blur();
			}
		}
	}
</script>

<div class="sticky top-0 z-30 navbar bg-base-100 px-2 transition-all duration-300 sm:px-4">
	<div class="navbar-start gap-1 sm:gap-2">
		<label
			for="my-drawer"
			class="drawer-button btn btn-square btn-ghost transition-all duration-200 btn-sm hover:bg-base-200 sm:btn-md"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				class="inline-block h-5 w-5 stroke-current"
				><path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 6h16M4 12h16M4 18h16"
				></path></svg
			>
		</label>
		<a
			href="/"
			class="btn px-2 text-base btn-ghost transition-all duration-200 hover:bg-base-200 sm:px-4 sm:text-xl"
			>LangCompare</a
		>
	</div>
	<div class="navbar-center hidden">
		<!-- Detail Level Toggle -->
		<div class="join">
			{#each detailLevels as level (level)}
				<button
					class="btn join-item capitalize transition-all duration-200 btn-sm"
					class:btn-active={$detailLevel === level}
					onclick={() => detailLevel.set(level as DetailLevel)}
				>
					{level}
				</button>
			{/each}
		</div>
	</div>
	<div class="navbar-end gap-1 sm:gap-2">
		<!-- Detail Level Toggle (Mobile) -->
		<div class="dropdown dropdown-end">
			<div
				bind:this={detailDropdownTrigger}
				tabindex="0"
				role="button"
				class="btn px-2 text-xs btn-ghost transition-all duration-200 btn-sm hover:bg-base-200 sm:px-4 sm:text-base sm:btn-md"
			>
				{$detailLevel}
				<svg
					width="12px"
					height="12px"
					class="inline-block h-2 w-2 fill-current opacity-60 transition-transform duration-200"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 2048 2048"
					><path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path></svg
				>
			</div>
			<ul
				tabindex="0"
				class="dropdown-content z-[1] w-32 rounded-box bg-base-300 p-2 shadow-2xl transition-all duration-200"
			>
				{#each detailLevels as level (level)}
					<li>
						<button
							class="btn btn-block justify-start capitalize btn-ghost transition-all duration-200 btn-sm hover:bg-base-200"
							class:btn-active={$detailLevel === level}
							onclick={() => handleDetailChange(level)}
						>
							{level}
						</button>
					</li>
				{/each}
			</ul>
		</div>

		<div class="dropdown dropdown-end">
			<div
				bind:this={themeDropdownTrigger}
				tabindex="0"
				role="button"
				class="btn px-2 text-xs btn-ghost transition-all duration-200 btn-sm hover:bg-base-200 sm:px-4 sm:text-base sm:btn-md"
			>
				Theme
				<svg
					width="12px"
					height="12px"
					class="inline-block h-2 w-2 fill-current opacity-60 transition-transform duration-200"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 2048 2048"
					><path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path></svg
				>
			</div>
			<ul
				tabindex="0"
				class="dropdown-content z-[1] w-52 rounded-box bg-base-300 p-2 shadow-2xl transition-all duration-200"
			>
				{#each themes as t (t)}
					<li>
						<button
							class="btn btn-block justify-start btn-ghost transition-all duration-200 btn-sm hover:bg-base-200"
							class:active={$theme === t}
							onclick={() => handleThemeChange(t)}
						>
							{t.charAt(0).toUpperCase() + t.slice(1)}
						</button>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</div>
