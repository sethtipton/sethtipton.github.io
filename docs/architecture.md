# Repo Architecture Map

This document is the repo-wide map for humans and AI agents working in this site.

## App shape

- Single-package Astro site with selective React islands.
- Static output build with GitHub Pages-aware `site` and `base` handling.
- Astro owns routes and layout composition; React is used where client-side state or richer interaction is worth the tradeoff.

## Route map

- `/`
  - `src/pages/index.astro`
  - Uses `src/layouts/BaseLayout.astro`
  - Pulls site-level content from `src/data/site.ts` and `src/data/experience.ts`
- `/work/`
  - `src/pages/work/index.astro`
  - Uses project collection helpers from `src/lib/projects.ts`
- `/work/[slug]/`
  - `src/pages/work/[slug].astro`
  - Project content source of truth lives in `src/content/projects/*.md`
- `/resume/`
  - `src/pages/resume.astro`
  - Resume content source of truth lives in `src/content/resume/seth-tipton.md`
- `/resume/print/`
  - `src/pages/resume/print.astro`
  - Print-specific layout and validation feed the PDF workflow
- `/404.html`
  - `src/pages/404.astro`
- `/robots.txt`
  - `src/pages/robots.txt.ts`
- `/sitemap.xml`
  - `src/pages/sitemap.xml.ts`

## Layouts and composition

- `src/layouts/BaseLayout.astro`
  - Main site shell, metadata, favicon links, theme bootstrap, header, footer
- `src/layouts/PrintLayout.astro`
  - Print-specific shell for the resume print route
- `src/components/astro/`
  - Shared Astro presentation components used across routes
- `src/components/react/`
  - Interactive client islands mounted from Astro

## Content collections

- `src/content.config.ts`
  - Canonical schema definitions for `projects` and `resume`
- `src/content/projects/*.md`
  - Case study source files
- `src/content/resume/seth-tipton.md`
  - Resume source of truth used by both web and print flows

## Shared libraries

- `src/lib/paths.ts`
  - Base-path-aware URL helper; prefer this over hard-coded root-relative links
- `src/lib/projects.ts`
  - Project collection loading, sorting, and permalink helpers
- `src/lib/resume.ts`
  - Resume loading and route/link helpers
- `src/lib/github.ts`
  - GitHub repository metadata parsing and API URL helpers
- `src/lib/links.ts`
  - Shared outbound/internal link helpers

## Risky or high-context subsystems

- Style transfer
  - `src/lib/style-transfer/`
  - `src/components/react/StyleTransferPrompt.tsx`
  - `src/components/react/StyleTransferLauncher.tsx`
  - `src/components/astro/StyleTransferMount.astro`
  - `src/layouts/BaseLayout.astro`
  - High context because it spans schemas, runtime theme derivation, query params, local storage, CSS variables, artwork generation, and client islands.
  - Read `src/lib/style-transfer/AGENTS.md` before making changes in this slice.
- Resume print and PDF pipeline
  - `src/components/astro/ResumeDocument.astro`
  - `src/pages/resume/print.astro`
  - `scripts/generate-resume-pdf.mjs`
  - `scripts/validate-resume-print.mjs`
  - High context because route HTML, print styling, tagged PDF generation, and semantic validation all need to stay aligned.
- Base path and deployment handling
  - `astro.config.mjs`
  - `src/lib/paths.ts`
  - `src/pages/robots.txt.ts`
  - `src/pages/sitemap.xml.ts`
  - `.github/workflows/validate.yml`
  - `.github/workflows/deploy.yml`
  - High context because local, CI, and GitHub Pages deployments can use different `base` values.

## Environment variables

- `SITE_URL`
  - Used by `astro.config.mjs` to set the canonical site origin
- `BASE_PATH`
  - Used by `astro.config.mjs` and build scripts for GitHub Pages-aware paths
- `HMR_HOST`
- `HMR_PROTOCOL`
- `HMR_CLIENT_PORT`
  - Optional local dev overrides for HMR configuration in `astro.config.mjs`
- `PUBLIC_STYLE_TRANSFER_API_URL`
  - Optional client-exposed endpoint for the style transfer remix flow
  - Read by `src/components/react/StyleTransferPrompt.tsx`
  - Set in deploy workflow; if missing locally, the remix UI should degrade gracefully rather than breaking the site shell

## Validation map

- `npm run test:unit`
  - Fast Vitest pass for non-browser tests
- `npm run test:smoke`
  - Builds the site and runs the route smoke suite
- `npm run validate:fast`
  - Format check, lint, typecheck, and unit tests
- `npm run validate:full`
  - Fast validation, production build, smoke tests against the built `dist/`, and resume validation
- `npm run presets:validate`
  - Style-transfer preset catalog validation
- `npm run validate:resume`
  - Print HTML and tagged PDF validation

## If you are changing X, start here

- Route structure, metadata, or site shell:
  - `src/layouts/BaseLayout.astro`
  - `src/components/astro/Header.astro`
  - `src/components/astro/Footer.astro`
- Case study content or work pages:
  - `src/content/projects/*.md`
  - `src/pages/work/index.astro`
  - `src/pages/work/[slug].astro`
  - `src/lib/projects.ts`
- Resume content or print output:
  - `src/content/resume/seth-tipton.md`
  - `src/components/astro/ResumeDocument.astro`
  - `src/pages/resume.astro`
  - `src/pages/resume/print.astro`
  - `scripts/generate-resume-pdf.mjs`
  - `scripts/validate-resume-print.mjs`
- Style transfer:
  - `src/lib/style-transfer/AGENTS.md`
  - `src/lib/style-transfer/schema.ts`
  - `src/lib/style-transfer/deriveTheme.ts`
  - `src/lib/style-transfer/controller.ts`
  - `src/lib/style-transfer/siteThemeController.ts`
  - `src/components/react/StyleTransferPrompt.tsx`
  - `src/components/react/StyleTransferLauncher.tsx`
