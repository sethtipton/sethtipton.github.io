import { z } from 'zod';

import {
  styleTransferButtonOptions,
  styleTransferDensityOptions,
  styleTransferMotionOptions,
  styleTransferPatternOptions,
  styleTransferSurfaceOptions,
  styleTransferThemeColorRoleOptions,
  type StyleTransferThemeColorRole,
  type StyleTransferThemeRecord,
} from './schema';

export const styleTransferArtworkSlotKeys = [
  'sectionBackground',
  'scrim',
  'divider',
  'accentGraphic',
] as const;

export const styleTransferArtworkUsageOptions = [
  'section-background',
  'scrim',
  'divider',
  'accent-graphic',
  'surface-overlay',
] as const;

export const styleTransferArtworkFamilyOptions = [
  'soft-blob',
  'layered-wave',
  'angled-panel',
  'contour-lines',
  'offset-rings',
  'grid-mesh',
  'scanline-band',
  'paper-cut',
  'radial-burst',
  'folded-ribbon',
  'modular-tiles',
  'constellation',
  'inset-frames',
] as const;

export const styleTransferArtworkComplexityOptions = [
  'low',
  'balanced',
  'high',
] as const;

export const styleTransferArtworkDensityOptions = [
  'sparse',
  'balanced',
  'dense',
] as const;

export const styleTransferArtworkFillStyleOptions = [
  'solid',
  'gradient',
  'tinted',
  'transparent',
] as const;

export const styleTransferArtworkStrokeStyleOptions = [
  'none',
  'hairline',
  'soft',
  'bold',
] as const;

export const styleTransferArtworkOpacityModeOptions = [
  'whisper',
  'soft',
  'balanced',
  'assertive',
] as const;

export const styleTransferArtworkBlendStyleOptions = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'soft-light',
] as const;

export const styleTransferArtworkCornerStyleOptions = [
  'sharp',
  'rounded',
  'organic',
] as const;

export const styleTransferArtworkMotionStyleOptions = [
  'still',
  'drift',
  'sweep',
] as const;

export const styleTransferArtworkPlacementOptions = [
  'full-bleed',
  'top',
  'bottom',
  'left',
  'right',
  'center',
] as const;

export const styleTransferArtworkMaskBehaviorOptions = [
  'none',
  'fade-edges',
  'fade-top',
  'fade-bottom',
] as const;

export const styleTransferArtworkAspectHintOptions = [
  'wide',
  'tall',
  'square',
  'banner',
  'hero',
] as const;

export const styleTransferArtworkVisualWeightOptions = [
  'whisper',
  'subtle',
  'balanced',
  'bold',
] as const;

export const styleTransferArtworkRestraintOptions = [
  'strict',
  'balanced',
  'expressive',
] as const;

export const styleTransferArtworkBackgroundBehaviorOptions = [
  'transparent',
  'tinted',
  'self-contained',
] as const;

export const styleTransferArtworkContrastOptions = [
  'low',
  'balanced',
  'high',
] as const;

const artworkViewBoxSchema = z.object({
  width: z.number().int().min(320).max(1600),
  height: z.number().int().min(120).max(900),
});

const artworkControlsSchema = z
  .object({
    opacity: z.number().min(0.05).max(1).optional(),
    strokeWidth: z.number().min(0.5).max(8).optional(),
    inset: z.number().min(0).max(160).optional(),
    jitter: z.number().min(0).max(1).optional(),
    curvature: z.number().min(0).max(1).optional(),
    rotation: z.number().min(-45).max(45).optional(),
    amplitude: z.number().min(0).max(1).optional(),
    frequency: z.number().min(0.5).max(8).optional(),
    scale: z.number().min(0.5).max(1.6).optional(),
    noise: z.number().min(0).max(1).optional(),
  })
  .partial()
  .default({});

export const styleTransferArtworkIntentSchema = z.object({
  usage: z.enum(styleTransferArtworkUsageOptions),
  visualWeight: z.enum(styleTransferArtworkVisualWeightOptions),
  restraint: z.enum(styleTransferArtworkRestraintOptions),
  placement: z.enum(styleTransferArtworkPlacementOptions),
  preferredFamilies: z
    .array(z.enum(styleTransferArtworkFamilyOptions))
    .max(3)
    .default([]),
  avoidFamilies: z
    .array(z.enum(styleTransferArtworkFamilyOptions))
    .max(3)
    .default([]),
  backgroundBehavior: z.enum(styleTransferArtworkBackgroundBehaviorOptions),
  contrast: z.enum(styleTransferArtworkContrastOptions),
});

export const styleTransferArtworkSpecSchema = z.object({
  usage: z.enum(styleTransferArtworkUsageOptions),
  family: z.enum(styleTransferArtworkFamilyOptions),
  complexity: z.enum(styleTransferArtworkComplexityOptions),
  density: z.enum(styleTransferArtworkDensityOptions),
  layerCount: z.number().int().min(1).max(6),
  fillStyle: z.enum(styleTransferArtworkFillStyleOptions),
  strokeStyle: z.enum(styleTransferArtworkStrokeStyleOptions),
  opacityMode: z.enum(styleTransferArtworkOpacityModeOptions),
  blendStyle: z.enum(styleTransferArtworkBlendStyleOptions),
  cornerStyle: z.enum(styleTransferArtworkCornerStyleOptions),
  motionStyle: z.enum(styleTransferArtworkMotionStyleOptions),
  colorBinding: z.object({
    primary: z.enum(styleTransferThemeColorRoleOptions),
    secondary: z.enum(styleTransferThemeColorRoleOptions).optional(),
    stroke: z.enum(styleTransferThemeColorRoleOptions).optional(),
    background: z.enum(styleTransferThemeColorRoleOptions).optional(),
  }),
  placement: z.enum(styleTransferArtworkPlacementOptions),
  maskBehavior: z.enum(styleTransferArtworkMaskBehaviorOptions),
  aspectHint: z.enum(styleTransferArtworkAspectHintOptions),
  viewBox: artworkViewBoxSchema.optional(),
  controls: artworkControlsSchema.optional(),
});

export const styleTransferArtworkSlotsSchema = z
  .object({
    sectionBackground: styleTransferArtworkSpecSchema.optional(),
    scrim: styleTransferArtworkSpecSchema.optional(),
    divider: styleTransferArtworkSpecSchema.optional(),
    accentGraphic: styleTransferArtworkSpecSchema.optional(),
  })
  .partial();

export type StyleTransferArtworkSlotKey =
  (typeof styleTransferArtworkSlotKeys)[number];
export type StyleTransferArtworkUsage =
  (typeof styleTransferArtworkUsageOptions)[number];
export type StyleTransferArtworkFamily =
  (typeof styleTransferArtworkFamilyOptions)[number];
export type StyleTransferArtworkIntent = z.infer<
  typeof styleTransferArtworkIntentSchema
>;
export type StyleTransferArtworkSpec = z.infer<
  typeof styleTransferArtworkSpecSchema
>;
export type StyleTransferArtworkSlots = z.infer<
  typeof styleTransferArtworkSlotsSchema
>;

export type StyleTransferArtworkPreview = {
  slotKey: StyleTransferArtworkSlotKey;
  source: 'preset' | 'api' | 'fallback';
  spec: StyleTransferArtworkSpec;
};

export type StyleTransferArtworkResolvedBinding = {
  cssValue: string;
  cssVar: string;
  role: StyleTransferThemeColorRole;
};

export type StyleTransferArtworkResolvedBindings = {
  background?: StyleTransferArtworkResolvedBinding;
  primary: StyleTransferArtworkResolvedBinding;
  secondary?: StyleTransferArtworkResolvedBinding;
  stroke?: StyleTransferArtworkResolvedBinding;
};

export type StyleTransferArtworkResolvedColorValues = {
  background?: string;
  primary: string;
  secondary?: string;
  stroke?: string;
};

type StyleTransferArtworkThemeSignals = {
  buttonStyle?: string | null;
  density?: string | null;
  id?: string | null;
  motion?: string | null;
  name: string;
  pattern?: string | null;
  prompt?: string | null;
  source: StyleTransferThemeRecord['source'];
  surfaceStyle?: string | null;
};

export type StyleTransferArtworkShape =
  | {
      type: 'ellipse';
      cx: number;
      cy: number;
      rx: number;
      ry: number;
      fill?: string;
      fillOpacity?: number;
      stroke?: string;
      strokeOpacity?: number;
      strokeWidth?: number;
      transform?: string;
      blendMode?: string;
    }
  | {
      type: 'path';
      d: string;
      fill?: string;
      fillOpacity?: number;
      stroke?: string;
      strokeOpacity?: number;
      strokeWidth?: number;
      transform?: string;
      blendMode?: string;
      strokeDasharray?: string;
      strokeLinecap?: 'round' | 'butt' | 'square';
    }
  | {
      type: 'line';
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      stroke: string;
      strokeOpacity?: number;
      strokeWidth?: number;
      blendMode?: string;
      strokeDasharray?: string;
    }
  | {
      type: 'polygon';
      points: string;
      fill?: string;
      fillOpacity?: number;
      stroke?: string;
      strokeOpacity?: number;
      strokeWidth?: number;
      transform?: string;
      blendMode?: string;
    }
  | {
      type: 'rect';
      x: number;
      y: number;
      width: number;
      height: number;
      rx?: number;
      ry?: number;
      fill?: string;
      fillOpacity?: number;
      stroke?: string;
      strokeOpacity?: number;
      strokeWidth?: number;
      transform?: string;
      blendMode?: string;
    };

