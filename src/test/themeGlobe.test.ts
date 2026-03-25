import { describe, expect, it } from 'vitest';

import { createThemeGlobeModel } from '../lib/style-transfer/themeGlobe';
import { resolvePaletteForMode } from '../lib/style-transfer/palette';
import {
  createCustomStyleTransferThemeRecord,
  styleTransferModelOutputSchema,
} from '../lib/style-transfer/schema';

function createThemeRecord() {
  const prompt = 'Warm noir with luminous edges';
  const payload = styleTransferModelOutputSchema.parse({
    styleName: 'Warm Noir',
    palette: {
      background: { light: '#f8f4ec', dark: '#0f1117' },
      backgroundAlt: { light: '#ece2d1', dark: '#151824' },
      surface: { light: '#fffaf1', dark: '#171b26' },
      surfaceStrong: { light: '#e7dac8', dark: '#202736' },
      surfaceTint: { light: '#f4ead8', dark: '#252e3b' },
      surfacePaper: { light: '#fff7eb', dark: '#131922' },
      text: { light: '#1f2732', dark: '#edf2f8' },
      muted: { light: '#596675', dark: '#aab8c8' },
      accent: { light: '#a855f7', dark: '#f59e0b' },
      accentStrong: { light: '#7c3aed', dark: '#fbbf24' },
      focus: { light: '#0ea5e9', dark: '#7dd3fc' },
    },
    fonts: {
      sans: 'humanist',
      serif: 'editorial',
    },
    density: 'balanced',
    surfaceStyle: 'glow',
    buttonStyle: 'pill',
    pattern: 'noise',
    motion: 'calm',
  });

  return createCustomStyleTransferThemeRecord(prompt, payload);
}

describe('theme globe model', () => {
  it('creates one spherical Voronoi panel per palette token', () => {
    const theme = createThemeRecord();
    const colors = resolvePaletteForMode(theme.palette, 'dark');
    const model = createThemeGlobeModel({
      artworkFamily: 'offset-rings',
      colors,
      dataset: {
        styleButton: theme.buttonStyle,
        styleDensity: theme.density,
        styleMotion: theme.motion,
        stylePattern: theme.pattern,
        styleSurface: theme.surfaceStyle,
      },
      effectiveMode: 'dark',
      source: theme.source,
      themeId: theme.id,
      themeName: theme.name,
    });

    expect(model.cells).toHaveLength(6);
    expect(model.cells.map((cell) => cell.token)).toEqual([
      'text',
      'accentStrong',
      'focus',
      'muted',
      'background',
      'accent',
    ]);
  });

  it('is deterministic for the same theme inputs', () => {
    const theme = createThemeRecord();
    const colors = resolvePaletteForMode(theme.palette, 'dark');
    const input = {
      artworkFamily: 'offset-rings' as const,
      colors,
      dataset: {
        styleButton: theme.buttonStyle,
        styleDensity: theme.density,
        styleMotion: theme.motion,
        stylePattern: theme.pattern,
        styleSurface: theme.surfaceStyle,
      },
      effectiveMode: 'dark' as const,
      source: theme.source,
      themeId: theme.id,
      themeName: theme.name,
    };

    const firstModel = createThemeGlobeModel(input);
    const secondModel = createThemeGlobeModel(input);

    expect(firstModel.cells[0]?.centroid).toEqual(
      secondModel.cells[0]?.centroid,
    );
    expect(firstModel.cells[0]?.positions).toEqual(
      secondModel.cells[0]?.positions,
    );
  });
});
