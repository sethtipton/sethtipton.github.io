import { describe, expect, it } from 'vitest';

import { deriveStyleTransferApplication } from '../lib/style-transfer/deriveTheme';
import { resolveThemeGlobeInput } from '../lib/style-transfer/themeGlobeRuntime';
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
      sans: 'neo-grotesk',
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

describe('theme globe runtime helpers', () => {
  it('builds globe props for the default canvas when no custom application is active', () => {
    const globeInput = resolveThemeGlobeInput({
      controllerState: {
        id: null,
        mode: 'auto',
        name: 'Original Canvas',
        presetId: null,
        prompt: null,
        source: 'default',
      },
      currentApplication: null,
      prefersDarkScheme: true,
    });

    expect(globeInput.themeId).toBe('default');
    expect(globeInput.themeName).toBe('Original Canvas');
    expect(globeInput.effectiveMode).toBe('dark');
    expect(globeInput.colors.background).toBe('#0e1419');
  });

  it('uses the active application colors and dataset hints for generated themes', () => {
    const theme = createThemeRecord();
    const application = deriveStyleTransferApplication(theme);
    const globeInput = resolveThemeGlobeInput({
      artworkFamily: 'paper-cut',
      controllerState: {
        id: theme.id,
        mode: 'auto',
        name: theme.name,
        presetId: null,
        prompt: theme.prompt,
        source: 'prompt',
      },
      currentApplication: application,
      prefersDarkScheme: false,
    });

    expect(globeInput.themeId).toBe(theme.id);
    expect(globeInput.source).toBe('prompt');
    expect(globeInput.effectiveMode).toBe('light');
    expect(globeInput.colors.accent).toBe('#2563eb');
    expect(globeInput.dataset.styleSurface).toBe('glass');
    expect(globeInput.artworkFamily).toBe('paper-cut');
  });
});
