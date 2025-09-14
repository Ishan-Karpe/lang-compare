# Lang-Compare Project Overview

This project is a SvelteKit-based web application that provides a comprehensive comparison of programming languages. The application displays side-by-side code examples and explanations for various programming concepts across multiple languages including Python, TypeScript, JavaScript, Java, Rust, Go, C, and C++.

## Project Type

This is a **SvelteKit web application** built with modern web technologies including TypeScript, Tailwind CSS, and DaisyUI. The project follows a static site generation approach using SvelteKit's adapter-static.

## Architecture & Technologies

### Core Technologies

- **SvelteKit**: Web framework for building the application
- **TypeScript**: Primary language for type safety
- **Tailwind CSS**: Utility-first CSS framework for styling
- **DaisyUI**: Component library built on Tailwind CSS
- **Vite**: Build tool and development server
- **Shiki**: Syntax highlighter for code examples

### Project Structure

```
src/
├── lib/
│   ├── components/     # Reusable Svelte components
│   ├── data/           # Data files (comparison data in JSON format)
│   └── assets/         # Static assets like images
├── routes/             # SvelteKit pages and layouts
│   ├── +layout.svelte  # Main layout with header and sidebar
│   └── +page.svelte    # Main page displaying the comparison table
└── app.css             # Global CSS styles
```

### Key Components

1. **ComparisonTable.svelte**: Main component that renders the language comparison data
2. **CodeCard.svelte**: Component for displaying individual code examples with syntax highlighting
3. **Header.svelte**: Application header with theme selector
4. **Sidebar.svelte**: Navigation sidebar

## Data Structure

The application's data is stored in `src/lib/data/comparison-data.json`, which is generated from `data/language_comparison.md` using the script `scripts/prepare-data.mjs`. The data is organized in rows with:

- Category (e.g., "Standard Library Capabilities")
- Feature (e.g., "Key Strengths & Focus")
- Snippets for each language with syntax highlighting

## Development Workflow

### Building and Running

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Data Preparation

The comparison data is generated from a markdown file:

```bash
# Regenerate comparison data from markdown
node scripts/prepare-data.mjs
```

This script processes `data/language_comparison.md` and creates the JSON data file used by the application.

### Testing

The project includes both unit tests and end-to-end tests:

```bash
# Run unit tests
npm run test:unit

# Run end-to-end tests
npm run test:e2e

# Run all tests
npm test
```

Testing tools:

- **Vitest**: Unit testing framework
- **Playwright**: End-to-end testing framework

## Development Conventions

### Code Style

- TypeScript for type safety
- Svelte components with TypeScript support
- Tailwind CSS for styling with DaisyUI components
- ESLint and Prettier for code formatting and linting

### Component Structure

- Components are organized in `src/lib/components/`
- Each component is a `.svelte` file with optional TypeScript logic in `.svelte.ts` files
- Components use Tailwind CSS classes for styling

### Data Management

- Language comparison data is stored in JSON format
- Data is prepared from markdown using a Node.js script
- The build process includes data preparation step

## Deployment

The application is configured as a static site using SvelteKit's adapter-static. It can be deployed to any static hosting service like Vercel, Netlify, or GitHub Pages.

## Key Features

1. **Multi-language Comparison**: Side-by-side code examples in 8 programming languages
2. **Syntax Highlighting**: Code examples are syntax-highlighted using Shiki
3. **Responsive Design**: Mobile-friendly layout with collapsible sidebar
4. **Theme Support**: Light, dark, and black themes using DaisyUI
5. **Category Organization**: Features organized by programming concepts
