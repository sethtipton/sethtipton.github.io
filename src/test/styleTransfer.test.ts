import { describe, expect, it } from 'vitest';

import { deriveStyleTransferArtworkRenderConfig } from '../lib/style-transfer/artwork';
import { deriveStyleTransferApplication } from '../lib/style-transfer/deriveTheme';
import {
  styleTransferPresetThemes,
  styleTransferPresetSummaries,
} from '../lib/style-transfer/presets';
import {
  createCustomStyleTransferThemeRecord,
  styleTransferModelOutputSchema,
} from '../lib/style-transfer/schema';

describe('style transfer theme contracts', () => {
  it('keeps the preset list stable', () => {
    expect(styleTransferPresetSummaries.map((preset) => preset.name)).toEqual([
      'Neubrutalism',
      'Claymorphism',
      'Retrofuturism',
      'Y2K Futurism',
      'Frutiger Aero',
      'Editorial Minimal',
      'Soft UI',
      'Monochrome Terminal',
      'Noir Interface',
      'Ambient Glow',
      'Chromatic Minimal',
      'Toasted Marshmallow',
    ]);
  });

  it('gives each built-in preset a unique artwork family', () => {
    const families = styleTransferPresetSummaries.map(
      (preset) => preset.artwork.spec.family,
    );

    expect(new Set(families).size).toBe(styleTransferPresetSummaries.length);
  });

  it('creates a custom theme record from a validated model payload', () => {
    const payload = styleTransferModelOutputSchema.parse({
      styleName: 'Glacial Editorial',
      palette: {
        background: { light: '#f8fbff', dark: '#0d1520' },
        backgroundAlt: { light: '#edf3fb', dark: '#132030' },
        surface: { light: '#ffffff', dark: '#15202b' },
        surfaceStrong: { light: '#dfe8f2', dark: '#1c2b3a' },
        surfaceTint: { light: '#eef6ff', dark: '#223344' },
        surfacePaper: { light: '#fcfeff', dark: '#101923' },
        text: { light: '#132131', dark: '#e7f1fb' },
        muted: { light: '#5b6f84', dark: '#9bb0c6' },
        accent: { light: '#2563eb', dark: '#60a5fa' },
        accentStrong: { light: '#1d4ed8', dark: '#93c5fd' },
        focus: { light: '#0ea5e9', dark: '#fde68a' },
      },
      fonts: {
        sans: 'neo-grotesk',
        serif: 'editorial',
      },
      density: 'airy',
      surfaceStyle: 'glass',
      buttonStyle: 'outline',
      pattern: 'grid',
      motion: 'calm',
    });

    const record = createCustomStyleTransferThemeRecord(
      'glacial editorial with cobalt accents',
      payload,
    );

    expect(record.id).toBe('glacial-editorial');
    expect(record.name).toBe('Glacial Editorial With Cobalt Accents');
    expect(record.source).toBe('prompt');
    expect(record.prompt).toBe('glacial editorial with cobalt accents');
    expect(record.radiusProfile).toBe('soft');
  });

  it('accepts prompt text up to 400 characters in custom theme records', () => {
    const payload = styleTransferModelOutputSchema.parse({
      styleName: 'Glacial Editorial',
      palette: {
        background: { light: '#f8fbff', dark: '#0d1520' },
        backgroundAlt: { light: '#edf3fb', dark: '#132030' },
        surface: { light: '#ffffff', dark: '#15202b' },
        surfaceStrong: { light: '#dfe8f2', dark: '#1c2b3a' },
        surfaceTint: { light: '#eef6ff', dark: '#223344' },
        surfacePaper: { light: '#fcfeff', dark: '#101923' },
        text: { light: '#132131', dark: '#e7f1fb' },
        muted: { light: '#5b6f84', dark: '#9bb0c6' },
        accent: { light: '#2563eb', dark: '#60a5fa' },
        accentStrong: { light: '#1d4ed8', dark: '#93c5fd' },
        focus: { light: '#0ea5e9', dark: '#fde68a' },
      },
      fonts: {
        sans: 'neo-grotesk',
        serif: 'editorial',
      },
      density: 'airy',
      surfaceStyle: 'glass',
      buttonStyle: 'outline',
      pattern: 'grid',
      motion: 'calm',
    });

    const prompt = 'a'.repeat(400);
    const record = createCustomStyleTransferThemeRecord(prompt, payload);

    expect(record.prompt).toBe(prompt);
  });

  it('derives a runtime application from a preset theme', () => {
    const theme = styleTransferPresetThemes.find(
      (preset) => preset.id === 'neubrutalism',
    );

    expect(theme).toBeTruthy();

    const application = deriveStyleTransferApplication(theme!);

    expect(application.name).toBe('Neubrutalism');
    expect(application.dataset.styleSurface).toBe('flat');
    expect(application.cssVars['--color-background']).toContain('light-dark(');
    expect(application.cssVars['--font-sans']).toBeTruthy();
    expect(application.cssVars['--button-primary-background']).toBeTruthy();
    expect(application.cssVars['--radius-sm']).toBe('0px');
    expect(application.cssVars['--radius-md']).toBe('0px');
    expect(application.cssVars['--radius-lg']).toBe('0px');
    expect(application.cssVars).not.toHaveProperty('--radius-button');
    expect(application.cssVars).not.toHaveProperty('--radius-chip');
    expect(application.cssVars).not.toHaveProperty('--radius-pill');
  });

  it('derives compact theme radii from the shared maximum radius token', () => {
    const theme = styleTransferPresetThemes.find(
      (preset) => preset.id === 'monochrome-terminal',
    );

    expect(theme).toBeTruthy();

    const application = deriveStyleTransferApplication(theme!);

    expect(application.cssVars['--radius-sm']).toBe(
      'calc(var(--radius-lg-base) * 0.133333)',
    );
    expect(application.cssVars['--radius-md']).toBe(
      'calc(var(--radius-lg-base) * 0.133333)',
    );
    expect(application.cssVars['--radius-lg']).toBe(
      'calc(var(--radius-lg-base) * 0.133333)',
    );
  });

  it('renders Soft UI artwork as wide folded panels instead of nested frames', () => {
    const softUiPreset = styleTransferPresetSummaries.find(
      (preset) => preset.id === 'soft-ui',
    );

    expect(softUiPreset).toBeTruthy();

    const config = deriveStyleTransferArtworkRenderConfig(
      softUiPreset!.artwork.spec,
    );
    const rotatedRects = config.shapes.filter(
      (
        shape,
      ): shape is Extract<(typeof config.shapes)[number], { type: 'rect' }> =>
        shape.type === 'rect' &&
        typeof shape.transform === 'string' &&
        shape.transform.includes('rotate('),
    );

    expect(rotatedRects.length).toBeGreaterThanOrEqual(4);

    rotatedRects.forEach((shape) => {
      expect(shape.width).toBeGreaterThan(shape.height * 2);
    });
  });
});
