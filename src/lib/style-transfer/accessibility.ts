import type {
  StyleTransferThemeColorRole,
  StyleTransferThemeRecord,
} from './schema';

type StyleTransferAccessibilityPairingDefinition = {
  id: StyleTransferAccessibilityPairingId;
  label: string;
  foregroundRole: StyleTransferThemeColorRole;
  backgroundRole: StyleTransferThemeColorRole;
  target: number;
  isCore: boolean;
};

export type StyleTransferAccessibilityPairingId =
  | 'text-on-background'
  | 'text-on-surface'
  | 'muted-on-background'
  | 'muted-on-surface'
  | 'accent-strong-on-background'
  | 'accent-strong-on-surface'
  | 'focus-on-background'
  | 'focus-on-surface'
  | 'accent-on-background';

const pairingDefinitions = [
  {
    id: 'text-on-background',
    label: 'Text on background',
    foregroundRole: 'text',
    backgroundRole: 'background',
    target: 4.5,
    isCore: true,
  },
  {
    id: 'text-on-surface',
    label: 'Text on surface',
    foregroundRole: 'text',
    backgroundRole: 'surface',
    target: 4.5,
    isCore: true,
  },
  {
    id: 'muted-on-background',
    label: 'Muted text on background',
    foregroundRole: 'muted',
    backgroundRole: 'background',
    target: 4.5,
    isCore: false,
  },
  {
    id: 'muted-on-surface',
    label: 'Muted text on surface',
    foregroundRole: 'muted',
    backgroundRole: 'surface',
    target: 4.5,
    isCore: false,
  },
  {
    id: 'accent-strong-on-background',
    label: 'Accent strong on background',
    foregroundRole: 'accentStrong',
    backgroundRole: 'background',
    target: 4.5,
    isCore: false,
  },
  {
    id: 'accent-strong-on-surface',
    label: 'Accent strong on surface',
    foregroundRole: 'accentStrong',
    backgroundRole: 'surface',
    target: 4.5,
    isCore: false,
  },
  {
    id: 'focus-on-background',
    label: 'Focus on background',
    foregroundRole: 'focus',
    backgroundRole: 'background',
    target: 3,
    isCore: false,
  },
  {
    id: 'focus-on-surface',
    label: 'Focus on surface',
    foregroundRole: 'focus',
    backgroundRole: 'surface',
    target: 3,
    isCore: false,
  },
  {
    id: 'accent-on-background',
    label: 'Accent on background',
    foregroundRole: 'accent',
    backgroundRole: 'background',
    target: 2,
    isCore: false,
  },
] as const satisfies readonly StyleTransferAccessibilityPairingDefinition[];

export const styleTransferAccessibilityPairingDefinitions = pairingDefinitions;

export const styleTransferAccessibilityCorePairingIds =
  pairingDefinitions.flatMap((definition) =>
    definition.isCore ? [definition.id] : [],
  );

export type StyleTransferAccessibilityPairing = {
  id: StyleTransferAccessibilityPairingId;
  label: string;
  foregroundRole: StyleTransferThemeColorRole;
  backgroundRole: StyleTransferThemeColorRole;
  light: number;
  dark: number;
  target: number;
  passesLight: boolean;
  passesDark: boolean;
  isCore: boolean;
};

export type StyleTransferAccessibilityAnalysis = {
  pairings: StyleTransferAccessibilityPairing[];
  corePairings: StyleTransferAccessibilityPairing[];
  corePassCount: number;
  coreTotal: number;
  notes: string[];
  surfaceSeparation: {
    light: number;
    dark: number;
  };
};

function hexToRgb(value: string) {
  const normalized = value.replace('#', '');

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function channelToLinear(channel: number) {
  const normalized = channel / 255;

  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);

  return (
    0.2126 * channelToLinear(r) +
    0.7152 * channelToLinear(g) +
    0.0722 * channelToLinear(b)
  );
}

export function contrastRatio(first: string, second: string) {
  const firstLum = luminance(first);
  const secondLum = luminance(second);
  const lighter = Math.max(firstLum, secondLum);
  const darker = Math.min(firstLum, secondLum);

  return (lighter + 0.05) / (darker + 0.05);
}

export function formatContrastRatio(value: number) {
  return value.toFixed(2);
}

function createAccessibilityPairing(
  definition: StyleTransferAccessibilityPairingDefinition,
  theme: Pick<StyleTransferThemeRecord, 'palette'>,
): StyleTransferAccessibilityPairing {
  const light = contrastRatio(
    theme.palette[definition.foregroundRole].light,
    theme.palette[definition.backgroundRole].light,
  );
  const dark = contrastRatio(
    theme.palette[definition.foregroundRole].dark,
    theme.palette[definition.backgroundRole].dark,
  );

  return {
    backgroundRole: definition.backgroundRole,
    dark,
    foregroundRole: definition.foregroundRole,
    id: definition.id,
    isCore: definition.isCore,
    label: definition.label,
    light,
    passesDark: dark >= definition.target,
    passesLight: light >= definition.target,
    target: definition.target,
  };
}

export function analyzeStyleTransferThemeAccessibility(
  theme: Pick<StyleTransferThemeRecord, 'motion' | 'palette'>,
): StyleTransferAccessibilityAnalysis {
  const pairings = pairingDefinitions.map((definition) =>
    createAccessibilityPairing(definition, theme),
  );
  const corePairings = pairings.filter((pairing) => pairing.isCore);
  const corePassCount = corePairings.filter(
    (pairing) => pairing.passesLight && pairing.passesDark,
  ).length;
  const surfaceSeparation = {
    dark: contrastRatio(
      theme.palette.surface.dark,
      theme.palette.background.dark,
    ),
    light: contrastRatio(
      theme.palette.surface.light,
      theme.palette.background.light,
    ),
  };
  const notes: string[] = [];

  if (corePassCount === corePairings.length) {
    notes.push(
      'Core readability pairings stay at or above their contrast targets in both light and dark modes.',
    );
  } else {
    notes.push(
      'One or more core readability pairings dip below the target threshold in at least one mode.',
    );
  }

  if (surfaceSeparation.light >= 1.08 && surfaceSeparation.dark >= 1.08) {
    notes.push(
      'Surface layers stay visually distinct from the page background in both modes.',
    );
  } else {
    notes.push(
      'Surface and background layers are comparatively close in at least one mode.',
    );
  }

  return {
    corePairings,
    corePassCount,
    coreTotal: corePairings.length,
    notes,
    pairings,
    surfaceSeparation,
  };
}