export type StyleTransferArtworkRenderConfig = {
  bindings: StyleTransferArtworkResolvedBindings;
  fillOpacity: number;
  layerCount: number;
  maskBehavior: StyleTransferArtworkSpec['maskBehavior'];
  shapes: StyleTransferArtworkShape[];
  spec: StyleTransferArtworkSpec;
  strokeWidth: number;
  viewBox: {
    height: number;
    width: number;
  };
};

const themeColorRoleToCssVar: Record<StyleTransferThemeColorRole, string> = {
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
};

const opacityModeMap = {
  whisper: 0.16,
  soft: 0.24,
  balanced: 0.34,
  assertive: 0.5,
} as const;

const densityFactorMap = {
  sparse: 0.82,
  balanced: 1,
  dense: 1.18,
} as const;

const defaultThemePalette = {
  background: { light: '#f6f7fb', dark: '#0d1117' },
  backgroundAlt: { light: '#eceff6', dark: '#111723' },
  surface: { light: '#ffffff', dark: '#151c28' },
  surfaceStrong: { light: '#dfe5f0', dark: '#1d2635' },
  surfaceTint: { light: '#eef4ff', dark: '#182233' },
  surfacePaper: { light: '#fbfbfd', dark: '#111723' },
  text: { light: '#121826', dark: '#f3f6fb' },
  muted: { light: '#69758a', dark: '#98a8bf' },
  accent: { light: '#3b82f6', dark: '#60a5fa' },
  accentStrong: { light: '#1d4ed8', dark: '#93c5fd' },
  focus: { light: '#0f766e', dark: '#fde68a' },
} satisfies StyleTransferThemeRecord['palette'];

const slotKeyByUsage: Record<
  StyleTransferArtworkUsage,
  StyleTransferArtworkSlotKey
> = {
  'accent-graphic': 'accentGraphic',
  divider: 'divider',
  scrim: 'scrim',
  'section-background': 'sectionBackground',
  'surface-overlay': 'sectionBackground',
};

const defaultViewBoxByAspect = {
  banner: { width: 1280, height: 320 },
  hero: { width: 1280, height: 720 },
  square: { width: 720, height: 720 },
  tall: { width: 720, height: 960 },
  wide: { width: 1280, height: 540 },
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function hashString(input: string) {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash >>> 0);
}

