# Style Transfer Preset Authoring

The preset source of truth is:

- `src/lib/style-transfer/preset-catalog.json`

Runtime does not fetch this file. It is imported at build time, validated with Zod, and compiled into the existing preset applications.

Use [preset-template.json](./preset-template.json) as the fastest starting point for Codex or another LLM.

## Required vs optional fields

Required:

- `id`
- `name`
- `prompt`
- `source`
- `palette`
- `fonts`
- `density`
- `surfaceStyle`
- `buttonStyle`
- `radiusProfile`
- `pattern`
- `motion`

Optional authoring-only metadata:

- `meta.category`
- `meta.tags`
- `meta.notes`

The runtime preset compiler strips authoring metadata after validation, so `meta` is useful for local curation and tooling without changing how presets apply on the site.

## Naming conventions

- `id` must be lowercase kebab-case and stable once introduced.
- `name` should read like a design-system preset label, not a marketing sentence.
- `prompt` should describe the visual intent in one line.
- Keep names concise and avoid overlapping labels like `Minimal Minimal` or `Dark Dark`.
- `radiusProfile` should describe the site-wide curvature language, not just button corners.

## Accessibility guidance

- Aim for `text` against `background` and `surface` to stay at or above WCAG AA contrast in both light and dark modes.
- Treat `accent` and `accentStrong` as emphasis colors, not the primary text color.
- If a preset is intentionally low-contrast in decorative areas, keep readable content colors conservative.
- When in doubt, bias toward stronger text contrast and subtler surfaces.

## Workflow

1. Open `preset-catalog.json`.
2. Start from `preset-template.json` or duplicate the closest existing preset.
3. Draft one preset object as JSON.
4. Validate the full catalog:
   - `npm run presets:validate`
5. Preview the catalog summary:
   - `npm run presets:summary`
6. Open the local site and preview the preset with:
   - `http://127.0.0.1:4321/?style=<preset-id>`
7. Run:
   - `npm run test:run -- src/test/styleTransfer.test.ts`
   - `npm run typecheck`
   - `npm run build:site`

If the shape is wrong, duplicate ids exist, or enum values drift, validation fails locally during import/build.

## Authoring shape

Each preset object must match this structure:

```json
{
  "id": "ocean-technical",
  "name": "Ocean Technical",
  "prompt": "Cool marine blue system with precise technical lines.",
  "source": "preset",
  "meta": {
    "category": "system",
    "tags": ["marine", "technical", "cool", "structured"],
    "notes": "Aim for clarity first, with accent color doing more work than surface effects."
  },
  "palette": {
    "background": { "light": "#f4fbff", "dark": "#07131a" },
    "backgroundAlt": { "light": "#e6f3fb", "dark": "#0c1b24" },
    "surface": { "light": "#ffffff", "dark": "#10222d" },
    "surfaceStrong": { "light": "#d9ebf5", "dark": "#16303d" },
    "surfaceTint": { "light": "#eaf7ff", "dark": "#183845" },
    "surfacePaper": { "light": "#fbfdff", "dark": "#0b1820" },
    "text": { "light": "#12303f", "dark": "#e6f6ff" },
    "muted": { "light": "#5d7b8c", "dark": "#8fb5c9" },
    "accent": { "light": "#1570ef", "dark": "#5bb8ff" },
    "accentStrong": { "light": "#0d4ea6", "dark": "#8cd3ff" },
    "focus": { "light": "#0f766e", "dark": "#fde68a" }
  },
  "fonts": {
    "sans": "neo-grotesk",
    "serif": "default"
  },
  "density": "balanced",
  "surfaceStyle": "glass",
  "buttonStyle": "outline",
  "radiusProfile": "balanced",
  "pattern": "grid",
  "motion": "calm"
}
```

## Good local Codex / LLM prompt

Use this when you want a new preset drafted as JSON:

```text
Return exactly one JSON object for my style transfer preset catalog.

Constraints:
- Match the existing preset catalog structure exactly.
- source must be "preset".
- id must be lowercase kebab-case.
- Every palette color must be a full 6-digit hex string.
- Include both light and dark values for every palette role.
- Allowed fonts.sans: default, neo-grotesk, humanist, terminal
- Allowed fonts.serif: default, editorial, oldstyle
- Allowed density: compact, balanced, airy
- Allowed surfaceStyle: flat, paper, glass, glow
- Allowed buttonStyle: soft, outline, hard-edge, pill
- Allowed radiusProfile: sharp, tight, balanced, soft, puffy
- Allowed pattern: none, tilt, grid, noise, scanlines
- Allowed motion: off, calm, snappy
- Do not include markdown or explanation.
```

Then paste the returned object into `preset-catalog.json`.

## Good preset drafting prompts

Use these when you want Codex or another LLM to return one candidate preset object:

```text
Return exactly one JSON object matching my preset template.

Target mood:
- Warm neutral editorial workspace
- restrained, premium, quiet surfaces
- bronze accent family
- readable in both light and dark mode

Constraints:
- Keep text/background and text/surface comfortably readable.
- Do not reuse names already in my catalog.
- Prefer one clear accent family over multiple competing accent hues.
- Do not include markdown or explanation.
```

```text
Return exactly one JSON preset object for a more technical, grid-minded system preset.

Desired qualities:
- clean and disciplined
- modern but not futuristic
- neutral surfaces with one strong accent color
- compact density

Allowed enums:
- fonts.sans: default, neo-grotesk, humanist, terminal
- fonts.serif: default, editorial, oldstyle
- density: compact, balanced, airy
- surfaceStyle: flat, paper, glass, glow
- buttonStyle: soft, outline, hard-edge, pill
- radiusProfile: sharp, tight, balanced, soft, puffy
- pattern: none, tilt, grid, noise, scanlines
- motion: off, calm, snappy

Return JSON only.
```

## Candidate validation

To validate one draft object before pasting it into the main catalog:

1. Save it as a temporary JSON file, for example `./tmp/new-preset.json`.
2. Run:

```bash
node ./scripts/style-transfer-presets.mjs candidate ./tmp/new-preset.json
```

That command checks shape, prints a summary, shows contrast warnings, and flags if the candidate is too close to existing presets.
