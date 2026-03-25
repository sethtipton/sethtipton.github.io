import type {
  StoredStyleTransferApplication,
  StyleTransferMode,
} from './controller';
import {
  styleTransferThemeColorRoleOptions,
  type StyleTransferThemeColorRole,
  type StyleTransferThemeRecord,
} from './schema';

export const styleTransferPaletteTokenOrder =
  styleTransferThemeColorRoleOptions;

export const styleTransferPaletteColorVarMap = {
  accent: '--color-accent',
  accentStrong: '--color-accent-strong',
  background: '--color-background',
  backgroundAlt: '--color-background-alt',
  focus: '--color-focus',
  muted: '--color-muted',
  surface: '--color-surface',
  surfacePaper: '--color-surface-paper',
  surfaceStrong: '--color-surface-strong',
  surfaceTint: '--color-surface-tint',
  text: '--color-text',
} satisfies Record<keyof StyleTransferThemeRecord['palette'], string>;

export const defaultCanvasPalette = {
  background: { light: '#f3efe7', dark: '#0e1419' },
  backgroundAlt: { light: '#e8dfd2', dark: '#162028' },
  surface: { light: '#fffdf9', dark: '#121a20' },
  surfaceStrong: { light: '#efe7dc', dark: '#18232c' },
  surfaceTint: { light: '#f7f1e8', dark: '#1d2933' },
  surfacePaper: { light: '#fffdf8', dark: '#10181f' },
  text: { light: '#1f2933', dark: '#e8eef5' },
  muted: { light: '#52606d', dark: '#a3b3c3' },
  accent: { light: '#0f766e', dark: '#247c75' },
  accentStrong: { light: '#115e59', dark: '#1f6a64' },
  focus: { light: '#0284c7', dark: '#67c8ff' },
} satisfies StyleTransferThemeRecord['palette'];

export type ResolvedStyleTransferPalette = Record<
  StyleTransferThemeColorRole,
  string
>;

export function parseLightDarkColorValue(value: string | undefined) {
  if (!value) {
    return null;
  }

  const match = value.match(
    /^light-dark\(\s*(#[0-9a-fA-F]{6})\s*,\s*(#[0-9a-fA-F]{6})\s*\)$/,
  );

  if (!match) {
    return null;
  }

  return {
    dark: match[2],
    light: match[1],
  };
}

export function createPaletteFromStoredApplication(
  application: Pick<StoredStyleTransferApplication, 'cssVars'>,
) {
  const paletteEntries = Object.entries(styleTransferPaletteColorVarMap).map(
    ([role, cssVar]) => [
      role,
      parseLightDarkColorValue(application.cssVars[cssVar]),
    ],
  );

  if (paletteEntries.some(([, value]) => !value)) {
    return null;
  }

  return Object.fromEntries(
    paletteEntries,
  ) as StyleTransferThemeRecord['palette'];
}

export function resolveStyleTransferEffectiveMode(
  mode: StyleTransferMode,
  prefersDark: boolean,
) {
  return mode === 'auto' ? (prefersDark ? 'dark' : 'light') : mode;
}

export function resolvePaletteForMode(
  palette: StyleTransferThemeRecord['palette'],
  mode: 'dark' | 'light',
): ResolvedStyleTransferPalette {
  return Object.fromEntries(
    styleTransferPaletteTokenOrder.map((token) => [
      token,
      palette[token][mode],
    ]),
  ) as ResolvedStyleTransferPalette;
}

export function formatStyleTransferColorRoleLabel(
  token: StyleTransferThemeColorRole,
) {
  return token
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase());
}
