import { afterEach, describe, expect, it } from 'vitest';

import {
  resolveActiveStyleTransferArtwork,
  type StyleTransferController,
} from '../lib/style-transfer/controller';
import { deriveStyleTransferApplication } from '../lib/style-transfer/deriveTheme';
import { styleTransferPresetSummaries } from '../lib/style-transfer/presets';
import { createCustomStyleTransferThemeRecord } from '../lib/style-transfer/schema';

function createController(
  overrides: Partial<StyleTransferController>,
): StyleTransferController {
  return {
    getCurrentApplication: () => null,
    getState: () => ({
      id: null,
      mode: 'auto',
      name: 'Original Canvas',
      presetId: null,
      prompt: null,
      source: 'default',
    }),
    getMode: () => 'auto',
    getPresets: () => [],
    getGeneratedThemes: () => [],
    setMode: () => true,
    applyPreset: () => true,
    applyGeneratedTheme: () => true,
    applyApplication: () => {},
    reset: () => {},
    sync: () => {},
    ...overrides,
  };
}

describe('resolveActiveStyleTransferArtwork', () => {
  afterEach(() => {
    delete window.__siteStyleTransfer;
    delete document.documentElement.dataset.styleButton;
    delete document.documentElement.dataset.styleDensity;
    delete document.documentElement.dataset.styleMotion;
    delete document.documentElement.dataset.stylePattern;
    delete document.documentElement.dataset.styleSurface;
  });

  it('returns the active preset artwork from the controller', () => {
    const preset = styleTransferPresetSummaries[0];

    window.__siteStyleTransfer = createController({
      getState: () => ({
        id: preset.id,
        mode: 'auto',
        name: preset.name,
        presetId: preset.id,
        prompt: preset.prompt,
        source: 'preset',
      }),
      getPresets: () => styleTransferPresetSummaries,
    });

    expect(resolveActiveStyleTransferArtwork()).toEqual({
      artwork: preset.artwork,
      key: `preset:${preset.id}`,
    });
  });

  it('creates a fallback prompt artwork when generated artwork is missing', () => {
    document.documentElement.dataset.styleButton = 'outline';
    document.documentElement.dataset.styleDensity = 'airy';
    document.documentElement.dataset.styleMotion = 'calm';
    document.documentElement.dataset.stylePattern = 'grid';
    document.documentElement.dataset.styleSurface = 'glass';

    window.__siteStyleTransfer = createController({
      getState: () => ({
        id: 'generated-theme',
        mode: 'light',
        name: 'Generated Theme',
        presetId: null,
        prompt: 'glacial editorial with cobalt accents',
        source: 'prompt',
      }),
      getGeneratedThemes: () => [
        {
          artwork: null,
          id: 'generated-theme',
          name: 'Generated Theme',
          prompt: 'glacial editorial with cobalt accents',
        },
      ],
    });

    const resolved = resolveActiveStyleTransferArtwork();

    expect(resolved.key).toBe('prompt:generated-theme');
    expect(resolved.artwork?.source).toBe('fallback');
    expect(resolved.artwork?.spec.family).toBeTruthy();
  });

  it('prefers the currently applied prompt artwork before generated history syncs', () => {
    const preset = styleTransferPresetSummaries[0];
    const theme = createCustomStyleTransferThemeRecord(
      'glacial editorial with cobalt accents',
      {
        styleName: 'Generated Theme',
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
      },
    );
    const application = deriveStyleTransferApplication(theme);

    window.__siteStyleTransfer = createController({
      getCurrentApplication: () => ({
        ...application,
        artwork: preset.artwork,
        id: 'generated-theme',
      }),
      getState: () => ({
        id: 'generated-theme',
        mode: 'light',
        name: 'Generated Theme',
        presetId: null,
        prompt: 'glacial editorial with cobalt accents',
        source: 'prompt',
      }),
      getGeneratedThemes: () => [],
    });

    expect(resolveActiveStyleTransferArtwork()).toEqual({
      artwork: preset.artwork,
      key: 'prompt:generated-theme',
    });
  });
});
