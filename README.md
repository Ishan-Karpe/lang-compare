# LangCompare - Programming Language Comparison Tool

A comprehensive tool for comparing programming languages side-by-side.

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
- **Smooth Interactions**: Polished UI with smooth transitions and animations

## Development

To start a development server:

```sh
npm install
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Tech Stack

- TypeScript with Svelte framework
- TailwindCSS
- DaisyUI

## Data Processing

The comparison data is generated from `data/language_comparison.md` using the script `scripts/prepare-data.mjs`. This script processes the markdown file and creates the JSON data file used by the application.