function seededFloat(seed: number, offset: number) {
  const value = Math.sin(seed * 12.9898 + offset * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function seededBetween(seed: number, offset: number, min: number, max: number) {
  return min + seededFloat(seed, offset) * (max - min);
}

function getArtworkSpecSeed(spec: StyleTransferArtworkSpec) {
  return hashString(
    [
      spec.family,
      spec.usage,
      spec.complexity,
      spec.density,
      spec.layerCount,
      spec.fillStyle,
      spec.strokeStyle,
      spec.opacityMode,
      spec.blendStyle,
      spec.cornerStyle,
      spec.motionStyle,
      spec.placement,
      spec.maskBehavior,
      spec.aspectHint,
      spec.colorBinding.primary,
      spec.colorBinding.secondary ?? '',
      spec.colorBinding.stroke ?? '',
      spec.controls?.opacity ?? '',
      spec.controls?.strokeWidth ?? '',
      spec.controls?.inset ?? '',
      spec.controls?.jitter ?? '',
      spec.controls?.curvature ?? '',
      spec.controls?.rotation ?? '',
      spec.controls?.amplitude ?? '',
      spec.controls?.frequency ?? '',
      spec.controls?.scale ?? '',
      spec.controls?.noise ?? '',
    ].join('|'),
  );
}

function createBlobPath(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  jitter: number,
  seed: number,
) {
  const points = Array.from({ length: 8 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 8;
    const wave = 1 + (seededFloat(seed, index) - 0.5) * jitter * 0.55;
    const x = cx + Math.cos(angle) * rx * wave;
    const y = cy + Math.sin(angle) * ry * wave;

    return {
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
    };
  });

  const segments = points.map((point, index) => {
    const next = points[(index + 1) % points.length];
    const midX = Number(((point.x + next.x) / 2).toFixed(2));
    const midY = Number(((point.y + next.y) / 2).toFixed(2));

    return `Q ${point.x} ${point.y} ${midX} ${midY}`;
  });

  const start = points[0];
  return `M ${start.x} ${start.y} ${segments.join(' ')} Z`;
}

function createWavePath(
  width: number,
  height: number,
  index: number,
  layerCount: number,
  amplitude: number,
  frequency: number,
  inset: number,
) {
  const top = height * (0.28 + index * 0.12);
  const step = width / 4;
  const amp =
    height * (0.08 + amplitude * 0.16) * (1 - index / (layerCount + 1));
  const base = clamp(top + inset * 0.25, height * 0.12, height * 0.84);

  const controls = Array.from({ length: 4 }, (_, segmentIndex) => {
    const x1 = segmentIndex * step;
    const x2 = x1 + step / 2;
    const x3 = x1 + step;
    const direction = segmentIndex % 2 === 0 ? 1 : -1;
    const bend = amp * direction * frequency * 0.35;

    return `C ${x2.toFixed(2)} ${(base + bend).toFixed(2)} ${x2.toFixed(2)} ${(base - bend).toFixed(2)} ${x3.toFixed(2)} ${base.toFixed(2)}`;
  });

  return `M 0 ${base.toFixed(2)} ${controls.join(' ')} L ${width} ${height} L 0 ${height} Z`;
}

function resolveStrokeWidth(
  style: StyleTransferArtworkSpec['strokeStyle'],
  value?: number,
) {
  if (typeof value === 'number') {
    return value;
  }

  switch (style) {
    case 'hairline':
      return 1;
    case 'soft':
      return 2;
    case 'bold':
      return 4;
    default:
      return 0;
  }
}

function getDefaultViewBox(spec: StyleTransferArtworkSpec) {
  if (spec.viewBox) {
    return spec.viewBox;
  }

  return defaultViewBoxByAspect[spec.aspectHint];
}

function createBinding(
  role: StyleTransferThemeColorRole,
): StyleTransferArtworkResolvedBinding {
  const cssVar = themeColorRoleToCssVar[role];
  return {
    role,
    cssVar,
    cssValue: `var(${cssVar})`,
  };
}

export function resolveStyleTransferArtworkBindings(
  spec: StyleTransferArtworkSpec,
): StyleTransferArtworkResolvedBindings {
  return {
    background: spec.colorBinding.background
      ? createBinding(spec.colorBinding.background)
      : undefined,
    primary: createBinding(spec.colorBinding.primary),
    secondary: spec.colorBinding.secondary
      ? createBinding(spec.colorBinding.secondary)
      : undefined,
    stroke: spec.colorBinding.stroke
      ? createBinding(spec.colorBinding.stroke)
      : undefined,
  };
}

export function getStyleTransferArtworkDebugBindings(
  spec: StyleTransferArtworkSpec,
  root: HTMLElement = document.documentElement,
) {
  const bindings = resolveStyleTransferArtworkBindings(spec);
  const computed = window.getComputedStyle(root);

  const readValue = (binding?: StyleTransferArtworkResolvedBinding) =>
    binding
      ? {
          computed: computed.getPropertyValue(binding.cssVar).trim(),
          cssVar: binding.cssVar,
          role: binding.role,
        }
      : undefined;

  return {
    background: readValue(bindings.background),
    primary: readValue(bindings.primary),
    secondary: readValue(bindings.secondary),
    stroke: readValue(bindings.stroke),
  };
}

export function resolveStyleTransferArtworkColorValues(
  spec: StyleTransferArtworkSpec,
  root: HTMLElement = document.documentElement,
): StyleTransferArtworkResolvedColorValues {
  const bindings = resolveStyleTransferArtworkBindings(spec);

  const resolveColor = (cssVar: string) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${cssVar})`;
    probe.style.position = 'absolute';
    probe.style.inlineSize = '0';
    probe.style.blockSize = '0';
    probe.style.overflow = 'hidden';
    probe.style.pointerEvents = 'none';
    probe.style.opacity = '0';
    root.appendChild(probe);

    const value = window.getComputedStyle(probe).color.trim() || undefined;
    probe.remove();

    return value;
  };

  const readValue = (binding?: StyleTransferArtworkResolvedBinding) => {
    if (!binding) {
      return undefined;
    }

    return resolveColor(binding.cssVar);
  };

  return {
    background: readValue(bindings.background),
    primary: readValue(bindings.primary) ?? defaultThemePalette.accent.light,
    secondary: readValue(bindings.secondary),
    stroke: readValue(bindings.stroke),
  };
}

function escapeSvgAttribute(value: string | number) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function createSvgAttributes(
  attributes: Record<string, string | number | undefined>,
) {
  const svgAttributeNameMap: Record<string, string | null> = {
    blendMode: null,
    fillOpacity: 'fill-opacity',
    preserveAspectRatio: 'preserveAspectRatio',
    strokeDasharray: 'stroke-dasharray',
    strokeLinecap: 'stroke-linecap',
    strokeOpacity: 'stroke-opacity',
    strokeWidth: 'stroke-width',
    type: null,
    viewBox: 'viewBox',
  };

  return Object.entries(attributes)
    .filter(
      (entry): entry is [string, string | number] =>
        typeof entry[1] !== 'undefined',
    )
    .map(([key, value]) => {
      const attributeName =
        key in svgAttributeNameMap ? svgAttributeNameMap[key] : key;

      if (!attributeName) {
        return null;
      }

      return `${attributeName}="${escapeSvgAttribute(value)}"`;
    })
    .filter((attribute): attribute is string => Boolean(attribute))
    .join(' ');
}

function serializeStyleTransferArtworkShape(shape: StyleTransferArtworkShape) {
  const common =
    shape.blendMode !== undefined
      ? {
          style: `mix-blend-mode:${shape.blendMode}`,
        }
      : {};

  switch (shape.type) {
    case 'ellipse':
      return `<ellipse ${createSvgAttributes({ ...common, ...shape })} />`;
    case 'path':
      return `<path ${createSvgAttributes({ ...common, ...shape })} />`;
    case 'line':
      return `<line ${createSvgAttributes({ ...common, ...shape })} />`;
    case 'polygon':
      return `<polygon ${createSvgAttributes({ ...common, ...shape })} />`;
    case 'rect':
      return `<rect ${createSvgAttributes({ ...common, ...shape })} />`;
  }
}

function serializeStyleTransferArtworkMask(
  maskId: string,
  config: StyleTransferArtworkRenderConfig,
) {
  const { height, width } = config.viewBox;

  switch (config.maskBehavior) {
    case 'fade-edges':
      return `<mask id="${maskId}"><linearGradient id="${maskId}-gradient" x1="0%" x2="100%"><stop offset="0%" stop-color="black" /><stop offset="12%" stop-color="white" /><stop offset="88%" stop-color="white" /><stop offset="100%" stop-color="black" /></linearGradient><rect x="0" y="0" width="${width}" height="${height}" fill="url(#${maskId}-gradient)" /></mask>`;
    case 'fade-top':
      return `<mask id="${maskId}"><linearGradient id="${maskId}-gradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="black" /><stop offset="28%" stop-color="white" /><stop offset="100%" stop-color="white" /></linearGradient><rect x="0" y="0" width="${width}" height="${height}" fill="url(#${maskId}-gradient)" /></mask>`;
    case 'fade-bottom':
      return `<mask id="${maskId}"><linearGradient id="${maskId}-gradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="white" /><stop offset="72%" stop-color="white" /><stop offset="100%" stop-color="black" /></linearGradient><rect x="0" y="0" width="${width}" height="${height}" fill="url(#${maskId}-gradient)" /></mask>`;
    default:
      return '';
  }
}

function buildSoftBlobShapes(
  spec: StyleTransferArtworkSpec,
  config: Pick<
    StyleTransferArtworkRenderConfig,
    'bindings' | 'fillOpacity' | 'strokeWidth' | 'viewBox'
  >,
) {
  const { height, width } = config.viewBox;
  const seed = getArtworkSpecSeed(spec);
  const jitter = spec.controls?.jitter ?? 0.38;
  const rotation = spec.controls?.rotation ?? 0;
  const inset = spec.controls?.inset ?? 20;

  return Array.from({ length: spec.layerCount }, (_, index) => {
    const drift = seededFloat(seed, index + 1) - 0.5;
    const cx = width * (0.22 + index * 0.16 + drift * 0.08);
    const cy =
      height *
      (0.24 + index * 0.12 + (seededFloat(seed, 20 + index) - 0.5) * 0.08);
    const rx =
      width * (0.16 + index * 0.045 + seededFloat(seed, 40 + index) * 0.04);
    const ry =
      height * (0.14 + index * 0.038 + seededFloat(seed, 60 + index) * 0.05);
    const fill =
      index % 2 === 0
        ? config.bindings.primary.cssValue
        : (config.bindings.secondary?.cssValue ??
          config.bindings.primary.cssValue);
    const rotationAmount =
      rotation + seededBetween(seed, 80 + index, -10, 10) - index * 5;

    return {
      type: 'path',
      d: createBlobPath(
        cx,
        cy,
        rx - inset * 0.1,
        ry - inset * 0.06,
        jitter,
        seed + index + 1,
      ),
      fill,
      fillOpacity: clamp(config.fillOpacity - index * 0.05, 0.08, 0.52),
      stroke:
        spec.strokeStyle === 'none'
          ? undefined
          : (config.bindings.stroke?.cssValue ??
            config.bindings.primary.cssValue),
      strokeOpacity: 0.2,
      strokeWidth: config.strokeWidth || undefined,
      transform: rotationAmount
        ? `rotate(${rotationAmount.toFixed(2)} ${cx.toFixed(2)} ${cy.toFixed(2)})`
        : undefined,
      blendMode: spec.blendStyle,
    } satisfies StyleTransferArtworkShape;
  });
}

function buildLayeredWaveShapes(
  spec: StyleTransferArtworkSpec,
  config: Pick<
    StyleTransferArtworkRenderConfig,
    'bindings' | 'fillOpacity' | 'strokeWidth' | 'viewBox'
  >,
) {
  const { height, width } = config.viewBox;
  const seed = getArtworkSpecSeed(spec);
  const amplitude = spec.controls?.amplitude ?? 0.38;
  const frequency = spec.controls?.frequency ?? 1.8;
  const inset = spec.controls?.inset ?? 0;

  return Array.from({ length: spec.layerCount }, (_, index) => {
    const localAmplitude = clamp(
      amplitude + seededBetween(seed, index + 1, -0.08, 0.12),
      0.12,
      0.82,
    );
    const localFrequency = clamp(
      frequency + seededBetween(seed, 30 + index, -0.45, 0.6),
      0.7,
      4.8,
    );
    return {
      type: 'path',
      d: createWavePath(
        width,
        height,
        index,
        spec.layerCount,
        localAmplitude,
        localFrequency,
        inset + seededBetween(seed, 60 + index, 0, 18),
      ),
      fill:
        index % 2 === 0
          ? config.bindings.primary.cssValue
          : (config.bindings.secondary?.cssValue ??
            config.bindings.primary.cssValue),
      fillOpacity: clamp(config.fillOpacity - index * 0.04, 0.12, 0.58),
      stroke:
        spec.strokeStyle === 'none'
          ? undefined
          : (config.bindings.stroke?.cssValue ??
            config.bindings.primary.cssValue),
      strokeOpacity: 0.18,
      strokeWidth: config.strokeWidth || undefined,
      blendMode: spec.blendStyle,
    } satisfies StyleTransferArtworkShape;
  });
}

function buildAngledPanelShapes(
  spec: StyleTransferArtworkSpec,
  config: Pick<
    StyleTransferArtworkRenderConfig,
    'bindings' | 'fillOpacity' | 'strokeWidth' | 'viewBox'
  >,
) {
  const { height, width } = config.viewBox;
  const seed = getArtworkSpecSeed(spec);
  const rotation = spec.controls?.rotation ?? 12;
  const inset = spec.controls?.inset ?? 28;

  return Array.from({ length: spec.layerCount }, (_, index) => {
    const x =
      inset +
      index * width * 0.075 +
      seededBetween(seed, index + 1, -width * 0.03, width * 0.03);
    const y =
      height * (0.06 + index * 0.075) +
      seededBetween(seed, 20 + index, -height * 0.02, height * 0.03);
    const panelWidth =
      width * (0.5 - index * 0.042 + seededBetween(seed, 40 + index, 0, 0.08));
    const panelHeight =
      height * (0.28 + index * 0.05 + seededBetween(seed, 60 + index, 0, 0.04));
    const slant = width * seededBetween(seed, 80 + index, 0.05, 0.12);
    const points = [
      `${x.toFixed(2)},${(y + panelHeight * 0.08).toFixed(2)}`,
      `${(x + panelWidth).toFixed(2)},${y.toFixed(2)}`,
      `${(x + panelWidth - slant).toFixed(2)},${(y + panelHeight).toFixed(2)}`,
      `${(x - slant).toFixed(2)},${(y + panelHeight * 0.92).toFixed(2)}`,
    ].join(' ');

    return {
      type: 'polygon',
      points,
      fill:
        index % 2 === 0
          ? config.bindings.primary.cssValue
          : (config.bindings.secondary?.cssValue ??
            config.bindings.primary.cssValue),
      fillOpacity: clamp(config.fillOpacity - index * 0.05, 0.14, 0.5),
      stroke:
        spec.strokeStyle === 'none'
          ? undefined
          : (config.bindings.stroke?.cssValue ??
            config.bindings.primary.cssValue),
      strokeOpacity: 0.24,
      strokeWidth: config.strokeWidth || undefined,
      transform: `rotate(${(
        rotation +
        seededBetween(seed, 100 + index, -8, 8) -
        index * 5
      ).toFixed(
        2,
      )} ${(x + panelWidth / 2).toFixed(2)} ${(y + panelHeight / 2).toFixed(2)})`,
      blendMode: spec.blendStyle,
    } satisfies StyleTransferArtworkShape;
  });
}

function buildContourLineShapes(
  spec: StyleTransferArtworkSpec,
  config: Pick<
    StyleTransferArtworkRenderConfig,
    'bindings' | 'strokeWidth' | 'viewBox'
  >,
) {
  const { height, width } = config.viewBox;
  const seed = getArtworkSpecSeed(spec);
  const amplitude = height * (0.04 + (spec.controls?.amplitude ?? 0.3) * 0.14);
  const frequency = spec.controls?.frequency ?? 2.2;
  const stroke =
    config.bindings.stroke?.cssValue ?? config.bindings.primary.cssValue;
  const lineCount = Math.max(
    spec.layerCount + 1 + Math.round(seededBetween(seed, 4, 0, 2)),
    spec.density === 'dense' ? 7 : 4,
  );

  return Array.from({ length: lineCount }, (_, index) => {
    const y =
      height * (0.14 + (index / (lineCount + 1)) * 0.74) +
      seededBetween(seed, 20 + index, -height * 0.02, height * 0.02);
    const segments = Array.from({ length: 6 }, (_value, segmentIndex) => {
      const x1 = (segmentIndex / 6) * width;
      const x2 = ((segmentIndex + 1) / 6) * width;
      const cx = x1 + (x2 - x1) / 2;
      const bend =
        Math.sin(
          (segmentIndex + index + 1) * frequency +
            seededBetween(seed, 40 + index, -1, 1),
        ) *
        amplitude *
        (0.75 - index / (lineCount * 1.8));

      return `Q ${cx.toFixed(2)} ${(y + bend).toFixed(2)} ${x2.toFixed(2)} ${y.toFixed(2)}`;
    }).join(' ');

    return {
      type: 'path',
      d: `M 0 ${y.toFixed(2)} ${segments}`,
      stroke,
      strokeOpacity: clamp(0.12 + index * 0.04, 0.12, 0.36),
      strokeWidth: config.strokeWidth || 1.25,
      strokeDasharray:
        spec.motionStyle === 'still'
          ? undefined
          : `${Math.round(seededBetween(seed, 100 + index, 2, 4))} ${Math.round(
              seededBetween(seed, 120 + index, 8, 16),
            )}`,
      strokeLinecap: 'round',
      blendMode: spec.blendStyle,
    } satisfies StyleTransferArtworkShape;
  });
}

function buildOffsetRingShapes(
  spec: StyleTransferArtworkSpec,
  config: Pick<
    StyleTransferArtworkRenderConfig,
    'bindings' | 'fillOpacity' | 'strokeWidth' | 'viewBox'
  >,
) {
  const { height, width } = config.viewBox;
  const seed = getArtworkSpecSeed(spec);
  const centerX = width * seededBetween(seed, 1, 0.48, 0.68);
  const centerY = height * seededBetween(seed, 2, 0.3, 0.54);
  const scale = spec.controls?.scale ?? 1;
  const stroke =
    config.bindings.stroke?.cssValue ?? config.bindings.primary.cssValue;

  return Array.from({ length: spec.layerCount }, (_, index) => {
    const rx =
      width *
      (0.1 + index * 0.075 + seededBetween(seed, 20 + index, 0, 0.04)) *
      scale;
    const ry =
      height *
      (0.12 + index * 0.058 + seededBetween(seed, 40 + index, 0, 0.05)) *
      scale;
    return {
      type: 'ellipse',
      cx:
        centerX - index * width * seededBetween(seed, 60 + index, 0.02, 0.045),
      cy:
        centerY + index * height * seededBetween(seed, 80 + index, 0.035, 0.07),
      rx,
      ry,
      fill:
        spec.fillStyle === 'transparent'
          ? undefined
          : config.bindings.secondary?.cssValue,
      fillOpacity:
        spec.fillStyle === 'transparent'
          ? undefined
          : clamp(config.fillOpacity - index * 0.06, 0.08, 0.24),
      stroke,
      strokeOpacity: clamp(0.16 + index * 0.04, 0.16, 0.46),
      strokeWidth: config.strokeWidth || 2,
      transform:
        spec.motionStyle === 'still'
          ? undefined
          : `rotate(${seededBetween(seed, 100 + index, -18, 18).toFixed(2)} ${centerX.toFixed(
              2,
            )} ${centerY.toFixed(2)})`,
      blendMode: spec.blendStyle,
    } satisfies StyleTransferArtworkShape;
  });
}

function buildGridMeshShapes(
  spec: StyleTransferArtworkSpec,
  config: Pick<
    StyleTransferArtworkRenderConfig,
    'bindings' | 'strokeWidth' | 'viewBox'
  >,
) {
  const { height, width } = config.viewBox;
  const seed = getArtworkSpecSeed(spec);
  const stroke =
    config.bindings.stroke?.cssValue ?? config.bindings.primary.cssValue;
  const columns =
    spec.density === 'dense' ? 10 : spec.density === 'sparse' ? 5 : 7;
  const rows = spec.complexity === 'high' ? 7 : 5;
  const verticalLines = Array.from({ length: columns }, (_, index) => {
    const x =
      (index / (columns - 1 || 1)) * width +
      seededBetween(seed, index + 1, -width * 0.018, width * 0.018);
    return {
      type: 'line',
      x1: x,
      y1: 0,
      x2: x + seededBetween(seed, 20 + index, -width * 0.025, width * 0.025),
      y2: height,
      stroke,
      strokeOpacity: 0.16,
      strokeWidth: config.strokeWidth || 1,
      blendMode: spec.blendStyle,
    } satisfies StyleTransferArtworkShape;
  });
  const horizontalLines = Array.from({ length: rows }, (_, index) => {
    const y =
      (index / (rows - 1 || 1)) * height +
      seededBetween(seed, 40 + index, -height * 0.015, height * 0.015);
    return {
      type: 'line',
      x1: 0,
      y1: y,
      x2: width,
      y2:
        y +
        (index % 2 === 0 ? height * 0.02 : -height * 0.02) +
        seededBetween(seed, 60 + index, -height * 0.01, height * 0.01),
      stroke,
      strokeOpacity: 0.14,
      strokeWidth: config.strokeWidth || 1,
      blendMode: spec.blendStyle,
    } satisfies StyleTransferArtworkShape;
  });
  const diagonalLines =
    spec.complexity === 'high'
      ? Array.from({ length: 3 }, (_, index) => {
          const startX = seededBetween(seed, 80 + index, 0, width * 0.2);
          const endX = width - seededBetween(seed, 100 + index, 0, width * 0.2);
          const startY = seededBetween(seed, 120 + index, 0, height * 0.3);
          const endY =
            height - seededBetween(seed, 140 + index, 0, height * 0.3);

          return {
            type: 'line',
            x1: startX,
            y1: startY,
            x2: endX,
            y2: endY,
            stroke,
            strokeOpacity: 0.1,
            strokeWidth: config.strokeWidth || 1,
            strokeDasharray: '4 8',
            blendMode: spec.blendStyle,
          } satisfies StyleTransferArtworkShape;
        })
      : [];

  return [...verticalLines, ...horizontalLines, ...diagonalLines];
}

function buildScanlineBandShapes(
  spec: StyleTransferArtworkSpec,
  config: Pick<
    StyleTransferArtworkRenderConfig,
    'bindings' | 'fillOpacity' | 'viewBox'
  >,
) {
  const { height, width } = config.viewBox;
  const seed = getArtworkSpecSeed(spec);
  const bandCount =
    spec.density === 'dense' ? 18 : spec.density === 'sparse' ? 8 : 12;
  const bandHeight = height / bandCount;

  return Array.from({ length: bandCount }, (_, index) => {
    const insetX =
      spec.complexity === 'high'
        ? seededBetween(seed, index + 1, 0, width * 0.18)
        : seededBetween(seed, index + 1, 0, width * 0.08);
    const barWidth = width - insetX * seededBetween(seed, 30 + index, 1.2, 1.9);

    return {
      type: 'rect',
      x: insetX,
      y: index * bandHeight,
      width: Math.max(barWidth, width * 0.28),
      height:
        bandHeight *
        seededBetween(
          seed,
          60 + index,
          index % 3 === 0 ? 0.45 : 0.2,
          index % 3 === 0 ? 0.88 : 0.5,
        ),
      fill:
        index % 2 === 0
          ? config.bindings.primary.cssValue
          : (config.bindings.secondary?.cssValue ??
            config.bindings.primary.cssValue),
      fillOpacity: clamp(config.fillOpacity * 0.42, 0.06, 0.22),
      blendMode: spec.blendStyle,
    } satisfies StyleTransferArtworkShape;
  });
}

function buildPaperCutShapes(
  spec: StyleTransferArtworkSpec,
  config: Pick<
    StyleTransferArtworkRenderConfig,
    'bindings' | 'fillOpacity' | 'strokeWidth' | 'viewBox'
  >,
) {
  const { height, width } = config.viewBox;
  const seed = getArtworkSpecSeed(spec);
  const inset = spec.controls?.inset ?? 18;
  const cornerRadius =
    spec.cornerStyle === 'sharp' ? 0 : spec.cornerStyle === 'rounded' ? 26 : 40;

  return Array.from({ length: spec.layerCount }, (_, index) => {
    const layerInset = inset + index * seededBetween(seed, index + 1, 12, 22);
    return {
      type: 'rect',
      x: layerInset + seededBetween(seed, 20 + index, -8, 8),
      y: layerInset * seededBetween(seed, 40 + index, 0.58, 0.84),
      width: width - layerInset * 2,
      height: height - layerInset * seededBetween(seed, 60 + index, 1.18, 1.62),
      rx: cornerRadius,
      ry: cornerRadius,
      fill:
        index % 2 === 0
          ? config.bindings.primary.cssValue
          : (config.bindings.secondary?.cssValue ??
            config.bindings.primary.cssValue),
      fillOpacity: clamp(config.fillOpacity - index * 0.05, 0.1, 0.42),
      stroke:
        spec.strokeStyle === 'none'
          ? undefined
          : (config.bindings.stroke?.cssValue ??
            config.bindings.primary.cssValue),
      strokeOpacity: 0.12,
      strokeWidth: config.strokeWidth || undefined,
      blendMode: spec.blendStyle,
    } satisfies StyleTransferArtworkShape;
  });
}

function buildRadialBurstShapes(
  spec: StyleTransferArtworkSpec,
  config: Pick<
    StyleTransferArtworkRenderConfig,
    'bindings' | 'fillOpacity' | 'strokeWidth' | 'viewBox'
  >,
) {
  const { height, width } = config.viewBox;
  const seed = getArtworkSpecSeed(spec);
  const centerX = width * seededBetween(seed, 1, 0.38, 0.62);
  const centerY = height * seededBetween(seed, 2, 0.24, 0.46);
  const rayCount =
    spec.density === 'dense' ? 18 : spec.density === 'sparse' ? 10 : 14;
  const stroke =
    config.bindings.stroke?.cssValue ?? config.bindings.primary.cssValue;
  const rays = Array.from({ length: rayCount }, (_, index) => {
    const angle = (-75 + (150 / Math.max(rayCount - 1, 1)) * index).toFixed(2);
    const length = seededBetween(seed, 20 + index, width * 0.18, width * 0.42);
    const spread = seededBetween(seed, 60 + index, 0.82, 1.18);
    const x2 = centerX + Math.cos((Number(angle) * Math.PI) / 180) * length;
    const y2 =
      centerY + Math.sin((Number(angle) * Math.PI) / 180) * length * spread;

    return {
      type: 'line',
      x1: centerX,
      y1: centerY,
      x2,
      y2,
      stroke,
      strokeOpacity: clamp(0.16 + index * 0.01, 0.14, 0.34),
      strokeWidth:
        config.strokeWidth || seededBetween(seed, 100 + index, 1.2, 3.2),
      blendMode: spec.blendStyle,
      strokeDasharray:
        spec.motionStyle === 'still'
          ? undefined
          : `${Math.round(seededBetween(seed, 140 + index, 2, 5))} ${Math.round(
              seededBetween(seed, 180 + index, 8, 16),
            )}`,
    } satisfies StyleTransferArtworkShape;
  });
  const coreCount = Math.min(spec.layerCount, 3);
  const cores = Array.from({ length: coreCount }, (_, index) => ({
    type: 'ellipse',
    cx: centerX + seededBetween(seed, 220 + index, -24, 24),
    cy: centerY + seededBetween(seed, 260 + index, -18, 18),
    rx: width * seededBetween(seed, 300 + index, 0.05, 0.14),
    ry: height * seededBetween(seed, 340 + index, 0.06, 0.16),
    fill:
      index === 0
        ? config.bindings.primary.cssValue
        : (config.bindings.secondary?.cssValue ??
          config.bindings.primary.cssValue),
    fillOpacity: clamp(config.fillOpacity - index * 0.08, 0.12, 0.42),
    stroke,
    strokeOpacity: 0.14,
    strokeWidth: config.strokeWidth || undefined,
    blendMode: spec.blendStyle,
  })) satisfies StyleTransferArtworkShape[];

  return [...rays, ...cores];
}

function buildFoldedRibbonShapes(
  spec: StyleTransferArtworkSpec,
  config: Pick<
    StyleTransferArtworkRenderConfig,
    'bindings' | 'fillOpacity' | 'strokeWidth' | 'viewBox'
  >,
) {
  const { height, width } = config.viewBox;
  const seed = getArtworkSpecSeed(spec);
  const ribbonCount = Math.max(spec.layerCount, 3);

  return Array.from({ length: ribbonCount }, (_, index) => {
    const startX = seededBetween(seed, 20 + index, -width * 0.08, width * 0.18);
    const startY = height * seededBetween(seed, 40 + index, 0.1, 0.74);
    const span = width * seededBetween(seed, 60 + index, 0.46, 0.78);
    const thickness = height * seededBetween(seed, 80 + index, 0.08, 0.16);
    const fold = width * seededBetween(seed, 100 + index, 0.06, 0.18);
    const wave = height * seededBetween(seed, 120 + index, -0.08, 0.08);
    const points = [
      `${startX.toFixed(2)},${(startY + wave).toFixed(2)}`,
      `${(startX + span * 0.55).toFixed(2)},${(startY - thickness * 0.42).toFixed(2)}`,
      `${(startX + span + fold).toFixed(2)},${(startY + thickness * 0.25).toFixed(2)}`,
      `${(startX + span * 0.58).toFixed(2)},${(startY + thickness).toFixed(2)}`,
      `${(startX - fold).toFixed(2)},${(startY + thickness * 0.65).toFixed(2)}`,
    ].join(' ');

    return {
      type: 'polygon',
      points,
      fill:
        index % 2 === 0
          ? config.bindings.primary.cssValue
          : (config.bindings.secondary?.cssValue ??
            config.bindings.primary.cssValue),
      fillOpacity: clamp(config.fillOpacity - index * 0.05, 0.12, 0.46),
      stroke:
        spec.strokeStyle === 'none'
          ? undefined
          : (config.bindings.stroke?.cssValue ??
            config.bindings.primary.cssValue),
      strokeOpacity: 0.16,
      strokeWidth: config.strokeWidth || undefined,
      transform: `rotate(${seededBetween(seed, 160 + index, -14, 14).toFixed(2)} ${(startX + span / 2).toFixed(2)} ${(startY + thickness / 2).toFixed(2)})`,
      blendMode: spec.blendStyle,
    } satisfies StyleTransferArtworkShape;
  });
}

function buildModularTileShapes(
  spec: StyleTransferArtworkSpec,
  config: Pick<
    StyleTransferArtworkRenderConfig,
    'bindings' | 'fillOpacity' | 'strokeWidth' | 'viewBox'
  >,
) {
  const { height, width } = config.viewBox;
  const seed = getArtworkSpecSeed(spec);
  const columns = spec.density === 'dense' ? 5 : 4;
  const rows = spec.density === 'sparse' ? 3 : 4;
  const gutter = width * 0.018;
  const tileWidth = (width - gutter * (columns + 1)) / columns;
  const tileHeight = (height - gutter * (rows + 1)) / rows;
  const cornerRadius = spec.cornerStyle === 'sharp' ? 0 : 18;

  return Array.from({ length: columns * rows }, (_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = gutter + column * (tileWidth + gutter);
    const y = gutter + row * (tileHeight + gutter);
    const spanX =
      seededFloat(seed, 20 + index) > 0.76 && column < columns - 1 ? 2 : 1;
    const spanY = seededFloat(seed, 40 + index) > 0.8 && row < rows - 1 ? 2 : 1;
    const rectWidth = tileWidth * spanX + gutter * (spanX - 1);
    const rectHeight = tileHeight * spanY + gutter * (spanY - 1);

    return {
      type: 'rect',
      x,
      y,
      width: rectWidth,
      height: rectHeight,
      rx: cornerRadius,
      ry: cornerRadius,
      fill:
        index % 3 === 0
          ? config.bindings.primary.cssValue
          : (config.bindings.secondary?.cssValue ??
            config.bindings.primary.cssValue),
      fillOpacity: clamp(config.fillOpacity - (index % 4) * 0.03, 0.12, 0.4),
      stroke:
        spec.strokeStyle === 'none'
          ? undefined
          : (config.bindings.stroke?.cssValue ??
            config.bindings.primary.cssValue),
      strokeOpacity: 0.16,
      strokeWidth: config.strokeWidth || undefined,
      blendMode: spec.blendStyle,
    } satisfies StyleTransferArtworkShape;
  }).slice(0, Math.max(spec.layerCount * 2, 8));
}

function buildConstellationShapes(
  spec: StyleTransferArtworkSpec,
  config: Pick<
    StyleTransferArtworkRenderConfig,
    'bindings' | 'fillOpacity' | 'strokeWidth' | 'viewBox'
  >,
) {
  const { height, width } = config.viewBox;
  const seed = getArtworkSpecSeed(spec);
  const nodeCount = Math.max(spec.layerCount + 3, 6);
  const stroke =
    config.bindings.stroke?.cssValue ?? config.bindings.primary.cssValue;
  const nodes = Array.from({ length: nodeCount }, (_, index) => ({
    x: width * seededBetween(seed, 20 + index, 0.14, 0.86),
    y: height * seededBetween(seed, 60 + index, 0.18, 0.82),
    r: seededBetween(seed, 100 + index, 4, 16),
  }));
  const lines = nodes.slice(0, -1).map((node, index) => {
    const next = nodes[index + 1];
    return {
      type: 'line',
      x1: node.x,
      y1: node.y,
      x2: next.x,
      y2: next.y,
      stroke,
      strokeOpacity: 0.18,
      strokeWidth: config.strokeWidth || 1.2,
      strokeDasharray:
        spec.motionStyle === 'still'
          ? undefined
          : `${Math.round(seededBetween(seed, 140 + index, 3, 5))} ${Math.round(
              seededBetween(seed, 180 + index, 7, 14),
            )}`,
      blendMode: spec.blendStyle,
    } satisfies StyleTransferArtworkShape;
  });
  const nodeShapes = nodes.map((node, index) => ({
    type: 'ellipse',
    cx: node.x,
    cy: node.y,
    rx: node.r,
    ry: node.r,
    fill:
      index % 2 === 0
        ? config.bindings.primary.cssValue
        : (config.bindings.secondary?.cssValue ??
          config.bindings.primary.cssValue),
    fillOpacity: clamp(config.fillOpacity - (index % 3) * 0.04, 0.14, 0.4),
    stroke,
    strokeOpacity: 0.14,
    strokeWidth: config.strokeWidth || undefined,
    blendMode: spec.blendStyle,
  })) satisfies StyleTransferArtworkShape[];

  return [...lines, ...nodeShapes];
}

function buildInsetFrameShapes(
  spec: StyleTransferArtworkSpec,
  config: Pick<
    StyleTransferArtworkRenderConfig,
    'bindings' | 'fillOpacity' | 'strokeWidth' | 'viewBox'
  >,
) {
  const { height, width } = config.viewBox;
  const seed = getArtworkSpecSeed(spec);
  const panelCount = Math.max(spec.layerCount + 1, 4);
  const cornerRadius =
    spec.cornerStyle === 'sharp'
      ? 12
      : spec.cornerStyle === 'rounded'
        ? 28
        : 44;
  const stroke =
    spec.strokeStyle === 'none'
      ? undefined
      : (config.bindings.stroke?.cssValue ?? config.bindings.primary.cssValue);

  return Array.from({ length: panelCount }, (_, index) => {
    const panelWidth = width * seededBetween(seed, 20 + index, 0.64, 0.92);
    const panelHeight =
      height *
      seededBetween(
        seed,
        40 + index,
        spec.density === 'sparse' ? 0.14 : 0.16,
        spec.density === 'dense' ? 0.24 : 0.21,
      );
    const centerX =
      width * seededBetween(seed, 60 + index, 0.34, 0.66) +
      (index % 2 === 0 ? -1 : 1) * width * 0.06;
    const x = clamp(
      centerX - panelWidth / 2,
      -width * 0.08,
      width - panelWidth + width * 0.08,
    );
    const y = clamp(
      height * (0.12 + index * 0.13) +
        seededBetween(seed, 80 + index, -height * 0.03, height * 0.03),
      height * 0.04,
      height - panelHeight - height * 0.08,
    );
    const rotation =
      seededBetween(seed, 100 + index, -7.5, 7.5) +
      (index % 2 === 0 ? -1.4 : 1.4);
    const panelCenterX = x + panelWidth / 2;
    const panelCenterY = y + panelHeight / 2;
    const transform = `rotate(${rotation.toFixed(2)} ${panelCenterX.toFixed(2)} ${panelCenterY.toFixed(2)})`;
    const panelFill =
      index % 2 === 0
        ? config.bindings.primary.cssValue
        : (config.bindings.secondary?.cssValue ??
          config.bindings.primary.cssValue);
    const panelOpacity = clamp(config.fillOpacity - index * 0.03, 0.12, 0.34);
    const seamInsetX =
      panelWidth * seededBetween(seed, 120 + index, 0.08, 0.14);
    const seamInsetY =
      panelHeight * seededBetween(seed, 140 + index, 0.1, 0.18);
    const seamHeight =
      panelHeight * seededBetween(seed, 160 + index, 0.12, 0.2);

    return [
      {
        type: 'rect',
        x,
        y,
        width: panelWidth,
        height: panelHeight,
        rx: cornerRadius,
        ry: cornerRadius,
        fill: panelFill,
        fillOpacity: panelOpacity,
        stroke,
        strokeOpacity: clamp(0.08 + index * 0.03, 0.08, 0.18),
        strokeWidth:
          config.strokeWidth || seededBetween(seed, 180 + index, 1, 2.2),
        transform,
        blendMode: spec.blendStyle,
      } satisfies StyleTransferArtworkShape,
      {
        type: 'rect',
        x: x + seamInsetX,
        y: y + seamInsetY,
        width: panelWidth - seamInsetX * 2,
        height: seamHeight,
        rx: cornerRadius * 0.65,
        ry: cornerRadius * 0.65,
        fill:
          index % 2 === 0
            ? (config.bindings.secondary?.cssValue ??
              config.bindings.primary.cssValue)
            : config.bindings.primary.cssValue,
        fillOpacity: clamp(panelOpacity * 0.34, 0.05, 0.14),
        transform,
        blendMode: spec.blendStyle,
      } satisfies StyleTransferArtworkShape,
    ];
  }).flat();
}

function buildArtworkShapes(
  spec: StyleTransferArtworkSpec,
  config: Pick<
    StyleTransferArtworkRenderConfig,
    'bindings' | 'fillOpacity' | 'strokeWidth' | 'viewBox'
  >,
) {
  switch (spec.family) {
    case 'soft-blob':
      return buildSoftBlobShapes(spec, config);
    case 'layered-wave':
      return buildLayeredWaveShapes(spec, config);
    case 'angled-panel':
      return buildAngledPanelShapes(spec, config);
    case 'contour-lines':
      return buildContourLineShapes(spec, config);
    case 'offset-rings':
      return buildOffsetRingShapes(spec, config);
    case 'grid-mesh':
      return buildGridMeshShapes(spec, config);
    case 'scanline-band':
      return buildScanlineBandShapes(spec, config);
    case 'paper-cut':
      return buildPaperCutShapes(spec, config);
    case 'radial-burst':
      return buildRadialBurstShapes(spec, config);
    case 'folded-ribbon':
      return buildFoldedRibbonShapes(spec, config);
    case 'modular-tiles':
      return buildModularTileShapes(spec, config);
    case 'constellation':
      return buildConstellationShapes(spec, config);
    case 'inset-frames':
      return buildInsetFrameShapes(spec, config);
  }
}

export function deriveStyleTransferArtworkRenderConfig(
  spec: StyleTransferArtworkSpec,
): StyleTransferArtworkRenderConfig {
  const bindings = resolveStyleTransferArtworkBindings(spec);
  const viewBox = getDefaultViewBox(spec);
  const layerCount = clamp(spec.layerCount, 1, 6);
  const fillOpacity = clamp(
    (spec.controls?.opacity ?? opacityModeMap[spec.opacityMode]) *
      densityFactorMap[spec.density],
    0.08,
    0.72,
  );
  const strokeWidth = resolveStrokeWidth(
    spec.strokeStyle,
    spec.controls?.strokeWidth,
  );

  const config = {
    bindings,
    fillOpacity,
    layerCount,
    maskBehavior: spec.maskBehavior,
    spec: {
      ...spec,
      layerCount,
    },
    strokeWidth,
    viewBox,
  } satisfies Omit<StyleTransferArtworkRenderConfig, 'shapes'>;

  return {
    ...config,
    shapes: buildArtworkShapes(config.spec, config),
  };
}

export function getStyleTransferArtworkShapeCounts(
  spec: StyleTransferArtworkSpec,
) {
  const config = deriveStyleTransferArtworkRenderConfig(spec);

  return config.shapes.reduce(
    (counts, shape) => {
      counts[shape.type] += 1;
      return counts;
    },
    {
      ellipse: 0,
      line: 0,
      path: 0,
      polygon: 0,
      rect: 0,
    },
  );
}

export function createStyleTransferArtworkSvgMarkup(
  spec: StyleTransferArtworkSpec,
  options?: {
    root?: HTMLElement;
  },
) {
  const config = deriveStyleTransferArtworkRenderConfig(spec);
  const colorValues = resolveStyleTransferArtworkColorValues(
    spec,
    options?.root ?? document.documentElement,
  );
  const maskId = `theme-artwork-mask-${getArtworkSpecSeed(spec).toString(36)}`;
  const backgroundFill =
    colorValues.background ??
    'color-mix(in srgb, var(--color-surface) 92%, transparent)';
  const maskMarkup = serializeStyleTransferArtworkMask(maskId, config);
  const shapeMarkup = config.shapes
    .map((shape) => {
      const normalizedShape: StyleTransferArtworkShape =
        shape.type === 'ellipse'
          ? {
              ...shape,
              fill:
                shape.fill === config.bindings.primary.cssValue
                  ? colorValues.primary
                  : shape.fill === config.bindings.secondary?.cssValue
                    ? colorValues.secondary
                    : shape.fill,
              stroke:
                shape.stroke === config.bindings.stroke?.cssValue
                  ? colorValues.stroke
                  : shape.stroke === config.bindings.primary.cssValue
                    ? colorValues.primary
                    : shape.stroke,
            }
          : shape.type === 'path' ||
              shape.type === 'polygon' ||
              shape.type === 'rect'
            ? {
                ...shape,
                fill:
                  shape.fill === config.bindings.primary.cssValue
                    ? colorValues.primary
                    : shape.fill === config.bindings.secondary?.cssValue
                      ? colorValues.secondary
                      : shape.fill,
                stroke:
                  shape.stroke === config.bindings.stroke?.cssValue
                    ? colorValues.stroke
                    : shape.stroke === config.bindings.primary.cssValue
                      ? colorValues.primary
                      : shape.stroke,
              }
            : {
                ...shape,
                stroke:
                  shape.stroke === config.bindings.stroke?.cssValue
                    ? (colorValues.stroke ?? colorValues.primary)
                    : shape.stroke === config.bindings.primary.cssValue
                      ? colorValues.primary
                      : shape.stroke,
              };

      return serializeStyleTransferArtworkShape(normalizedShape);
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${config.viewBox.width} ${config.viewBox.height}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>${maskMarkup}</defs><rect x="0" y="0" width="${config.viewBox.width}" height="${config.viewBox.height}" fill="${escapeSvgAttribute(backgroundFill)}" fill-opacity="${spec.usage === 'scrim' ? 0.38 : 0.12}" />${config.maskBehavior === 'none' ? `<g>${shapeMarkup}</g>` : `<g mask="url(#${maskId})">${shapeMarkup}</g>`}</svg>`;
}

export function createStyleTransferArtworkDataUrl(
  spec: StyleTransferArtworkSpec,
  options?: {
    root?: HTMLElement;
  },
) {
  const markup = createStyleTransferArtworkSvgMarkup(spec, options);
  return `url("data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markup)}")`;
}

function includesAny(source: string, tokens: string[]) {
  return tokens.some((token) => source.includes(token));
}

function pickSeededCandidate<T>(seedSource: string, candidates: T[]) {
  if (candidates.length === 0) {
    return null;
  }

  const seed = hashString(seedSource);
  const index = Math.floor(
    seededFloat(seed, candidates.length) * candidates.length,
  );
  return candidates[index] ?? candidates[0];
}

function sanitizeSignal<T extends readonly string[]>(
  value: string | null | undefined,
  options: T,
  fallback: T[number],
): T[number] {
  return typeof value === 'string' && options.includes(value)
    ? (value as T[number])
    : fallback;
}

function getPreferredFamilies(prompt: string) {
  const normalized = prompt.toLowerCase();

  if (includesAny(normalized, ['burst', 'radiant', 'sunburst', 'flare'])) {
    return ['radial-burst', 'offset-rings'] as StyleTransferArtworkFamily[];
  }

  if (includesAny(normalized, ['ribbon', 'fold', 'sleek'])) {
    return ['folded-ribbon', 'angled-panel'] as StyleTransferArtworkFamily[];
  }

  if (includesAny(normalized, ['constellation', 'star', 'cinematic'])) {
    return ['constellation', 'offset-rings'] as StyleTransferArtworkFamily[];
  }

  if (includesAny(normalized, ['tile', 'modular', 'block'])) {
    return ['modular-tiles', 'grid-mesh'] as StyleTransferArtworkFamily[];
  }

  if (includesAny(normalized, ['frame', 'soft ui', 'inset'])) {
    return ['inset-frames', 'paper-cut'] as StyleTransferArtworkFamily[];
  }

  if (
    includesAny(normalized, ['angular', 'angled', 'panel', 'glowing angular'])
  ) {
    return ['angled-panel', 'offset-rings'] as StyleTransferArtworkFamily[];
  }

  if (
    includesAny(normalized, ['scrim', 'soft', 'paper', 'editorial', 'warm'])
  ) {
    return ['soft-blob', 'paper-cut'] as StyleTransferArtworkFamily[];
  }

  if (includesAny(normalized, ['wave', 'motif', 'section background'])) {
    return ['layered-wave', 'contour-lines'] as StyleTransferArtworkFamily[];
  }

  if (includesAny(normalized, ['scanline', 'terminal', 'retro'])) {
    return ['scanline-band', 'grid-mesh'] as StyleTransferArtworkFamily[];
  }

  if (includesAny(normalized, ['grid', 'mesh'])) {
    return ['grid-mesh', 'contour-lines'] as StyleTransferArtworkFamily[];
  }

  return [];
}

function getThemeDrivenFamilies(theme: StyleTransferThemeRecord) {
  const families: StyleTransferArtworkFamily[] = [];

  if (theme.pattern === 'scanlines') {
    families.push('scanline-band', 'contour-lines');
  }

  if (theme.pattern === 'grid') {
    families.push('grid-mesh', 'modular-tiles');
  }

  if (theme.surfaceStyle === 'glow') {
    families.push('offset-rings', 'radial-burst');
  }

  if (theme.surfaceStyle === 'glass') {
    families.push('offset-rings', 'folded-ribbon');
  }

  if (theme.surfaceStyle === 'paper') {
    families.push('paper-cut', 'inset-frames');
  }

  if (theme.buttonStyle === 'hard-edge') {
    families.push('angled-panel', 'modular-tiles');
  }

  if (theme.buttonStyle === 'pill') {
    families.push('soft-blob', 'offset-rings');
  }

  if (theme.density === 'compact') {
    families.push('contour-lines', 'grid-mesh', 'modular-tiles');
  }

  if (theme.density === 'airy') {
    families.push('layered-wave', 'paper-cut', 'folded-ribbon');
  }

  if (theme.motion === 'off') {
    families.push('scanline-band', 'grid-mesh', 'constellation');
  }

  return families;
}

export function createStyleTransferArtworkIntent(prompt: string) {
  const normalized = prompt.toLowerCase();
  const usage: StyleTransferArtworkUsage = includesAny(normalized, ['scrim'])
    ? 'scrim'
    : includesAny(normalized, ['divider'])
      ? 'divider'
      : includesAny(normalized, ['accent graphic', 'accent block'])
        ? 'accent-graphic'
        : 'section-background';

  const intent = styleTransferArtworkIntentSchema.parse({
    usage,
    visualWeight: includesAny(normalized, ['subtle', 'minimal', 'soft'])
      ? 'subtle'
      : includesAny(normalized, ['glowing', 'bold', 'neon'])
        ? 'bold'
        : 'balanced',
    restraint: includesAny(normalized, ['minimal', 'subtle'])
      ? 'strict'
      : includesAny(normalized, ['neon', 'glowing', 'cyberpunk'])
        ? 'expressive'
        : 'balanced',
    placement: usage === 'divider' ? 'bottom' : 'full-bleed',
    preferredFamilies: getPreferredFamilies(prompt),
    avoidFamilies: includesAny(normalized, ['minimal']) ? ['grid-mesh'] : [],
    backgroundBehavior: usage === 'scrim' ? 'tinted' : 'transparent',
    contrast: includesAny(normalized, ['high contrast', 'bold'])
      ? 'high'
      : includesAny(normalized, ['subtle', 'soft'])
        ? 'low'
        : 'balanced',
  });

  return intent;
}

function pickArtworkFamily(
  prompt: string,
  theme: StyleTransferThemeRecord,
  intent: StyleTransferArtworkIntent,
) {
  const normalized = prompt.toLowerCase();
  const candidates = [
    ...intent.preferredFamilies,
    ...getThemeDrivenFamilies(theme),
  ].filter((family, index, array) => {
    return (
      !intent.avoidFamilies.includes(family) && array.indexOf(family) === index
    );
  });

  if (includesAny(normalized, ['cyberpunk', 'angular', 'glowing'])) {
    candidates.unshift('angled-panel', 'radial-burst', 'offset-rings');
  }

  if (includesAny(normalized, ['scrim', 'editorial', 'paper'])) {
    candidates.unshift('soft-blob', 'paper-cut', 'inset-frames');
  }

  if (includesAny(normalized, ['motif', 'minimal dark'])) {
    candidates.unshift('contour-lines', 'layered-wave', 'constellation');
  }

  const filtered = candidates.filter((family, index, array) => {
    return (
      !intent.avoidFamilies.includes(family) && array.indexOf(family) === index
    );
  });

  return (
    pickSeededCandidate(
      `${theme.id}|${theme.name}|${prompt}|${intent.usage}`,
      filtered.length > 0
        ? filtered
        : ([
            'layered-wave',
            'contour-lines',
            'paper-cut',
            'folded-ribbon',
            'constellation',
          ] satisfies StyleTransferArtworkFamily[]),
    ) ?? 'layered-wave'
  );
}

function getArtworkBindings(
  family: StyleTransferArtworkFamily,
  theme: StyleTransferThemeRecord,
  intent: StyleTransferArtworkIntent,
) {
  if (intent.usage === 'scrim') {
    return {
      background: 'surfacePaper',
      primary: 'surfaceTint',
      secondary: 'backgroundAlt',
      stroke: 'muted',
    } satisfies StyleTransferArtworkSpec['colorBinding'];
  }

  if (family === 'angled-panel' || family === 'offset-rings') {
    return {
      background: 'background',
      primary: 'accent',
      secondary: 'accentStrong',
      stroke: 'focus',
    } satisfies StyleTransferArtworkSpec['colorBinding'];
  }

  if (family === 'radial-burst') {
    return {
      background: 'background',
      primary: 'accentStrong',
      secondary: 'accent',
      stroke: 'focus',
    } satisfies StyleTransferArtworkSpec['colorBinding'];
  }

  if (family === 'folded-ribbon') {
    return {
      background: 'backgroundAlt',
      primary: 'surfaceStrong',
      secondary: 'accent',
      stroke: 'muted',
    } satisfies StyleTransferArtworkSpec['colorBinding'];
  }

  if (family === 'contour-lines' || family === 'grid-mesh') {
    return {
      background: 'background',
      primary: theme.pattern === 'grid' ? 'text' : 'accent',
      secondary: 'muted',
      stroke: theme.pattern === 'grid' ? 'muted' : 'accentStrong',
    } satisfies StyleTransferArtworkSpec['colorBinding'];
  }

  if (family === 'modular-tiles') {
    return {
      background: 'surfacePaper',
      primary: 'surfaceStrong',
      secondary: 'accent',
      stroke: 'text',
    } satisfies StyleTransferArtworkSpec['colorBinding'];
  }

  if (family === 'constellation') {
    return {
      background: 'background',
      primary: 'accent',
      secondary: 'surfaceTint',
      stroke: 'muted',
    } satisfies StyleTransferArtworkSpec['colorBinding'];
  }

  if (family === 'inset-frames') {
    return {
      background: 'surfacePaper',
      primary: 'surfaceTint',
      secondary: 'surfaceStrong',
      stroke: 'accent',
    } satisfies StyleTransferArtworkSpec['colorBinding'];
  }

  if (family === 'paper-cut') {
    return {
      background: 'surfacePaper',
      primary: 'surface',
      secondary: 'surfaceTint',
      stroke: 'accent',
    } satisfies StyleTransferArtworkSpec['colorBinding'];
  }

  return {
    background: 'background',
    primary: 'accent',
    secondary: 'surfaceStrong',
    stroke: 'muted',
  } satisfies StyleTransferArtworkSpec['colorBinding'];
}

export function createFallbackStyleTransferArtworkSpec({
  intent,
  prompt,
  preferredFamily,
  theme,
}: {
  intent: StyleTransferArtworkIntent;
  prompt: string;
  preferredFamily?: StyleTransferArtworkFamily;
  theme: StyleTransferThemeRecord;
}) {
  const normalizedPrompt = prompt.toLowerCase();
  const seed = hashString(
    `${theme.id}|${theme.name}|${prompt}|${theme.surfaceStyle}|${theme.buttonStyle}|${theme.pattern}|${intent.usage}`,
  );
  const family = preferredFamily ?? pickArtworkFamily(prompt, theme, intent);
  const baseLayerCount =
    family === 'contour-lines' || family === 'grid-mesh'
      ? intent.visualWeight === 'bold'
        ? 5
        : 4
      : family === 'scanline-band'
        ? 5
        : intent.visualWeight === 'whisper'
          ? 2
          : intent.visualWeight === 'bold'
            ? 4
            : 3;
  const layerCount = clamp(
    baseLayerCount +
      Math.round(
        seededBetween(
          seed,
          1,
          intent.restraint === 'strict' ? -1 : 0,
          intent.restraint === 'expressive' ? 2 : 1,
        ),
      ),
    2,
    6,
  );
  const amplitude =
    family === 'layered-wave'
      ? seededBetween(seed, 2, 0.34, 0.72)
      : family === 'contour-lines'
        ? seededBetween(seed, 3, 0.18, 0.44)
        : family === 'scanline-band'
          ? seededBetween(seed, 4, 0.08, 0.2)
          : seededBetween(seed, 5, 0.16, 0.38);
  const frequency =
    family === 'layered-wave'
      ? seededBetween(seed, 6, 1.5, 3.4)
      : family === 'contour-lines'
        ? seededBetween(seed, 7, 1.8, 3.8)
        : family === 'grid-mesh'
          ? seededBetween(seed, 8, 0.9, 1.8)
          : seededBetween(seed, 9, 1.1, 2.4);
  const jitter =
    family === 'soft-blob'
      ? seededBetween(seed, 10, 0.34, 0.8)
      : family === 'paper-cut'
        ? seededBetween(seed, 11, 0.08, 0.26)
        : seededBetween(seed, 12, 0.08, 0.24);
  const rotation =
    family === 'angled-panel'
      ? includesAny(normalizedPrompt, ['angular'])
        ? seededBetween(seed, 13, 12, 22)
        : seededBetween(seed, 14, 6, 16)
      : family === 'offset-rings'
        ? seededBetween(seed, 15, -14, 14)
        : seededBetween(seed, 16, -4, 4);
  const scale =
    intent.usage === 'accent-graphic'
      ? seededBetween(seed, 17, 0.72, 0.96)
      : seededBetween(seed, 18, 0.94, 1.08);
  const opacity =
    intent.visualWeight === 'whisper'
      ? seededBetween(seed, 19, 0.12, 0.18)
      : intent.visualWeight === 'bold'
        ? seededBetween(seed, 20, 0.34, 0.48)
        : seededBetween(seed, 21, 0.22, 0.34);

  const spec = styleTransferArtworkSpecSchema.parse({
    usage: intent.usage,
    family,
    complexity:
      intent.restraint === 'strict'
        ? 'low'
        : intent.restraint === 'expressive'
          ? 'high'
          : 'balanced',
    density:
      intent.visualWeight === 'bold'
        ? 'dense'
        : intent.visualWeight === 'whisper'
          ? 'sparse'
          : 'balanced',
    layerCount,
    fillStyle:
      family === 'contour-lines' || family === 'grid-mesh'
        ? 'transparent'
        : family === 'constellation'
          ? 'transparent'
          : family === 'angled-panel'
            ? 'gradient'
            : family === 'folded-ribbon'
              ? 'gradient'
              : family === 'modular-tiles'
                ? 'tinted'
                : intent.usage === 'scrim'
                  ? 'tinted'
                  : 'solid',
    strokeStyle:
      family === 'contour-lines' || family === 'grid-mesh'
        ? 'hairline'
        : family === 'constellation'
          ? 'soft'
          : family === 'offset-rings'
            ? 'soft'
            : family === 'angled-panel'
              ? 'soft'
              : family === 'inset-frames'
                ? 'soft'
                : 'none',
    opacityMode:
      intent.visualWeight === 'whisper'
        ? 'whisper'
        : intent.visualWeight === 'subtle'
          ? 'soft'
          : intent.visualWeight === 'bold'
            ? 'assertive'
            : 'balanced',
    blendStyle:
      theme.surfaceStyle === 'glow'
        ? 'screen'
        : intent.usage === 'scrim'
          ? 'soft-light'
          : 'normal',
    cornerStyle:
      family === 'angled-panel'
        ? 'sharp'
        : family === 'modular-tiles'
          ? 'rounded'
          : family === 'paper-cut'
            ? 'rounded'
            : 'organic',
    motionStyle:
      theme.motion === 'off'
        ? 'still'
        : theme.motion === 'snappy'
          ? 'sweep'
          : 'drift',
    colorBinding: getArtworkBindings(family, theme, intent),
    placement: intent.placement,
    maskBehavior:
      intent.usage === 'scrim'
        ? 'fade-edges'
        : intent.usage === 'divider'
          ? 'fade-top'
          : 'none',
    aspectHint:
      intent.usage === 'divider'
        ? 'banner'
        : intent.usage === 'scrim'
          ? 'wide'
          : 'hero',
    controls: {
      amplitude,
      curvature:
        family === 'soft-blob' ||
        family === 'paper-cut' ||
        family === 'folded-ribbon'
          ? seededBetween(seed, 22, 0.62, 0.88)
          : seededBetween(seed, 23, 0.2, 0.42),
      inset:
        intent.usage === 'scrim'
          ? seededBetween(seed, 24, 22, 40)
          : seededBetween(seed, 25, 10, 24),
      jitter,
      noise:
        theme.pattern === 'noise'
          ? seededBetween(seed, 26, 0.28, 0.62)
          : seededBetween(seed, 27, 0.04, 0.14),
      opacity,
      rotation,
      scale,
      strokeWidth:
        family === 'contour-lines' || family === 'grid-mesh'
          ? seededBetween(seed, 28, 1, 1.8)
          : family === 'constellation'
            ? seededBetween(seed, 29, 1.2, 2.2)
            : family === 'offset-rings'
              ? seededBetween(seed, 30, 1.8, 3.2)
              : seededBetween(seed, 31, 1.2, 2.4),
      frequency,
    },
  });

  return spec;
}

export function pickPrimaryArtworkSlot(slots: StyleTransferArtworkSlots) {
  const entry = styleTransferArtworkSlotKeys.find((slotKey) => slots[slotKey]);

  if (!entry) {
    return null;
  }

  return {
    slotKey: entry,
    spec: slots[entry] as StyleTransferArtworkSpec,
  };
}

export function createFallbackArtworkSlotFromIntent(
  intent: StyleTransferArtworkIntent,
  spec: StyleTransferArtworkSpec,
) {
  const slotKey = slotKeyByUsage[intent.usage];

  return {
    slotKey,
    spec,
  };
}

export function createDefaultStyleTransferArtworkPreview(
  theme: StyleTransferThemeRecord,
  options?: {
    preferredFamily?: StyleTransferArtworkFamily;
    source?: StyleTransferArtworkPreview['source'];
  },
): StyleTransferArtworkPreview {
  const promptSeed = `${theme.name} ${theme.prompt ?? ''}`.trim();
  const baseIntent = createStyleTransferArtworkIntent(promptSeed);
  const intent = styleTransferArtworkIntentSchema.parse({
    ...baseIntent,
    usage: 'section-background',
    placement: 'full-bleed',
    backgroundBehavior:
      theme.surfaceStyle === 'glass' || theme.surfaceStyle === 'glow'
        ? 'tinted'
        : 'transparent',
  });
  const spec = createFallbackStyleTransferArtworkSpec({
    intent,
    prompt: promptSeed,
    preferredFamily: options?.preferredFamily,
    theme,
  });

  return {
    slotKey: 'sectionBackground',
    source:
      options?.source ?? (theme.source === 'preset' ? 'preset' : 'fallback'),
    spec,
  };
}

export function createStyleTransferArtworkPreviewFromThemeSignals(
  signals: StyleTransferArtworkThemeSignals,
  options?: {
    source?: StyleTransferArtworkPreview['source'];
  },
): StyleTransferArtworkPreview {
  const theme = {
    id: signals.id ?? 'generated-preview',
    name: signals.name,
    prompt: signals.prompt ?? null,
    source: signals.source,
    palette: defaultThemePalette,
    fonts: {
      sans: 'default',
      serif: 'default',
    },
    density: sanitizeSignal(
      signals.density,
      styleTransferDensityOptions,
      'balanced',
    ),
    surfaceStyle: sanitizeSignal(
      signals.surfaceStyle,
      styleTransferSurfaceOptions,
      'paper',
    ),
    buttonStyle: sanitizeSignal(
      signals.buttonStyle,
      styleTransferButtonOptions,
      'soft',
    ),
    pattern: sanitizeSignal(
      signals.pattern,
      styleTransferPatternOptions,
      'none',
    ),
    motion: sanitizeSignal(signals.motion, styleTransferMotionOptions, 'calm'),
  } satisfies StyleTransferThemeRecord;

  return createDefaultStyleTransferArtworkPreview(theme, options);
}
