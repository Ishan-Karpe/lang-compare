# Project Source Tree

This document outlines the directory structure for the SvelteKit application.

```plaintext
/
├── scripts/
│   └── prepare-data.mjs      # Build-time script to parse MD and generate JSON
├── src/
│   ├── lib/
│   │   ├── assets/            # Static assets like images
│   │   ├── components/
│   │   │   ├── Header.svelte         # Top header component
│   │   │   ├── Sidebar.svelte        # Left sidebar component
│   │   │   ├── ComparisonTable.svelte# Main table rendering component
│   │   │   └── CodeCard.svelte       # Individual cell for a code snippet
│   │   ├── data/              # Generated data files
│   │   ├── stores/
│   │   │   └── uiStore.ts          # Svelte store for theme & detail level
│   │   └── types/
│   │       └── index.ts            # TypeScript types for our parsed data
│   ├── routes/
│   │   ├── +layout.svelte        # Main layout with header and sidebar
│   │   ├── +page.svelte          # The main page component
│   │   └── +page.ts              # The SvelteKit loader for our static data
│   └── app.css                   # Global CSS styles
├── static/
│   └── language_comparison.md    # The raw source of truth (copied to build)
├── tests/
│   └── setup.ts                  # Test setup and config
├── package.json
├── svelte.config.js
└── tailwind.config.js
```
