import { describe, expect, it } from 'vitest';

import { createThemeGlobeModel } from '../lib/style-transfer/themeGlobe';
import { resolvePaletteForMode } from '../lib/style-transfer/palette';
import {
  createCustomStyleTransferThemeRecord,
  styleTransferModelOutputSchema,
} from '../lib/style-transfer/schema';

function createThemeRecord() {
  return createThemeRecordWithOverrides({});
}

function createThemeRecordWithOverrides(
  overrides: Partial<{
    buttonStyle: 'hard-edge' | 'outline' | 'pill' | 'soft';
    density: 'airy' | 'balanced' | 'compact';
    motion: 'calm' | 'expressive' | 'reduced';
    pattern:
      | 'constellation'
      | 'grid'
      | 'noise'
      | 'none'
      | 'orbital'
      | 'scanlines';
    surfaceStyle: 'flat' | 'glass' | 'glow' | 'paper';
  }>,
) {
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
    density: overrides.density ?? 'balanced',
    surfaceStyle: overrides.surfaceStyle ?? 'glow',
    buttonStyle: overrides.buttonStyle ?? 'pill',
    pattern: overrides.pattern ?? 'noise',
    motion: overrides.motion ?? 'calm',
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

  it('keeps the Voronoi layout stable across different theme treatments', () => {
    const baseTheme = createThemeRecord();
    const alternateTheme = createThemeRecordWithOverrides({
      buttonStyle: 'hard-edge',
      density: 'airy',
      pattern: 'grid',
      surfaceStyle: 'paper',
    });

    const baseModel = createThemeGlobeModel({
      artworkFamily: 'offset-rings',
      colors: resolvePaletteForMode(baseTheme.palette, 'dark'),
      dataset: {
        styleButton: baseTheme.buttonStyle,
        styleDensity: baseTheme.density,
        styleMotion: baseTheme.motion,
        stylePattern: baseTheme.pattern,
        styleSurface: baseTheme.surfaceStyle,
      },
      effectiveMode: 'dark',
      source: baseTheme.source,
      themeId: baseTheme.id,
      themeName: baseTheme.name,
    });

    const alternateModel = createThemeGlobeModel({
      artworkFamily: 'paper-cut',
      colors: resolvePaletteForMode(alternateTheme.palette, 'light'),
      dataset: {
        styleButton: alternateTheme.buttonStyle,
        styleDensity: alternateTheme.density,
        styleMotion: alternateTheme.motion,
        stylePattern: alternateTheme.pattern,
        styleSurface: alternateTheme.surfaceStyle,
      },
      effectiveMode: 'light',
      source: alternateTheme.source,
      themeId: alternateTheme.id,
      themeName: alternateTheme.name,
    });

    const normalizeCentroid = (centroid: [number, number, number]) => {
      const length = Math.hypot(centroid[0], centroid[1], centroid[2]);
      return centroid.map((value) => Number((value / length).toFixed(6)));
    };

    expect(baseModel.cells.map((cell) => cell.token)).toEqual(
      alternateModel.cells.map((cell) => cell.token),
    );
    const baseCentroids = baseModel.cells.map((cell) =>
      normalizeCentroid(cell.centroid),
    );
    const alternateCentroids = alternateModel.cells.map((cell) =>
      normalizeCentroid(cell.centroid),
    );

    baseCentroids.forEach((centroid, index) => {
      const alternateCentroid = alternateCentroids[index]!;
      const distance = Math.hypot(
        centroid[0]! - alternateCentroid[0]!,
        centroid[1]! - alternateCentroid[1]!,
        centroid[2]! - alternateCentroid[2]!,
      );

      expect(distance).toBeLessThan(0.01);
    });
    expect(baseModel.outlineEmphasis).not.toBe(alternateModel.outlineEmphasis);
  });
});
