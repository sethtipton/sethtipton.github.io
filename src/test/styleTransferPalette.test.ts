import { describe, expect, it } from 'vitest';

import { deriveStyleTransferApplication } from '../lib/style-transfer/deriveTheme';
import {
  createPaletteFromStoredApplication,
  resolvePaletteForMode,
  resolveStyleTransferEffectiveMode,
} from '../lib/style-transfer/palette';
import {
  createCustomStyleTransferThemeRecord,
  styleTransferModelOutputSchema,
} from '../lib/style-transfer/schema';

function createThemeRecord() {
  const prompt = 'Glacial editorial with cobalt accents';
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
      sans: 'default',
      serif: 'editorial',
    },
    density: 'airy',
    surfaceStyle: 'glass',
    buttonStyle: 'outline',
    pattern: 'grid',
    motion: 'calm',
  });

  return createCustomStyleTransferThemeRecord(prompt, payload);
}

describe('style transfer palette helpers', () => {
  it('reconstructs a dual palette from the stored application css vars', () => {
    const theme = createThemeRecord();
    const application = deriveStyleTransferApplication(theme);
    const palette = createPaletteFromStoredApplication(application);

    expect(palette).toEqual(theme.palette);
  });

  it('resolves only the effective mode colors for the globe', () => {
    const theme = createThemeRecord();

    expect(resolvePaletteForMode(theme.palette, 'light').accent).toBe(
      '#2563eb',
    );
    expect(resolvePaletteForMode(theme.palette, 'dark').accent).toBe('#60a5fa');
  });

  it('resolves auto mode against the current color-scheme preference', () => {
    expect(resolveStyleTransferEffectiveMode('auto', false)).toBe('light');
    expect(resolveStyleTransferEffectiveMode('auto', true)).toBe('dark');
    expect(resolveStyleTransferEffectiveMode('light', true)).toBe('light');
  });
});
