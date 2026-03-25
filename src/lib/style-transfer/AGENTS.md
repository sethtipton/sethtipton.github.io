# AGENTS.md

## Scope

This directory contains the style-transfer domain model for the site:

- theme schemas and runtime theme application derivation
- static preset catalog compilation
- structured artwork schemas and deterministic artwork rendering helpers
- authoring documentation and preset templates

Keep this slice data-first. Prefer validated JSON + deterministic rendering over ad hoc runtime logic.

## File map

- `schema.ts`
  - Canonical theme contract for prompt-generated and preset themes.
  - If the API payload shape changes, update this file first.
- `deriveTheme.ts`
  - Converts a validated theme record into the runtime application object: CSS custom properties, dataset values, and derived tokens.
  - This is the only place that should translate theme semantics into concrete CSS variable values.
- `preset-catalog.json`
  - Build-time source of truth for preset themes.
  - Runtime must never fetch this file.
- `presets.ts`
  - Imports and validates the preset catalog, strips authoring-only metadata, and compiles presets into runtime applications and UI summaries.
- `preset-template.json`
  - Starter object for authoring a new preset with Codex or another LLM.
- `PRESET_AUTHORING.md`
  - Human workflow for authoring, validating, and previewing presets locally.
- `artwork.ts`
  - Structured artwork schemas, prompt intent helpers, fallback generation, and deterministic artwork render config derivation.
  - Do not make raw model-authored SVG markup the primary path.

## Invariants

- Runtime preset behavior must stay static, local, and zero-fetch.
- `preset-catalog.json` is the preset source of truth.
- Authoring metadata such as `meta.category`, `meta.tags`, and `meta.notes` may exist in the catalog, but must not affect runtime theme application unless there is a clear product need.
- Theme color roles are semantic and bounded:
  - `background`
  - `backgroundAlt`
  - `surface`
  - `surfaceStrong`
  - `surfaceTint`
  - `surfacePaper`
  - `text`
  - `muted`
  - `accent`
  - `accentStrong`
  - `focus`
- New preset or prompt output fields should be added through Zod schemas first, then compiled into runtime behavior.
- Keep the current `?style=` URL flow, localStorage persistence, and `<html>` dataset/CSS variable application stable.
- Artwork generation should remain structured JSON -> Zod validation -> deterministic renderer. Avoid arbitrary SVG strings as a first-class path.

## Editing guidance

- When adding a new preset, start from `preset-template.json` or the nearest existing preset in `preset-catalog.json`.
- Keep preset ids stable and lowercase kebab-case.
- Favor meaningful differentiation across:
  - palette
  - font pairing
  - density
  - surface style
  - button style
  - pattern
  - motion
- Avoid adding presets that only rename an existing mood with tiny token changes.
- If you change theme token semantics in `deriveTheme.ts`, verify that existing presets still feel intentional as a set.
- If you change the API theme schema, update both:
  - this local `schema.ts`
  - the external style-transfer API schema copy
- If you add artwork families or usage modes in `artwork.ts`, keep node counts modest and rendering deterministic.

## Local workflow

For preset authoring:

1. Draft or edit a preset in `preset-catalog.json`.
2. Optionally validate a candidate object before pasting:
   - `node ./scripts/style-transfer-presets.mjs candidate ./tmp/new-preset.json`
3. Validate the catalog:
   - `npm run presets:validate`
4. Print the summary:
   - `npm run presets:summary`
5. Preview locally:
   - `http://127.0.0.1:4321/?style=<preset-id>`
6. Run the relevant checks:
   - `npm run test:run -- src/test/styleTransfer.test.ts`
   - `npm run typecheck`
   - `npm run build:site`

For prompt/artwork work:

1. Update the Zod schemas first.
2. Update derivation helpers second.
3. Update the React island or layout bootstrap last.
4. Verify the prompt flow in a browser:
   - request payload
   - API response shape
   - Zod parse result
   - derived application
   - `<html>` dataset changes
   - CSS custom property changes

## Performance guardrails

- Do not introduce runtime fetching for presets.
- Avoid heavyweight dependencies in this directory.
- Keep derived runtime objects compact and serializable.
- Prefer semantic CSS custom properties and data attributes over class generation.
- Keep SVG/artwork renderers bounded in complexity; large path strings or excessive node counts are a regression.

## When in doubt

- Prefer small schema-first changes over broad refactors.
- Prefer adding authoring helpers and validation over expanding runtime complexity.
- Preserve the current user-facing behavior unless the task explicitly asks for a feature change.
