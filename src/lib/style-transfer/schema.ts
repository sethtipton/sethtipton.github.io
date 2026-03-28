import { z } from 'zod';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const hexPattern = /^#(?:[0-9a-fA-F]{6})$/;

export const styleTransferThemeColorRoleOptions = [
  'background',
  'backgroundAlt',
  'surface',
  'surfaceStrong',
  'surfaceTint',
  'surfacePaper',
  'text',
  'muted',
  'accent',
  'accentStrong',
  'focus',
] as const;

export const styleTransferSansFontOptions = [
  'default',
  'neo-grotesk',
  'humanist',
  'terminal',
] as const;

export const styleTransferSerifFontOptions = [
  'default',
  'editorial',
  'oldstyle',
] as const;

export const styleTransferDensityOptions = [
  'compact',
  'balanced',
  'airy',
] as const;

export const styleTransferSurfaceOptions = [
  'flat',
  'paper',
  'glass',
  'glow',
] as const;

export const styleTransferButtonOptions = [
  'soft',
  'outline',
  'hard-edge',
  'pill',
] as const;

export const styleTransferRadiusProfileOptions = [
  'sharp',
  'tight',
  'balanced',
  'soft',
  'puffy',
] as const;

export const styleTransferPatternOptions = [
  'none',
  'tilt',
  'grid',
  'noise',
  'scanlines',
] as const;

export const styleTransferMotionOptions = ['off', 'calm', 'snappy'] as const;

export const dualHexSchema = z.object({
  light: z.string().regex(hexPattern),
  dark: z.string().regex(hexPattern),
});

export const styleTransferPaletteSchema = z.object({
  background: dualHexSchema,
  backgroundAlt: dualHexSchema,
  surface: dualHexSchema,
  surfaceStrong: dualHexSchema,
  surfaceTint: dualHexSchema,
  surfacePaper: dualHexSchema,
  text: dualHexSchema,
  muted: dualHexSchema,
  accent: dualHexSchema,
  accentStrong: dualHexSchema,
  focus: dualHexSchema,
});

export const styleTransferModelOutputSchema = z.object({
  styleName: z.string().trim().min(2).max(48),
  palette: styleTransferPaletteSchema,
  fonts: z.object({
    sans: z.enum(styleTransferSansFontOptions),
    serif: z.enum(styleTransferSerifFontOptions),
  }),
  density: z.enum(styleTransferDensityOptions),
  surfaceStyle: z.enum(styleTransferSurfaceOptions),
  buttonStyle: z.enum(styleTransferButtonOptions),
  radiusProfile: z.enum(styleTransferRadiusProfileOptions).optional(),
  pattern: z.enum(styleTransferPatternOptions),
  motion: z.enum(styleTransferMotionOptions),
});

export const styleTransferThemeSourceSchema = z.enum(['preset', 'prompt']);

export const styleTransferThemeRecordSchema = styleTransferModelOutputSchema
  .omit({
    styleName: true,
  })
  .extend({
    id: z.string().regex(slugPattern),
    name: z.string().trim().min(2).max(48),
    prompt: z.string().trim().min(2).max(400).nullable().default(null),
    source: styleTransferThemeSourceSchema.default('preset'),
  });

export type DualHex = z.infer<typeof dualHexSchema>;
export type StyleTransferModelOutput = z.infer<
  typeof styleTransferModelOutputSchema
>;
export type StyleTransferThemeRecord = z.infer<
  typeof styleTransferThemeRecordSchema
>;
export type StyleTransferThemeSource = z.infer<
  typeof styleTransferThemeSourceSchema
>;
export type StyleTransferThemeColorRole =
  (typeof styleTransferThemeColorRoleOptions)[number];
export type StyleTransferRadiusProfile =
  (typeof styleTransferRadiusProfileOptions)[number];

export function resolveStyleTransferRadiusProfile(
  theme: Pick<
    StyleTransferModelOutput,
    'buttonStyle' | 'density' | 'fonts' | 'surfaceStyle'
  > & {
    radiusProfile?: StyleTransferRadiusProfile | null;
  },
) {
  if (theme.radiusProfile) {
    return theme.radiusProfile;
  }

  if (theme.buttonStyle === 'hard-edge') {
    return theme.fonts.sans === 'terminal' ? 'tight' : 'sharp';
  }

  if (theme.fonts.sans === 'terminal') {
    return 'tight';
  }

  if (
    theme.surfaceStyle === 'paper' &&
    theme.buttonStyle === 'pill' &&
    theme.density === 'airy'
  ) {
    return 'puffy';
  }

  if (
    theme.surfaceStyle === 'glass' ||
    theme.surfaceStyle === 'glow' ||
    theme.buttonStyle === 'pill' ||
    theme.buttonStyle === 'soft'
  ) {
    return 'soft';
  }

  if (
    theme.density === 'compact' ||
    (theme.surfaceStyle === 'flat' && theme.buttonStyle === 'outline')
  ) {
    return 'tight';
  }

  return 'balanced';
}

export function slugifyStyleTransferName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 48);
}

function formatPromptThemeName(prompt: string) {
  const normalizedPrompt = prompt
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 48)
    .trim();

  if (!normalizedPrompt) {
    return '';
  }

  return normalizedPrompt.replace(/[A-Za-z0-9']+/g, (segment) => {
    if (/^[A-Z0-9']+$/.test(segment)) {
      return segment;
    }

    const lower = segment.toLowerCase();

    return `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`;
  });
}

export function createCustomStyleTransferThemeRecord(
  prompt: string,
  payload: StyleTransferModelOutput,
): StyleTransferThemeRecord {
  const parsed = styleTransferModelOutputSchema.parse(payload);
  const modelName = parsed.styleName.trim();
  const name = formatPromptThemeName(prompt) || modelName;
  const fallbackId = `custom-${Date.now().toString(36)}`;
  const id =
    slugifyStyleTransferName(modelName) ||
    slugifyStyleTransferName(name) ||
    fallbackId;

  return styleTransferThemeRecordSchema.parse({
    id,
    name,
    prompt: prompt.trim(),
    source: 'prompt',
    palette: parsed.palette,
    fonts: parsed.fonts,
    density: parsed.density,
    surfaceStyle: parsed.surfaceStyle,
    buttonStyle: parsed.buttonStyle,
    radiusProfile: resolveStyleTransferRadiusProfile(parsed),
    pattern: parsed.pattern,
    motion: parsed.motion,
  });
}
