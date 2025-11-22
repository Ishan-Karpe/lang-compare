# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LangCompare is a static site for comparing programming languages side-by-side across various categories. Built with SvelteKit 2, TypeScript, TailwindCSS 4, and DaisyUI 5, it uses a modern card-based layout with syntax-highlighted code snippets.

## Essential Commands

### Development

```bash
npm run dev              # Start development server
npm run dev -- --open    # Start dev server and open browser
```

### Building

```bash
npm run build            # Build production (includes data preparation)
npm run preview          # Preview production build
```

The build process automatically runs `scripts/prepare-data.mjs` before compilation, which transforms `data/language_comparison.md` into `src/lib/data/comparison-data.json`.

### Testing

```bash
npm test                 # Run all tests (unit + e2e)
npm run test:unit        # Run Vitest unit tests only
npm run test:e2e         # Run Playwright e2e tests only
npm run check            # TypeScript and Svelte type checking
npm run check:watch      # Type checking in watch mode
```

### Code Quality

```bash
npm run lint             # Check formatting and linting
npm run format           # Auto-format with Prettier
```

## Core Architecture

### Data Flow Pipeline

1. **Source**: `data/language_comparison.md` - Markdown tables with code snippets
2. **Build-time Transform**: `scripts/prepare-data.mjs` parses markdown, applies Shiki syntax highlighting, and generates JSON
3. **Runtime**: `src/lib/data/comparison-data.json` is loaded as static data
4. **Component Rendering**: ComparisonTable groups by category, FeatureCard displays code snippets

**Key Detail**: All syntax highlighting happens at build time using Shiki. The contentHtml in JSON is pre-highlighted HTML, not raw code.

### Component Hierarchy

```
+layout.svelte (drawer wrapper, theme management)
├── Header.svelte (theme switcher, detail level selector)
├── Sidebar.svelte (category navigation, auto-filtered by detail level)
└── +page.svelte
    ├── LanguageToggles.svelte (sticky language selector)
    └── ComparisonTable.svelte
        ├── CategoryHeader.svelte (gradient header with emoji)
        └── FeatureCard.svelte (responsive grid of code cards)
            └── CodeCard.svelte (individual code snippet display)
```

### State Management (Svelte 5 Runes)

- **Persisted stores** (via `svelte-persisted-store`):
  - `theme`: 'dark' | 'light' | 'black' (default: 'dark')
  - `visibleLanguages`: string[] of selected languages

- **Session-only stores**:
  - `detailLevel`: 'simple' | 'detailed' | 'expert' (default: 'simple')

- **Reactive derivations** ($derived):
  - ComparisonTable filters categories by detail level
  - FeatureCard filters snippets by visible languages
  - Sidebar menu items filtered by detail level

### Detail Level System

Categories and snippets can be tagged with detail levels in the markdown:

- `<!-- detail:simple -->` - Basic concepts (default)
- `<!-- detail:detailed -->` - Intermediate topics
- `<!-- detail:expert -->` - Advanced features

The UI filters content based on the selected detail level:

- **Simple**: Shows only simple categories
- **Detailed**: Shows simple + detailed categories
- **Expert**: Shows all content

### Theme System

Uses DaisyUI themes applied via `data-theme` attribute on `<html>`. The theme store is persisted to localStorage and applied in +layout.svelte via `$effect()`.

### Drawer (Sidebar) Behavior

- **Desktop (≥1024px)**: Opens by default on mount
- **Mobile (<1024px)**: Closed by default
- **Toggle**: Hamburger menu in Header controls drawer state
- **Z-index**: drawer-side (z-50) > drawer-overlay (z-50), sidebar nav (z-51)
- **Language toolbar**: z-10 (below drawer)

## Important Patterns

### Build-Time Data Preparation

When modifying `data/language_comparison.md`:

1. Follow markdown table format with headers: `| Concept | Description | Python 3.12 | JavaScript (ES6+) | ... |`
2. Add detail level comments before category headers: `<!-- detail:simple -->`
3. Code blocks in cells are automatically highlighted by Shiki
4. Run `npm run build` to regenerate JSON

### Adding New Languages

1. Add language column to markdown tables in `data/language_comparison.md`
2. Update `LANGS_TO_HIGHLIGHT` in `scripts/prepare-data.mjs` if needed
3. Add language mapping in `normalizeLanguageToShikiId()` function
4. Update default languages in `LanguageToggles.svelte` if desired
5. Rebuild to regenerate data

### Component Styling Approach

- **Global styles**: `src/app.css` (smooth scrolling, scrollbars, animations)
- **Component styles**: Scoped `<style>` blocks using DaisyUI classes + custom CSS
- **Utility-first**: TailwindCSS 4 for layout and spacing
- **Icons**: Emojis only in CategoryHeader gradient sections
- **Animations**: CSS keyframes for fadeIn, slideIn, hover effects

### Interactive Features

- **Copy to clipboard**: Setup in `src/lib/utils/clipboard.ts`, strips HTML from syntax-highlighted code
- **Smooth scroll**: Setup in `src/lib/utils/smoothScroll.ts`, includes scroll spy for active nav links
- **Both initialized**: In +page.svelte `onMount()`

## Technology Stack Specifics

### Svelte 5 (Runes Mode)

- Use `$props()` for component props
- Use `$derived()` for reactive computations
- Use `$effect()` for side effects
- Use `$state()` for local reactive state
- No `let` exports or `$:` reactive statements

### TailwindCSS 4

- Imported via `@import 'tailwindcss'` in app.css
- Uses `@plugin "daisyui"` syntax for plugin configuration
- CSS custom properties for theming (--p, --b1, --bc, etc.)

### Static Site Generation

- Uses `@sveltejs/adapter-static` with SPA fallback
- No server-side rendering or API routes
- All data loaded at build time

## File Structure Notes

- `src/lib/components/`: All Svelte components
- `src/lib/stores/`: State management (uiStore.ts)
- `src/lib/utils/`: Utilities (clipboard, smoothScroll, slugify)
- `src/lib/data/`: Generated JSON data (gitignored, built from markdown)
- `src/lib/types.ts`: TypeScript interfaces
- `scripts/`: Build-time data processing
- `data/`: Source markdown for language comparisons

## Known Behaviors

- **Empty visibleLanguages**: Treated as "show all languages" by ComparisonTable
- **Language toggle**: Default languages (Java LTS, Python 3.12) set on first mount if store is empty
- **Drawer state**: Not persisted, resets to default (open on desktop, closed on mobile) on page load
- **Shiki themes**: Code is highlighted with 'github-dark' theme at build time
- **Detail level**: Session-only, not persisted across browser sessions
