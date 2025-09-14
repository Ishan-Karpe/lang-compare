# Frontend Developer Standards and Component Conventions

This document provides the critical coding standards, component structures, and naming conventions that must be followed during development.

## 1. Critical Coding Rules

1.  **Do Not Fetch Markdown:** The client-side application must NEVER fetch or parse the `.md` file. All data must come from the pre-processed `comparison-data.json` via the SvelteKit loader.
2.  **Use `@html` Safely:** The `@html` tag should only be used to render the pre-highlighted HTML from `Shiki`. Do not use it for any other dynamic content.
3.  **Leverage DaisyUI:** Before creating a custom component, check if a DaisyUI equivalent exists.
4.  **Manage State in Stores:** All global state (theme, detail level) must be managed in the central Svelte store.

## 2. Component Template

All Svelte components should follow this structure for consistency.

```typescript
<script lang="ts">
  import type { Snippet } from '$lib/types'; // Import types

  // --- PROPS ---
  export let data: Snippet;

  // --- STATE ---
  // Local state if needed, managed by Svelte 5 runes
</script>

<!-- HTML Markup using TailwindCSS/DaisyUI classes -->
<div class="card bg-base-200">
  <div class="card-body">
    <h2 class="card-title">{data.language}</h2>
    <div>
      {@html data.highlightedCode}
    </div>
  </div>
</div>

<style>
  /* Scoped styles if necessary, but prefer Tailwind utilities */
</style>
```

## 3. Naming Conventions

- **Components:** `PascalCase.svelte` (e.g., `ComparisonTable.svelte`)
- **TypeScript Files:** `camelCase.ts` (e.g., `uiStore.ts`)
- **Test Files:** `Component.test.ts` (e.g., `CodeCard.test.ts`)
