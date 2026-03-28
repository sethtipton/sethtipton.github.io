import { describe, expect, it } from 'vitest';

import {
  ensurePresetStyleTransferThemeCompliance,
  ensurePromptStyleTransferThemeCompliance,
  evaluateStyleTransferThemeCompliance,
} from '../lib/style-transfer/compliance';
import { styleTransferPresetCatalogSchema } from '../lib/style-transfer/presetSchema';
import {
  createCustomStyleTransferThemeRecord,
  styleTransferModelOutputSchema,
  type DualHex,
  type StyleTransferThemeColorRole,
} from '../lib/style-transfer/schema';

function createThemeRecord(
  prompt: string,
  overrides?: Partial<Record<StyleTransferThemeColorRole, DualHex>>,
) {
  const payload = styleTransferModelOutputSchema.parse({
    styleName: 'Coastal Study',
    palette: {
      background: { light: '#f6fbff', dark: '#0f172a' },
      backgroundAlt: { light: '#ebf3f8', dark: '#132034' },
      surface: { light: '#ffffff', dark: '#162033' },
      surfaceStrong: { light: '#d7e3ec', dark: '#1b2940' },
      surfaceTint: { light: '#eef7fb', dark: '#21314d' },
      surfacePaper: { light: '#fcfefc', dark: '#101827' },
      text: { light: '#132131', dark: '#7c8799' },
      muted: { light: '#5b6f84', dark: '#687487' },
      accent: { light: '#2f7aa2', dark: '#4f8bb2' },
      accentStrong: { light: '#1f5d82', dark: '#55708f' },
      focus: { light: '#0f766e', dark: '#4d6886' },
      ...overrides,
    },
    fonts: {
      sans: 'neo-grotesk',
      serif: 'editorial',
    },
    density: 'balanced',
    surfaceStyle: 'glass',
    buttonStyle: 'outline',
    pattern: 'grid',
    motion: 'calm',
  });

  return createCustomStyleTransferThemeRecord(prompt, payload);
}

describe('style transfer compliance', () => {
  it('rebuilds support surfaces and muted text before accepting prompt themes', () => {
    const theme = createThemeRecord(
      'misty coastal palette with softened support text',
      {
        text: { light: '#132131', dark: '#d9e6f4' },
      },
    );

    const initial = evaluateStyleTransferThemeCompliance(theme);
    const result = ensurePromptStyleTransferThemeCompliance(theme);

    expect(initial.passesCorePairings).toBe(true);
    expect(result.status).toBe('pass');
    expect(result.theme).toBeTruthy();
    expect(result.adjustments.length).toBeGreaterThan(0);
    expect(result.analysis.corePassCount).toBe(result.analysis.coreTotal);
    expect(result.analysis.supportPassCount).toBe(result.analysis.supportTotal);
    expect(result.theme.palette.muted.dark).not.toBe(theme.palette.muted.dark);
  });

  it('normalizes dark structure when one text color cannot satisfy both layers', () => {
    const theme = createThemeRecord('high-conflict dark mode', {
      background: { light: '#f6fbff', dark: '#ffffff' },
      surface: { light: '#ffffff', dark: '#000000' },
      text: { light: '#132131', dark: '#777777' },
      muted: { light: '#5b6f84', dark: '#888888' },
      accentStrong: { light: '#1f5d82', dark: '#999999' },
      focus: { light: '#0f766e', dark: '#999999' },
    });

    const result = ensurePromptStyleTransferThemeCompliance(theme);

    expect(result.status).toBe('normalized');
    expect(result.theme).toBeTruthy();
    expect(result.analysis.corePassCount).toBe(result.analysis.coreTotal);
    expect(result.failureMessage).toBeNull();
    expect(result.theme.palette.background.dark).not.toBe(
      theme.palette.background.dark,
    );
    expect(result.theme.palette.surface.dark).not.toBe(
      theme.palette.surface.dark,
    );
  });

  it('rebuilds preset catalog entries through the same support-palette pipeline', () => {
    const fixture = {
      id: 'coastal-study',
      name: 'Coastal Study',
      prompt: 'a coastal preset that starts with muddy support colors',
      source: 'preset' as const,
      palette: {
        background: { light: '#f6fbff', dark: '#ffffff' },
        backgroundAlt: { light: '#ebf3f8', dark: '#ffffff' },
        surface: { light: '#ffffff', dark: '#000000' },
        surfaceStrong: { light: '#d7e3ec', dark: '#111111' },
        surfaceTint: { light: '#eef7fb', dark: '#181818' },
        surfacePaper: { light: '#fcfefc', dark: '#0d0d0d' },
        text: { light: '#132131', dark: '#777777' },
        muted: { light: '#5b6f84', dark: '#888888' },
        accent: { light: '#2f7aa2', dark: '#4f8bb2' },
        accentStrong: { light: '#1f5d82', dark: '#999999' },
        focus: { light: '#0f766e', dark: '#999999' },
      },
      fonts: {
        sans: 'neo-grotesk' as const,
        serif: 'editorial' as const,
      },
      density: 'balanced' as const,
      surfaceStyle: 'glass' as const,
      buttonStyle: 'outline' as const,
      radiusProfile: 'soft' as const,
      pattern: 'grid' as const,
      motion: 'calm' as const,
      meta: {
        category: 'atmospheric' as const,
        notes: 'Fixture for preset rebuilding.',
        tags: ['coastal', 'fixture'],
      },
    };
    const rebuilt = ensurePresetStyleTransferThemeCompliance(
      createThemeRecord(fixture.prompt, fixture.palette),
    );

    expect(() =>
      styleTransferPresetCatalogSchema.parse([fixture]),
    ).not.toThrow();
    expect(rebuilt.passesRequiredPairings).toBe(true);
    expect(rebuilt.theme.palette.muted.dark).not.toBe(
      fixture.palette.muted.dark,
    );
  });
});
