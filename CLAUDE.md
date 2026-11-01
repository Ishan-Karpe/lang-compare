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

  - `homeLanguage`: the language the learner knows (null turns Bridge Mode off)
  - `learnedFeatures`: learned feature slugs per `<home>-><target>` pair
  - `reviewFeatures`: feature slugs skipped for review per `<home>-><target>` pair
  - `assistedFeatures`: feature slugs where the answer was shown, per pair
  - `retestSchedule`: next retest for each passed topic, per pair
  - `attemptDrafts`: unfinished attempts, keyed by `<pair>|<slug>`
  - `selectedFeatures`: feature slugs on the cheatsheet

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

- **Default**: Closed on all screen sizes
- **Toggle**: Hamburger menu in Header controls drawer state
- **Z-index**: drawer-side (z-50) > drawer-overlay (z-50), sidebar nav (z-51)
- **Language toolbar**: z-10 (below drawer)

## Important Patterns

### Build-Time Data Preparation

When modifying `data/language_comparison.md`:

1. Follow markdown table format with headers: `| Concept | Description | Python 3.12 | JavaScript (ES6+) | ... |`
2. Add detail level comments before category headers: `<!-- detail:simple -->`
3. Code blocks in cells are automatically highlighted by Shiki
4. Add a `<!-- run -->` cell marker when the snippet can run in the browser, `<!-- run:local -->` when it needs a real OS or stdin, or `<!-- shell -->` for terminal commands
5. Write notes in a `<From> -> <To>` column such as `Python 3.12 -> Rust`. A `Same:`, `Shift:` or `Gotcha:` prefix sets the badge
6. For a "fix the compiler error" exercise, put the broken code in a `Fix This: <Language>` column, starting with `<!-- fix:E0382 -->`. A `<!-- focus:Rust -->` marker in the Concept cell shows the row only when that language is selected
7. For an auto-checked exercise, list its concepts in a `Must Use: <Language>` column, one group per line, where a line needs any one of its code spans (`` `insert` or `from` ``). Put a worked example, using different code from the answer, in an `Example: <Language>` column
8. Run `npm run verify:snippets` after changing Python, Java or Rust cells. It runs them with `$PYTHON` (use a 3.12 interpreter), `javac --release 21` and `rustc --edition 2024`, records stdout in `data/snippet_outputs.json`, and checks each fix exercise's error, each example, and each answer against its required concepts
9. Run `npm run build` to regenerate JSON

Keep learning content in the tables. `data/bridge_notes.md` only holds notes for other language pairs, and a table note wins when both exist.

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
- `src/lib/data/`: Generated JSON data (committed, built from markdown)
- `src/lib/types.ts`: TypeScript interfaces
- `scripts/`: Build-time data processing
- `data/`: Source markdown for language comparisons

## Known Behaviors

- **Empty visibleLanguages**: Treated as "show all languages" by ComparisonTable
- **Language toggle**: Default languages (Rust, Python 3.12) set on first mount if store is empty
- **Drawer state**: Not persisted, resets to closed on page load
- **Runners**: Each engine loads separately. While learning, only the home and target languages have active runners: they preload when selected, and any other runner is stopped. While browsing, a visible language's runner loads on its first Run click
- **Practice**: A target-language card hides its answer and note until there's an attempt. Rust attempts go to the Rust Playground and pass only if they compile, print the expected output and use the required concepts. Other languages are self-graded. Skipped topics join a review queue
- **Retests**: A passed topic comes back after 1, 3, 7, then 21 days, ahead of new topics, then retires. Showing the answer marks the topic as assisted and restarts its schedule. Drafts are saved until the topic passes
- **Rendering**: The site is fully client-rendered (`ssr = false`), because language choices live in localStorage and `{@html}` keeps mismatched server HTML
- **Java snippets**: Don't run in the browser. Cards show the output recorded by `npm run verify:snippets`, and Copy program builds a complete `Main.java`
- **Shiki themes**: Code is highlighted with 'github-dark' theme at build time
- **Detail level**: Session-only, not persisted across browser sessions
