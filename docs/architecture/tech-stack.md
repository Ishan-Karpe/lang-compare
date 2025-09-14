# Frontend Tech Stack

This document specifies the official technology stack for the project. All development must adhere to these choices and versions.

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
