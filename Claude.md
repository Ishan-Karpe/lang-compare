# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

This project is a static website built with SvelteKit, TailwindCSS, and DaisyUI. It's designed to be a high-performance, pre-rendered site for comparing programming language features.

The core architecture revolves around a build-time data transformation pipeline:

1.  **Data Source**: The single source of truth for all comparison data is the `language_comparison.md` file.
2.  **Build-Time Script**: A Node.js script, intended to be at `scripts/prepare-data.js`, runs _before_ the SvelteKit build.
3.  **Transformation**: This script uses the `unified` ecosystem to parse the Markdown file's AST, `Shiki` to apply syntax highlighting to code blocks, and custom logic to handle `<!-- detail:level -->` comments for filtering content.
4.  **Structured Data**: The script's output is a structured `comparison-data.json` file.
5.  **Static Site Generation (SSG)**: The SvelteKit application is configured with `adapter-static`. During the build, it ingests `comparison-data.json` and pre-renders the entire site into static HTML.
6.  **Client-Side Hydration**: Minimal JavaScript is added to the static pages to "hydrate" them, enabling interactive features like a theme switcher and a detail-level toggle without full page reloads.

When making changes to the comparison data, you must edit `language_comparison.md` and then rebuild the project to see the changes.

## Common Commands

The `package.json` file has not been created yet, so the exact commands are not available. Based on the project documentation and SvelteKit conventions, the following scripts should be configured:

- **`npm run dev`**: Starts the development server with hot-reloading.
- **`npm run build`**: Builds the production-ready static site. This command must first execute the `scripts/prepare-data.js` script and then run `svelte-kit build`.
- **`npm run preview`**: Serves the built static site locally for previewing.
- **`npm run lint`**: Lints the codebase for style and errors.
- **`npm run format`**: Formats the code according to project standards.
