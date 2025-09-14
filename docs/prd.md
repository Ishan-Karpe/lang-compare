### **Requirements**

#### **Functional**

1.  **FR1: Build-Time Markdown Processing:** A build script MUST run before the main application build. It must parse the `language_comparison.md` file, process the custom `<!-- detail -->` comment tags, and apply language-appropriate syntax highlighting to all code snippets.
2.  **FR2: Structured Data Output:** The build script MUST output the processed data into a clean, structured `comparison-data.json` file.
3.  **FR3: Static Site Generation:** The SvelteKit application MUST ingest the `comparison-data.json` file during its build process to pre-render the entire comparison table into static HTML (SSG).
4.  **FR4: Interactive Hydration:** The generated static page MUST be hydrated with JavaScript to enable client-side interactivity for the Detail Level Toggle and the Theme Switcher without page reloads.

#### **Non-Functional**

- **NFR2: Maintainability (Refined):** The content update process requires editing the `language_comparison.md` file, followed by a **re-build** of the application to see the changes reflected.

_(Other non-functional requirements remain the same but are strengthened by the SSG architecture.)_

---

### **Epic 1: Core Application & Interactive Comparison Table (Revised Story Structure)**

**Epic Goal:** To build and deploy the complete MVP. This includes setting up the SvelteKit project, creating a build-time data pipeline to process the source Markdown, statically generating the responsive comparison table, and hydrating the UI to enable the theme and detail-level controls.

#### **Story 1.1: Project Scaffolding and UI Foundation**

- **As a** developer,
- **I want** to set up a new SvelteKit 5 project with TailwindCSS 4 and DaisyUI 5,
- **so that** I have the foundational structure and styling capabilities in place for building the application.
- **AC:**
  1.  A new SvelteKit 5 project is created and configured with `adapter-static`.
  2.  TailwindCSS 4 and DaisyUI 5 are successfully integrated.
  3.  A basic three-panel layout (sticky header, sticky sidebar, content area) is created for desktop.
  4.  The DaisyUI theme controller is implemented, allowing a user to switch between `light`, `dark`, and `black` themes.
  5.  The initial structure for a separate build script (e.g., `scripts/prepare-data.js`) is created.

#### **Story 1.2: Build-Time Data Transformation Pipeline**

- **As a** developer,
- **I want** a build script that reads `language_comparison.md`, applies syntax highlighting, processes custom detail-level comments, and outputs a structured JSON file,
- **so that** we have clean, pre-processed data ready for the application to consume at build time.
- **AC:**
  1.  The script uses a robust Markdown parser (e.g., `unified`) to create an AST from `language_comparison.md`.
  2.  The script uses a syntax highlighter (e.g., `Shiki`) to transform all code blocks into pre-highlighted HTML.
  3.  The script correctly interprets the `<!-- detail:level -->` comments to categorize content.
  4.  The script outputs a valid `comparison-data.json` file in the expected structure.
  5.  The main `build` command in `package.json` is updated to run this script before `svelte-kit build`.

#### **Story 1.3: Static Rendering of the Comparison Table**

- **As a** developer,
- **I want** SvelteKit to read the `comparison-data.json` file at build time and use Static Site Generation (SSG) to render the full comparison table into a static `index.html`,
- **so that** the application has a near-instantaneous load time.
- **AC:**
  1.  A Svelte component reads the local `comparison-data.json` file during the build process.
  2.  The component renders the data into a valid, accessible HTML table structure.
  3.  The pre-highlighted HTML for code snippets is rendered correctly using `@html`.
  4.  The final `build/index.html` file contains the complete, fully-rendered table.

#### **Story 1.4: Implement Client-Side Interactivity**

- **As a** user,
- **I want** the Detail-Level Toggle to function on the loaded page,
- **so that** I can filter the information displayed in the static table.
- **AC:**
  1.  A UI control for "Simple," "Detailed," and "Expert" is present in the header.
  2.  The Svelte component "hydrates" the static HTML with JavaScript.
  3.  Toggling the control uses JavaScript to dynamically show or hide the appropriate content (based on classes or attributes applied during the build step) without a page reload.
  4.  "Simple" is the default view on first load.

#### **Story 1.5: Implement Responsive Layout and Final Polish**

- **As a** user,
- **I want** the site to be fully responsive and easy to use on any device, from my phone to my extra-wide monitor,
- **so that** I can access the information effectively wherever I am.
- **AC:**
  1.  On screens smaller than the `lg` breakpoint (1024px), the left sidebar is hidden and accessible via a "hamburger" drawer.
  2.  On screens `lg` and larger, the three-panel layout with sticky headers is active.
  3.  On screens `2xl` and larger, the main content container expands to use the available width.
  4.  The table is horizontally scrollable on narrow viewports.
  5.  All UI interactions are smooth, and the final visual design aligns with the `front-end-spec.md`.

---
