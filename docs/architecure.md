# **Language Comparison SPA Frontend Architecture Document**

### **Template and Framework Selection**

The project will be bootstrapped using the official **SvelteKit 5 starter template**, which is initialized via `npm create svelte@latest`.

This selection directly aligns with our technology stack and provides the necessary foundation for a modern, high-performance web application. It includes a Vite-powered build system and is pre-configured to work with TypeScript. We will explicitly configure it to use `adapter-static` to produce the static site output required by the PRD.

This starter provides the complete project structure, development server, and build tooling required, allowing us to focus immediately on application logic rather than boilerplate setup.

#### **Change Log**

| Date            | Version | Description                | Author             |
| :-------------- | :------ | :------------------------- | :----------------- |
| August 21, 2025 | 1.0     | Initial Architecture Draft | Winston, Architect |

### **Frontend Tech Stack**

#### **Technology Stack Table**

| Category           | Technology               | Version | Purpose                           | Rationale                                                 |
| :----------------- | :----------------------- | :------ | :-------------------------------- | :-------------------------------------------------------- |
| Framework          | SvelteKit                | ^2.5.0  | Core application framework        | Provides SSG, routing, and a modern dev experience.       |
| Language           | TypeScript               | ^5.0.0  | Type safety and developer tooling | Catches errors early and improves code quality.           |
| Build Tool         | Vite                     | ^5.0.0  | Frontend build tooling            | Fast HMR and optimized builds, included with SvelteKit.   |
| Styling            | TailwindCSS              | ^4.0.0  | Utility-first CSS framework       | Enables rapid, consistent styling with minimal CSS.       |
| UI Library         | DaisyUI                  | ^5.0.0  | TailwindCSS component library     | Provides pre-built, accessible, and themeable components. |
| Markdown Parser    | Unified / remark         | latest  | Build-time Markdown parsing       | Robust, AST-based parsing for complex content.            |
| Syntax Highlighter | Shiki                    | latest  | Build-time syntax highlighting    | Generates high-fidelity, theme-aware HTML.                |
| Testing            | Vitest / Testing Library | latest  | Unit and component testing        | Fast, modern testing framework integrated with Vite.      |

### **Project Structure**

```plaintext
/
├── scripts/
│   └── prepare-data.mjs      # Build-time script to parse MD and generate JSON
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── Header.svelte         # Top header component
│   │   │   ├── Sidebar.svelte        # Left sidebar component
│   │   │   ├── ComparisonTable.svelte# Main table rendering component
│   │   │   └── CodeCard.svelte       # Individual cell for a code snippet
│   │   ├── stores/
│   │   │   └── uiStore.ts          # Svelte store for theme & detail level
│   │   └── types/
│   │       └── index.ts            # TypeScript types for our parsed data
│   ├── routes/
│   │   ├── +page.svelte          # The main page component
│   │   └── +page.ts              # The SvelteKit loader for our static data
│   └── app.html                    # Main HTML template
├── static/
│   └── language_comparison.md    # The raw source of truth (copied to build)
├── tests/
│   └── setup.ts                  # Test setup and config
├── package.json
├── svelte.config.js
└── tailwind.config.js
```

### **Component Standards**

#### **Component Template**

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

#### **Naming Conventions**

- **Components:** `PascalCase.svelte` (e.g., `ComparisonTable.svelte`)
- **TypeScript Files:** `camelCase.ts` (e.g., `uiStore.ts`)
- **Test Files:** `Component.test.ts` (e.g., `CodeCard.test.ts`)

### **State Management**

#### **Store Structure**

Global UI state will be managed in `src/lib/stores/uiStore.ts`.

```typescript
// src/lib/stores/uiStore.ts
import { persisted } from 'svelte-persisted-store';

export type Theme = 'light' | 'dark' | 'black';
export type DetailLevel = 'simple' | 'detailed' | 'expert';

// Theme will be persisted to localStorage
export const theme = persisted<Theme>('ui-theme', 'dark');

// Detail level is session-only
export const detailLevel = $state<DetailLevel>('simple');
```

### **API Integration (Data Loading)**

#### **Data Type Definition**

The structure of our `comparison-data.json` will be strongly typed.

```typescript
// src/lib/types/index.ts
export interface ComparisonRow {
	category: string;
	feature: string;
	snippets: Snippet[];
}

export interface Snippet {
	language: string;
	detailLevel: 'simple' | 'detailed' | 'expert';
	highlightedCode: string; // Pre-rendered HTML from Shiki
	explanation: string;
}
```

#### **Static Data Loader**

The data will be loaded at build time using a SvelteKit `+page.ts` loader.

```typescript
// src/routes/+page.ts
import type { PageLoad } from './$types';
import * as data from '$lib/data/comparison-data.json';

export const load: PageLoad = () => {
	// In a static build, this runs at build time.
	// The data is then embedded in the generated HTML.
	return {
		comparisonData: data.rows as ComparisonRow[]
	};
};
```

### **Routing**

Routing is handled by the SvelteKit file-based router. Our application has a single route:

- `/`: The main page, defined by `src/routes/+page.svelte`.

### **Styling Guidelines**

#### **Styling Approach**

All styling will be done using TailwindCSS utility classes. DaisyUI will be used for component-level styling and theming. Custom CSS should be avoided unless absolutely necessary.

#### **Global Theme Configuration**

The `tailwind.config.js` will be configured to enable the required DaisyUI themes.

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {}
	},
	plugins: [require('daisyui')],
	daisyui: {
		themes: ['light', 'dark', 'black'] // Enable required themes
	}
};
```

### **Testing Requirements**

#### **Component Test Template**

```typescript
// src/lib/components/Header.test.ts
import { render, screen } from '@testing-library/svelte';
import { expect, test } from 'vitest';
import Header from './Header.svelte';

test('renders the application title', () => {
	render(Header);
	const title = screen.getByText(/Language Comparison/i);
	expect(title).toBeInTheDocument();
});
```

### **Frontend Developer Standards**

#### **Critical Coding Rules**

1.  **Do Not Fetch Markdown:** The client-side application must NEVER fetch or parse the `.md` file. All data must come from the pre-processed `comparison-data.json` via the SvelteKit loader.
2.  **Use `@html` Safely:** The `@html` tag should only be used to render the pre-highlighted HTML from `Shiki`. Do not use it for any other dynamic content.
3.  **Leverage DaisyUI:** Before creating a custom component, check if a DaisyUI equivalent exists.
4.  **Manage State in Stores:** All global state (theme, detail level) must be managed in the central Svelte store.

---

### **Architect's Rationale**

This architecture is designed for **maximum performance, simplicity, and maintainability**. By adopting a **Static Site Generation (SSG)** approach with a **build-time data transformation pipeline**, we completely mitigate the risks associated with client-side parsing and syntax highlighting.

The end-user receives a pre-rendered, highly optimized static site that loads instantly. All the heavy lifting is done once at build time. The small amount of JavaScript that ships to the client is only for "hydrating" the UI to enable the interactive controls, providing a rich user experience without sacrificing performance.

This plan provides a clear and robust blueprint for the developer agents to execute. The separation of concerns between the data pipeline and the SvelteKit application ensures the project will be easy to understand, test, and maintain.

---
