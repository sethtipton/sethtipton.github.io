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
  tier: 'core' | 'informational' | 'support';
};

export type StyleTransferAccessibilityPairingId =
  | 'text-on-background'
  | 'text-on-surface'
  | 'text-on-surface-strong'
  | 'text-on-surface-tint'
  | 'muted-on-background'
  | 'muted-on-surface'
  | 'muted-on-background-alt'
  | 'muted-on-surface-strong'
  | 'muted-on-surface-tint'
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
    tier: 'core',
  },
  {
    id: 'text-on-surface',
    label: 'Text on surface',
    foregroundRole: 'text',
    backgroundRole: 'surface',
    target: 4.5,
    tier: 'core',
  },
  {
    id: 'text-on-surface-strong',
    label: 'Text on elevated surface',
    foregroundRole: 'text',
    backgroundRole: 'surfaceStrong',
    target: 4.5,
    tier: 'support',
  },
  {
    id: 'text-on-surface-tint',
    label: 'Text on tinted surface',
    foregroundRole: 'text',
    backgroundRole: 'surfaceTint',
    target: 4.5,
    tier: 'support',
  },
  {
    id: 'muted-on-background',
    label: 'Muted text on background',
    foregroundRole: 'muted',
    backgroundRole: 'background',
    target: 4.5,
    tier: 'support',
  },
  {
    id: 'muted-on-surface',
    label: 'Muted text on surface',
    foregroundRole: 'muted',
    backgroundRole: 'surface',
    target: 4.5,
    tier: 'support',
  },
  {
    id: 'muted-on-background-alt',
    label: 'Muted text on alternate background',
    foregroundRole: 'muted',
    backgroundRole: 'backgroundAlt',
    target: 4.5,
    tier: 'support',
  },
  {
    id: 'muted-on-surface-strong',
    label: 'Muted text on elevated surface',
    foregroundRole: 'muted',
    backgroundRole: 'surfaceStrong',
    target: 4.5,
    tier: 'support',
  },
  {
    id: 'muted-on-surface-tint',
    label: 'Muted text on tinted surface',
    foregroundRole: 'muted',
    backgroundRole: 'surfaceTint',
    target: 4.5,
    tier: 'support',
  },
  {
    id: 'accent-strong-on-background',
    label: 'Accent strong on background',
    foregroundRole: 'accentStrong',
    backgroundRole: 'background',
    target: 4.5,
    tier: 'informational',
  },
  {
    id: 'accent-strong-on-surface',
    label: 'Accent strong on surface',
    foregroundRole: 'accentStrong',
    backgroundRole: 'surface',
    target: 4.5,
    tier: 'informational',
  },
  {
    id: 'focus-on-background',
    label: 'Focus on background',
    foregroundRole: 'focus',
    backgroundRole: 'background',
    target: 3,
    tier: 'informational',
  },
  {
    id: 'focus-on-surface',
    label: 'Focus on surface',
    foregroundRole: 'focus',
    backgroundRole: 'surface',
    target: 3,
    tier: 'informational',
  },
  {
    id: 'accent-on-background',
    label: 'Accent on background',
    foregroundRole: 'accent',
    backgroundRole: 'background',
    target: 2,
    tier: 'informational',
  },
] as const satisfies readonly StyleTransferAccessibilityPairingDefinition[];

export const styleTransferAccessibilityPairingDefinitions = pairingDefinitions;

export const styleTransferAccessibilityCorePairingIds =
  pairingDefinitions.flatMap((definition) =>
    definition.tier === 'core' ? [definition.id] : [],
  );

export const styleTransferAccessibilitySupportPairingIds =
  pairingDefinitions.flatMap((definition) =>
    definition.tier === 'support' ? [definition.id] : [],
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
  isSupport: boolean;
  tier: 'core' | 'informational' | 'support';
};

export type StyleTransferAccessibilityAnalysis = {
  pairings: StyleTransferAccessibilityPairing[];
  corePairings: StyleTransferAccessibilityPairing[];
  supportPairings: StyleTransferAccessibilityPairing[];
  corePassCount: number;
  coreTotal: number;
  supportPassCount: number;
  supportTotal: number;
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
    isCore: definition.tier === 'core',
    isSupport: definition.tier === 'support',
    label: definition.label,
    light,
    passesDark: dark >= definition.target,
    passesLight: light >= definition.target,
    target: definition.target,
    tier: definition.tier,
  };
}

export function analyzeStyleTransferThemeAccessibility(
  theme: Pick<StyleTransferThemeRecord, 'motion' | 'palette'>,
): StyleTransferAccessibilityAnalysis {
  const pairings = pairingDefinitions.map((definition) =>
    createAccessibilityPairing(definition, theme),
  );
  const corePairings = pairings.filter((pairing) => pairing.isCore);
  const supportPairings = pairings.filter((pairing) => pairing.isSupport);
  const corePassCount = corePairings.filter(
    (pairing) => pairing.passesLight && pairing.passesDark,
  ).length;
  const supportPassCount = supportPairings.filter(
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

  if (supportPassCount === supportPairings.length) {
    notes.push(
      'Support text stays readable across the alternate, elevated, and tinted surfaces in both modes.',
    );
  } else {
    notes.push(
      'Support text drops below the target threshold on at least one supporting surface.',
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
    supportPairings,
    supportPassCount,
    supportTotal: supportPairings.length,
    surfaceSeparation,
  };
}
