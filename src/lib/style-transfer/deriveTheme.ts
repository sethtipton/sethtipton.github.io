import type {
  DualHex,
  StyleTransferRadiusProfile,
  StyleTransferThemeRecord,
  StyleTransferThemeSource,
} from './schema';
import {
  createStyleTransferMotionCssVars,
  getThemeMotionProfile,
  styleTransferMotionCssVarKeys,
} from './motion';
import { resolveStyleTransferRadiusProfile } from './schema';

type StyleTransferDatasetKey =
  | 'styleId'
  | 'stylePattern'
  | 'styleSurface'
  | 'styleButton'
  | 'styleDensity'
  | 'styleMotion'
  | 'styleSource';

export type StyleTransferApplication = {
  id: string;
  name: string;
  prompt: string | null;
  source: StyleTransferThemeSource;
  cssVars: Record<string, string>;
  dataset: Record<StyleTransferDatasetKey, string>;
  themeColor: DualHex;
};

const baseSpaceScale = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 6] as const;

const sansStacks = {
  default:
    "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  'neo-grotesk':
    "'Suisse Intl', 'Avenir Next', 'Inter', 'Segoe UI', Arial, sans-serif",
  humanist:
    "'IBM Plex Sans', 'Inter', 'Segoe UI', system-ui, Arial, sans-serif",
  terminal:
    "'IBM Plex Mono', 'SFMono-Regular', 'SF Mono', 'Cascadia Code', 'Liberation Mono', monospace",
} as const;

const serifStacks = {
  default:
    "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif",
  editorial:
    "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', 'Cormorant Garamond', Georgia, serif",
  oldstyle:
    "'Baskerville', 'Goudy Old Style', 'Palatino Linotype', Georgia, serif",
} as const;

const densityConfig = {
  compact: {
    scale: 0.92,
    hoverLift: '-0.08rem',
  },
  balanced: {
    scale: 1,
    hoverLift: '-0.1rem',
  },
  airy: {
    scale: 1.08,
    hoverLift: '-0.14rem',
  },
} as const;

const fixedLayoutWidthConfig = {
  containerWidth: '75rem',
  contentWidth: '48rem',
} as const;

const radiusProfileConfig = {
  sharp: {
    lg: 0,
    md: 0,
    sm: 0,
  },
  tight: {
    lg: 2 / 15,
    md: 2 / 15,
    sm: 2 / 15,
  },
  balanced: {
    lg: 1,
    md: 7 / 12,
    sm: 1 / 3,
  },
  soft: {
    lg: 1,
    md: 3 / 4,
    sm: 1 / 2,
  },
  puffy: {
    lg: 1,
    md: 5 / 6,
    sm: 2 / 3,
  },
} as const satisfies Record<
  StyleTransferRadiusProfile,
  {
    lg: number;
    md: number;
    sm: number;
  }
>;

const surfaceConfig = {
  flat: {
    headerBackground:
      'color-mix(in srgb, var(--color-background) 92%, transparent)',
    panelBackground: 'var(--color-surface)',
    panelBorderColor: 'var(--color-border)',
    panelShadow: '0 0 0 transparent',
    panelBlur: '0px',
    headerBlur: '0px',
  },
  paper: {
    headerBackground:
      'color-mix(in srgb, var(--color-surface-paper) 94%, transparent)',
    panelBackground:
      'linear-gradient(180deg, var(--color-surface-paper), var(--color-surface))',
    panelBorderColor: 'var(--color-border)',
    panelShadow:
      '0 18px 42px color-mix(in srgb, var(--color-text) 7%, transparent)',
    panelBlur: '0px',
    headerBlur: '8px',
  },
  glass: {
    headerBackground:
      'color-mix(in srgb, var(--color-surface) 62%, transparent)',
    panelBackground:
      'color-mix(in srgb, var(--color-surface) 95%, transparent)',
    panelBorderColor: 'var(--color-border-strong)',
    panelShadow:
      '0 20px 48px color-mix(in srgb, var(--color-text) 12%, transparent)',
    panelBlur: '18px',
    headerBlur: '18px',
  },
  glow: {
    headerBackground:
      'color-mix(in srgb, var(--color-background) 78%, transparent)',
    panelBackground:
      'linear-gradient(180deg, var(--color-surface), var(--color-surface-tint))',
    panelBorderColor:
      'color-mix(in srgb, var(--color-accent) 38%, transparent)',
    panelShadow:
      '0 0 0 1px color-mix(in srgb, var(--color-accent) 22%, transparent), 0 20px 48px color-mix(in srgb, var(--color-accent) 20%, transparent)',
    panelBlur: '12px',
    headerBlur: '16px',
  },
} as const;

