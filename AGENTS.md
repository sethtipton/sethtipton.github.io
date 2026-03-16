# AGENTS.md

## Dev environment tips

- This is a single-package Astro site. Work from the repo root: `/Users/sethtipton/Documents/Sites/sethtipton.github.io`.
- Install dependencies with `npm ci` to match CI, or `npm install` if you are intentionally updating the lockfile.
- Start local development with `npm run dev`. Use `npm run dev -- --host 127.0.0.1 --port 4321` when you need a stable local URL for browser automation.
- Use `npm run build:site` for fast site-only verification and `npm run build` when you also need the generated resume PDF.
- Content-driven case studies live in `src/content/projects/`, shared Astro components live in `src/components/astro/`, React islands live in `src/components/react/`, and global styling lives in `src/styles/`.
- The site base path changes in CI for GitHub Pages. Be careful with hard-coded root-relative links and prefer the existing path helpers/utilities already in the repo.
- For frontend debugging, use Playwright MCP to reproduce user flows and verify UI states, and use Chrome DevTools MCP to inspect DOM, console, network, and performance causes. In practice: reproduce with Playwright, diagnose with DevTools, then verify the fix with Playwright again.

## Testing instructions

- CI is defined in `.github/workflows/validate.yml` and `.github/workflows/deploy.yml`.
- Run `npm run format` before `npm run validate` to avoid failing immediately on `format:check`.
- Before finishing changes, run `npm run typecheck` and `npm run build:site` at minimum.
- For the full local validation flow, run `npm run validate`. This matches CI and includes format checking, ESLint, Astro type checks, Vitest, the production build, and resume validation.
- Run `npm run lint` for linting, `npm run test:run` for a non-watch Vitest pass, and `npm run validate:resume` if you touched resume output or print styles.
- If your change affects browser-driven behavior, install the Playwright browser with `npx playwright install --with-deps chromium` if it is not already present.
- Add or update tests when behavior changes, especially for utility code, React islands, or route-level logic.

## PR instructions

- Keep PR titles short and descriptive. Suggested format: `[site] <Title>`.
- Run `npm run validate` before opening or merging a PR.
- Mention any intentionally skipped checks, generated assets, or known warnings in the PR description.
