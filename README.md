# LangCompare - Programming Language Comparison Tool

A comprehensive tool for comparing programming languages side-by-side, built with SvelteKit, TypeScript, and TailwindCSS.

## Overview

LangCompare provides a detailed comparison of programming languages across various categories including:

- Language Core & Typing
- Standard Library Capabilities
- Common Data Structures
- Control Flow
- Paradigms: Functional, OOP & Closures
- Generics & Templates
- Asynchronous Programming & Concurrency Models
- String Handling
- Error Handling, Debugging & Memory Management
- And more...

## Features

- **Multi-language Comparison**: Compare code examples in Python, TypeScript, JavaScript, Java, Rust, Go, C, and C++
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop devices
- **Detail Levels**: Toggle between Simple, Detailed, and Expert views
- **Theme Support**: Light, Dark, and Black themes
- **Syntax Highlighting**: Beautiful code highlighting with Shiki
- **Smooth Interactions**: Polished UI with smooth transitions and animations

## Development Status

### MVP Completed ✅

All core stories for the MVP have been completed:

- [x] Story 1.1: Project Scaffolding and UI Foundation
- [x] Story 1.2: Build-Time Data Transformation Pipeline
- [x] Story 1.3: Static Rendering of the Comparison Table
- [x] Story 1.4: Implement Client-Side Interactivity
- [x] Story 1.5: Implement Responsive Layout and Final Polish

### Next Steps

- [ ] Story 1.6: Expand Comparison Data with Additional Sections

## Developing

To start a development server:

```sh
npm install
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

## Testing

Run the full test suite:

```sh
npm test
```

Run unit tests only:

```sh
npm run test:unit
```

Run end-to-end tests:

```sh
npm run test:e2e
```

## Architecture

This project follows a SvelteKit static site generation approach with:

- TypeScript for type safety
- TailwindCSS for styling
- DaisyUI for UI components
- Shiki for syntax highlighting
- Svelte 5 runes for state management

## Data Processing

The comparison data is generated from `data/language_comparison.md` using the script `scripts/prepare-data.mjs`. This script processes the markdown file and creates the JSON data file used by the application.

## Deployment

The application is configured as a static site using SvelteKit's adapter-static. It can be deployed to any static hosting service like Vercel, Netlify, or GitHub Pages.