const buttonConfig = {
  soft: {
    primaryBackground: 'var(--color-accent)',
    primaryBackgroundHover: 'var(--color-accent-strong)',
    primaryBorderColor: 'var(--color-transparent)',
    primaryColor: 'var(--color-white)',
    primaryShadow: 'var(--shadow-card)',
    secondaryBackground: 'var(--color-surface-soft)',
    secondaryBackgroundHover: 'var(--color-surface)',
    secondaryBorderColor: 'var(--color-border-strong)',
    secondaryColor: 'var(--color-text)',
    secondaryShadow: 'none',
    fontWeight: '700',
    letterSpacing: '0',
    textTransform: 'none',
  },
  outline: {
    primaryBackground: 'var(--color-transparent)',
    primaryBackgroundHover: 'var(--color-accent-soft)',
    primaryBorderColor: 'var(--color-accent-strong)',
    primaryColor: 'var(--color-accent-strong)',
    primaryShadow: 'none',
    secondaryBackground: 'var(--color-transparent)',
    secondaryBackgroundHover: 'var(--color-surface-soft)',
    secondaryBorderColor: 'var(--color-border-strong)',
    secondaryColor: 'var(--color-text)',
    secondaryShadow: 'none',
    fontWeight: '700',
    letterSpacing: '0.01em',
    textTransform: 'none',
  },
  'hard-edge': {
    primaryBackground: 'var(--color-text)',
    primaryBackgroundHover: 'var(--color-accent-strong)',
    primaryBorderColor: 'var(--color-text)',
    primaryColor: 'var(--color-surface)',
    primaryShadow:
      '0 0 0 1px color-mix(in srgb, var(--color-text) 18%, transparent)',
    secondaryBackground: 'var(--color-surface)',
    secondaryBackgroundHover: 'var(--color-surface-strong)',
    secondaryBorderColor: 'var(--color-border-strong)',
    secondaryColor: 'var(--color-text)',
    secondaryShadow: 'none',
    fontWeight: '800',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  pill: {
    primaryBackground:
      'linear-gradient(135deg, var(--color-accent), var(--color-accent-strong))',
    primaryBackgroundHover:
      'linear-gradient(135deg, var(--color-accent-strong), var(--color-accent))',
    primaryBorderColor: 'var(--color-transparent)',
    primaryColor: 'var(--color-white)',
    primaryShadow:
      '0 12px 32px color-mix(in srgb, var(--color-accent) 22%, transparent)',
    secondaryBackground:
      'color-mix(in srgb, var(--color-surface) 92%, transparent)',
    secondaryBackgroundHover: 'var(--color-surface)',
    secondaryBorderColor: 'var(--color-border)',
    secondaryColor: 'var(--color-text)',
    secondaryShadow: 'none',
    fontWeight: '700',
    letterSpacing: '0.01em',
    textTransform: 'none',
  },
} as const;

const patternOpacity = {
  none: '0%',
  tilt: '14%',
  grid: '12%',
  noise: '8%',
  scanlines: '11%',
} as const;

function formatRem(value: number) {
  return `${Number(value.toFixed(3))}rem`;
}

function formatRadiusScale(scale: number) {
  if (scale <= 0) {
    return '0px';
  }

  if (scale === 1) {
    return 'var(--radius-lg-base)';
  }

  return `calc(var(--radius-lg-base) * ${Number(scale.toFixed(6))})`;
}

function toLightDarkValue(value: DualHex) {
  return `light-dark(${value.light}, ${value.dark})`;
}

export const styleTransferDatasetKeys = [
  'styleId',
  'stylePattern',
  'styleSurface',
  'styleButton',
  'styleDensity',
  'styleMotion',
  'styleSource',
] as const satisfies readonly StyleTransferDatasetKey[];

export const styleTransferCssVarKeys = [
  '--color-background',
  '--color-background-alt',
  '--color-surface',
  '--color-surface-strong',
  '--color-surface-tint',
  '--color-surface-paper',
  '--color-text',
  '--color-muted',
  '--color-accent',
  '--color-accent-strong',
  '--color-focus',
  '--font-sans',
  '--font-serif',
  '--container-width',
  '--content-width',
  '--space-1',
  '--space-2',
  '--space-3',
  '--space-4',
  '--space-5',
  '--space-6',
  '--space-7',
  '--space-8',
  '--space-9',
  '--radius-sm',
  '--radius-md',
  '--radius-lg',
  '--surface-border-width',
  '--control-border-width',
  '--surface-card-background',
  '--surface-card-border-color',
  '--surface-card-shadow',
  '--panel-blur',
  '--site-header-blur',
  '--site-header-background',
  '--button-primary-background',
  '--button-primary-background-hover',
  '--button-primary-border-color',
  '--button-primary-color',
  '--button-primary-shadow',
  '--button-secondary-background',
  '--button-secondary-background-hover',
  '--button-secondary-border-color',
  '--button-secondary-color',
  '--button-secondary-shadow',
  '--button-font-weight',
  '--button-letter-spacing',
  '--button-text-transform',
  '--control-background',
  '--control-background-hover',
  '--control-border-color',
  '--control-border-color-hover',
  ...styleTransferMotionCssVarKeys,
  '--surface-hover-translate-y',
  '--site-pattern-opacity',
  '--site-pattern-secondary-opacity',
  '--site-overlay-opacity',
  '--site-noise-opacity',
  '--site-pattern-accent',
  '--site-pattern-text',
  '--site-pattern-line-size',
  '--site-pattern-line-thickness',
] as const;

export function deriveStyleTransferApplication(
  theme: StyleTransferThemeRecord,
): StyleTransferApplication {
  const density = densityConfig[theme.density];
  const motion = getThemeMotionProfile(theme);
  const motionCssVars = createStyleTransferMotionCssVars(motion);
  const surface = surfaceConfig[theme.surfaceStyle];
  const button = buttonConfig[theme.buttonStyle];
  const radiusProfile = resolveStyleTransferRadiusProfile(theme);
  const radiusScales = radiusProfileConfig[radiusProfile];
  const radii = {
    lg: formatRadiusScale(radiusScales.lg),
    md: formatRadiusScale(radiusScales.md),
    sm: formatRadiusScale(radiusScales.sm),
  };

  const spaces = baseSpaceScale.map((value) =>
    formatRem(value * density.scale),
  );

  return {
    id: theme.id,
    name: theme.name,
    prompt: theme.prompt,
    source: theme.source,
    themeColor: theme.palette.background,
    dataset: {
      styleId: theme.id,
      stylePattern: theme.pattern,
      styleSurface: theme.surfaceStyle,
      styleButton: theme.buttonStyle,
      styleDensity: theme.density,
      styleMotion: theme.motion,
      styleSource: theme.source,
    },
    cssVars: {
      '--color-background': toLightDarkValue(theme.palette.background),
      '--color-background-alt': toLightDarkValue(theme.palette.backgroundAlt),
      '--color-surface': toLightDarkValue(theme.palette.surface),
      '--color-surface-strong': toLightDarkValue(theme.palette.surfaceStrong),
      '--color-surface-tint': toLightDarkValue(theme.palette.surfaceTint),
      '--color-surface-paper': toLightDarkValue(theme.palette.surfacePaper),
      '--color-text': toLightDarkValue(theme.palette.text),
      '--color-muted': toLightDarkValue(theme.palette.muted),
      '--color-accent': toLightDarkValue(theme.palette.accent),
      '--color-accent-strong': toLightDarkValue(theme.palette.accentStrong),
      '--color-focus': toLightDarkValue(theme.palette.focus),
      '--font-sans': sansStacks[theme.fonts.sans],
      '--font-serif': serifStacks[theme.fonts.serif],
      '--container-width': fixedLayoutWidthConfig.containerWidth,
      '--content-width': fixedLayoutWidthConfig.contentWidth,
      '--space-1': spaces[0],
      '--space-2': spaces[1],
      '--space-3': spaces[2],
      '--space-4': spaces[3],
      '--space-5': spaces[4],
      '--space-6': spaces[5],
      '--space-7': spaces[6],
      '--space-8': spaces[7],
      '--space-9': spaces[8],
      '--radius-sm': radii.sm,
      '--radius-md': radii.md,
      '--radius-lg': radii.lg,
      '--surface-border-width': theme.surfaceStyle === 'flat' ? '1px' : '1px',
      '--control-border-width':
        theme.buttonStyle === 'outline' ? '1.5px' : '1px',
      '--surface-card-background': surface.panelBackground,
      '--surface-card-border-color': surface.panelBorderColor,
      '--surface-card-shadow': surface.panelShadow,
      '--panel-blur': surface.panelBlur,
      '--site-header-blur': surface.headerBlur,
      '--site-header-background': surface.headerBackground,
      '--button-primary-background': button.primaryBackground,
      '--button-primary-background-hover': button.primaryBackgroundHover,
      '--button-primary-border-color': button.primaryBorderColor,
      '--button-primary-color': button.primaryColor,
      '--button-primary-shadow': button.primaryShadow,
      '--button-secondary-background': button.secondaryBackground,
      '--button-secondary-background-hover': button.secondaryBackgroundHover,
      '--button-secondary-border-color': button.secondaryBorderColor,
      '--button-secondary-color': button.secondaryColor,
      '--button-secondary-shadow': button.secondaryShadow,
      '--button-font-weight': button.fontWeight,
      '--button-letter-spacing': button.letterSpacing,
      '--button-text-transform': button.textTransform,
      '--control-background': 'var(--button-secondary-background)',
      '--control-background-hover': 'var(--button-secondary-background-hover)',
      '--control-border-color': 'var(--button-secondary-border-color)',
      '--control-border-color-hover': 'var(--color-text)',
      ...motionCssVars,
      '--surface-hover-translate-y': density.hoverLift,
      '--site-pattern-opacity': patternOpacity[theme.pattern],
      '--site-pattern-secondary-opacity':
        theme.pattern === 'noise' ? '6%' : '10%',
      '--site-overlay-opacity': theme.surfaceStyle === 'glow' ? '1.18' : '1',
      '--site-noise-opacity': theme.pattern === 'noise' ? '1' : '0',
      '--site-pattern-accent': 'var(--color-accent)',
      '--site-pattern-text': 'var(--color-text)',
      '--site-pattern-line-size':
        theme.pattern === 'scanlines' ? '12px' : '28px',
      '--site-pattern-line-thickness':
        theme.pattern === 'grid'
          ? '1px'
          : theme.pattern === 'scanlines'
            ? '2px'
            : '1px',
    },
  };
}
