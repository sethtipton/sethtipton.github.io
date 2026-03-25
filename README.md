# sethtipton.github.io

Personal portfolio site for Seth Tipton, built with Astro, TypeScript, Sass, and selective React islands.

Live site: [sethtipton.github.io](https://sethtipton.github.io)

## Overview

This repo powers a content-driven portfolio with:

- project and case study pages sourced from structured content
- a custom theme remix panel with bounded style-transfer presets and generated themes
- animated SVG hero artwork and other small interactive React islands
- a printable resume route and PDF generation workflow

The site is mostly Astro-first, with React used where client-side state and richer interactions are worth it.

## Stack

- Astro
- TypeScript
- Sass
- React
- GSAP
- Vitest

## Browser Support

This site targets current evergreen browsers rather than legacy platforms.

- Supported for full core functionality: the latest two major releases of Chrome, Edge, Firefox, Safari, and iOS Safari.
- Required to work across that support range: core navigation, content rendering, theme switching, case study browsing, and the resume routes.
- Treated as progressive enhancement: view transitions, blur-heavy surfaces, animated SVG treatments, and some theme-explorer visuals. If a browser misses one of those features, the site should remain usable and readable.

When adding new browser-sensitive CSS or DOM APIs, prefer fallbacks and feature detection over polyfill-heavy solutions unless the feature is critical to site use.

## Getting Started

Install dependencies:

```bash
npm ci
```

Start the local dev server:

```bash
npm run dev
```

For a stable local URL during browser automation:

```bash
npm run dev -- --host 127.0.0.1 --port 4321
```

See [docs/architecture.md](./docs/architecture.md) for the repo-wide route, layout, content, env, and risky-subsystem map.

## Common Scripts

```bash
# start local development
npm run dev

# run fast non-browser tests
npm run test:unit

# build the site and run route smoke tests
npm run test:smoke

# run the full test suite
npm run test:run

# type-check Astro + TypeScript
npm run typecheck

# lint the project
npm run lint

# build the site only
npm run build:site

# build the site and generate the resume PDF
npm run build

# run the fast local validation flow
npm run validate:fast

# run the full local validation flow
npm run validate:full

# backwards-compatible alias for the full flow
npm run validate
```

## Project Structure

```text
src/
  components/
    astro/      Shared Astro components
    react/      Interactive React islands
  content/
    projects/   Case study and project content
  pages/        Astro routes
  styles/       Global Sass tokens, components, and utilities
scripts/        Build and validation scripts
public/         Static assets
docs/           Architecture and workflow docs
```

## Deployment

GitHub Pages deployment is configured in:

- `.github/workflows/validate.yml`
- `.github/workflows/deploy.yml`

The Astro `site` and `base` values can be overridden with these environment variables:

- `SITE_URL`
- `BASE_PATH`

That allows the same project to deploy as either a user site or a project site without hard-coding the production URL shape.
