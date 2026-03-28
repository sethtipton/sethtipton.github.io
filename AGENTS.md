# AGENTS.md

## Dev environment tips

- This is a single-package Astro site. Work from the repo root.
- Install dependencies with `npm ci` to match CI, or `npm install` if you are intentionally updating the lockfile.
- Start local development with `npm run dev`. Use `npm run dev -- --host 127.0.0.1 --port 4321` when you need a stable local URL for browser automation.
- Use `npm run build:site` for fast site-only verification and `npm run build` when you also need the generated resume PDF.
- Content-driven case studies live in `src/content/projects/`, shared Astro components live in `src/components/astro/`, React islands live in `src/components/react/`, and global styling lives in `src/styles/`.
- See `docs/architecture.md` for the repo-wide route, layout, content, env, and subsystem map.
- The theme remix API is deployed from the sibling repo at `/Users/sethtipton/Documents/Sites/style-transfer-api`. The Vercel function lives at `/Users/sethtipton/Documents/Sites/style-transfer-api/api/style-transfer.ts` and the shared schema lives at `/Users/sethtipton/Documents/Sites/style-transfer-api/lib/style-transfer-schema.ts`. When either of those files changes, redeploy from `/Users/sethtipton/Documents/Sites/style-transfer-api` with `vercel deploy --prod`.
- The site base path changes in CI for GitHub Pages. Be careful with hard-coded root-relative links and prefer the existing path helpers/utilities already in the repo.
- For frontend debugging, use Playwright MCP to reproduce user flows and verify UI states, and use Chrome DevTools MCP to inspect DOM, console, network, and performance causes. In practice: reproduce with Playwright, diagnose with DevTools, then verify the fix with Playwright again.
- Never use the user's active browser session for Playwright or DevTools MCP checks. Always open a separate headless MCP browser session in an isolated context for reproduction, inspection, and verification.

## Testing instructions

- CI is defined in `.github/workflows/validate.yml` and `.github/workflows/deploy.yml`.
- Run `npm run format` before `npm run validate:fast` or `npm run validate:full` to avoid failing immediately on `format:check`.
- Before finishing changes, run `npm run typecheck` and `npm run build:site` at minimum.
- Use `npm run validate:fast` during iteration and `npm run validate:full` before opening or merging a PR. `npm run validate` is an alias for the full path.
- Run `npm run lint` for linting, `npm run test:unit` for non-browser Vitest coverage, `npm run test:smoke` for the static-route browser smoke pass, and `npm run validate:resume` if you touched resume output or print styles.
- If your change affects browser-driven behavior, install the Playwright browser with `npx playwright install --with-deps chromium` if it is not already present.
- Add or update tests when behavior changes, especially for utility code, React islands, or route-level logic.

## PR instructions

- Keep PR titles short and descriptive. Suggested format: `[site] <Title>`.
- Run `npm run validate:full` before opening or merging a PR.
- Mention any intentionally skipped checks, generated assets, or known warnings in the PR description.
