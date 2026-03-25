import {
  analyzeStyleTransferThemeAccessibility,
  contrastRatio,
  formatContrastRatio,
  type StyleTransferAccessibilityAnalysis,
  type StyleTransferAccessibilityPairing,
} from './accessibility';
import {
  styleTransferThemeColorRoleOptions,
  styleTransferThemeRecordSchema,
  type StyleTransferThemeColorRole,
  type StyleTransferThemeRecord,
} from './schema';

export type StyleTransferThemeComplianceStatus =
  | 'pass'
  | 'repaired'
  | 'normalized'
  | 'reject';

export type StyleTransferThemeComplianceMode = 'light' | 'dark';

export type StyleTransferThemeComplianceAdjustment = {
  mode: StyleTransferThemeComplianceMode;
  role: StyleTransferThemeColorRole;
  from: string;
  to: string;
  reason: string;
};

export type StyleTransferThemeComplianceEvaluation = {
  status: Extract<StyleTransferThemeComplianceStatus, 'pass' | 'reject'>;
  analysis: StyleTransferAccessibilityAnalysis;
  failingCorePairings: StyleTransferAccessibilityPairing[];
  passesCorePairings: boolean;
};

export type StyleTransferThemeComplianceResult = {
  status: Exclude<StyleTransferThemeComplianceStatus, 'reject'>;
  theme: StyleTransferThemeRecord;
  initialAnalysis: StyleTransferAccessibilityAnalysis;
  analysis: StyleTransferAccessibilityAnalysis;
  adjustments: StyleTransferThemeComplianceAdjustment[];
  failingCorePairings: StyleTransferAccessibilityPairing[];
  notes: string[];
  failureMessage: null;
};

type RepairableRoleConfig = {
  role: Extract<StyleTransferThemeColorRole, 'text' | 'muted'>;
  target: number;
  backgrounds: Array<
    Extract<StyleTransferThemeColorRole, 'background' | 'surface'>
  >;
};

const repairableRoleConfigs: RepairableRoleConfig[] = [
  {
    role: 'text',
    target: 4.5,
    backgrounds: ['background', 'surface'],
  },
  {
    role: 'muted',
    target: 4.5,
    backgrounds: ['background', 'surface'],
  },
];

const repairAnchors = ['#ffffff', '#000000'] as const;
const repairSteps = 24;
const structuralRepairSteps = 20;
const repairablePairingIds = new Set([
  'text-on-background',
  'text-on-surface',
  'muted-on-background',
  'muted-on-surface',
  'accent-strong-on-background',
  'accent-strong-on-surface',
  'focus-on-background',
  'focus-on-surface',
]);

function cloneTheme(theme: StyleTransferThemeRecord) {
  return styleTransferThemeRecordSchema.parse({
    ...theme,
    palette: Object.fromEntries(
      styleTransferThemeColorRoleOptions.map((role) => [
        role,
        { ...theme.palette[role] },
      ]),
    ),
  });
}

function hexToRgb(value: string) {
  const normalized = value.replace('#', '');

  return {
    b: Number.parseInt(normalized.slice(4, 6), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    r: Number.parseInt(normalized.slice(0, 2), 16),
  };
}

function componentToHex(value: number) {
  return Math.round(Math.max(0, Math.min(255, value)))
    .toString(16)
    .padStart(2, '0');
}

function mixHex(first: string, second: string, weight: number) {
  const from = hexToRgb(first);
  const to = hexToRgb(second);
  const clampedWeight = Math.max(0, Math.min(1, weight));

  return `#${componentToHex(from.r + (to.r - from.r) * clampedWeight)}${componentToHex(
    from.g + (to.g - from.g) * clampedWeight,
  )}${componentToHex(from.b + (to.b - from.b) * clampedWeight)}`;
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

function getFailingCorePairings(analysis: StyleTransferAccessibilityAnalysis) {
  return analysis.corePairings.filter(
    (pairing) => !pairing.passesLight || !pairing.passesDark,
  );
}

function hasRepairablePairingFailures(
  analysis: StyleTransferAccessibilityAnalysis,
) {
  return analysis.pairings.some(
    (pairing) =>
      repairablePairingIds.has(pairing.id) &&
      (!pairing.passesLight || !pairing.passesDark),
  );
}

function createFailureMessage(pairings: StyleTransferAccessibilityPairing[]) {
  const primaryPairing = pairings[0];

  if (!primaryPairing) {
    return 'The remix theme could not meet the site readability checks in both modes.';
  }

  const lightStatus = primaryPairing.passesLight
    ? `light ${formatContrastRatio(primaryPairing.light)}`
    : `light ${formatContrastRatio(primaryPairing.light)}`;
  const darkStatus = primaryPairing.passesDark
    ? `dark ${formatContrastRatio(primaryPairing.dark)}`
    : `dark ${formatContrastRatio(primaryPairing.dark)}`;

  return `${primaryPairing.label} stayed below the ${primaryPairing.target}:1 readability target (${lightStatus}, ${darkStatus}).`;
}

function setPaletteValue(
  theme: StyleTransferThemeRecord,
  adjustments: StyleTransferThemeComplianceAdjustment[],
  role: StyleTransferThemeColorRole,
  mode: StyleTransferThemeComplianceMode,
  nextValue: string,
  reason: string,
) {
  const currentValue = theme.palette[role][mode];

  if (currentValue.toLowerCase() === nextValue.toLowerCase()) {
    return false;
  }

  theme.palette[role][mode] = nextValue;
  adjustments.push({
    from: currentValue,
    mode,
    reason,
    role,
    to: nextValue,
  });

  return true;
}

function ensureContrastWithAnchor(
  current: string,
  against: string,
  target: number,
  anchor: string,
) {
  if (contrastRatio(current, against) >= target) {
    return current;
  }

  for (let step = 1; step <= repairSteps; step += 1) {
    const candidate = mixHex(current, anchor, step / repairSteps);

    if (contrastRatio(candidate, against) >= target) {
      return candidate;
    }
  }

  return anchor;
}

function findForegroundRepair(
  current: string,
  backgrounds: string[],
  preferredAnchor: string,
  target: number,
) {
  const anchors = [
    preferredAnchor,
    ...repairAnchors.filter((anchor) => anchor !== preferredAnchor),
  ];

  for (const anchor of anchors) {
    for (let step = 1; step <= repairSteps; step += 1) {
      const weight = step / repairSteps;
      const candidate = mixHex(current, anchor, weight);

      if (
        backgrounds.every(
          (background) => contrastRatio(candidate, background) >= target,
        )
      ) {
        return candidate;
      }
    }
  }

  return null;
}

function buildSafeDarkBackground(currentBackground: string, accent: string) {
  const tinted = mixHex(currentBackground, accent, 0.14);

  return ensureContrastWithAnchor(tinted, '#ffffff', 13, '#000000');
}

function buildSafeDarkSurface(background: string, accent: string) {
  const tintedBase = mixHex(background, accent, 0.18);

  for (let step = 1; step <= structuralRepairSteps; step += 1) {
    const candidate = mixHex(tintedBase, '#ffffff', 0.02 + step * 0.008);

    if (
      luminance(candidate) > luminance(background) &&
      contrastRatio(candidate, background) >= 1.08 &&
      contrastRatio(candidate, '#ffffff') >= 7
    ) {
      return candidate;
    }
  }

  return ensureContrastWithAnchor(
    mixHex(background, '#ffffff', 0.12),
    '#ffffff',
    7,
    '#000000',
  );
}

function normalizePromptDarkStructure(
  theme: StyleTransferThemeRecord,
  adjustments: StyleTransferThemeComplianceAdjustment[],
) {
  const nextBackground = buildSafeDarkBackground(
    theme.palette.background.dark,
    theme.palette.accent.dark,
  );

  setPaletteValue(
    theme,
    adjustments,
    'background',
    'dark',
    nextBackground,
    'Normalized the dark background to a safe reading anchor.',
  );

  const nextSurface = buildSafeDarkSurface(
    theme.palette.background.dark,
    theme.palette.accent.dark,
  );

  setPaletteValue(
    theme,
    adjustments,
    'surface',
    'dark',
    nextSurface,
    'Lifted the dark surface above the page background while preserving dark-mode contrast.',
  );

  setPaletteValue(
    theme,
    adjustments,
    'backgroundAlt',
    'dark',
    mixHex(theme.palette.background.dark, theme.palette.surface.dark, 0.4),
    'Rebuilt the dark alternate background from the normalized dark ramp.',
  );
  setPaletteValue(
    theme,
    adjustments,
    'surfacePaper',
    'dark',
    mixHex(theme.palette.background.dark, theme.palette.surface.dark, 0.24),
    'Aligned the dark paper surface with the normalized dark ramp.',
  );
  setPaletteValue(
    theme,
    adjustments,
    'surfaceStrong',
    'dark',
    ensureContrastWithAnchor(
      mixHex(theme.palette.surface.dark, '#ffffff', 0.08),
      '#ffffff',
      5.6,
      '#000000',
    ),
    'Adjusted the dark strong surface for clearer elevation and legibility.',
  );
  setPaletteValue(
    theme,
    adjustments,
    'surfaceTint',
    'dark',
    ensureContrastWithAnchor(
      mixHex(theme.palette.surface.dark, theme.palette.accent.dark, 0.2),
      '#ffffff',
      4.8,
      '#000000',
    ),
    'Retinted the dark accent surface to stay readable as a supporting layer.',
  );
}

function applyFallbackDarkMode(
  theme: StyleTransferThemeRecord,
  adjustments: StyleTransferThemeComplianceAdjustment[],
) {
  const anchoredBackground = buildSafeDarkBackground(
    '#0f172a',
    theme.palette.accent.dark,
  );
  const anchoredSurface = buildSafeDarkSurface(
    anchoredBackground,
    theme.palette.accent.dark,
  );

  setPaletteValue(
    theme,
    adjustments,
    'background',
    'dark',
    anchoredBackground,
    'Applied the fallback dark background ramp.',
  );
  setPaletteValue(
    theme,
    adjustments,
    'surface',
    'dark',
    anchoredSurface,
    'Applied the fallback dark surface ramp.',
  );
  setPaletteValue(
    theme,
    adjustments,
    'backgroundAlt',
    'dark',
    mixHex(anchoredBackground, anchoredSurface, 0.4),
    'Applied the fallback dark alternate background ramp.',
  );
  setPaletteValue(
    theme,
    adjustments,
    'surfacePaper',
    'dark',
    mixHex(anchoredBackground, anchoredSurface, 0.24),
    'Applied the fallback dark paper ramp.',
  );
  setPaletteValue(
    theme,
    adjustments,
    'surfaceStrong',
    'dark',
    ensureContrastWithAnchor(
      mixHex(anchoredSurface, '#ffffff', 0.08),
      '#ffffff',
      5.6,
      '#000000',
    ),
    'Applied the fallback dark elevated surface ramp.',
  );
  setPaletteValue(
    theme,
    adjustments,
    'surfaceTint',
    'dark',
    ensureContrastWithAnchor(
      mixHex(anchoredSurface, theme.palette.accent.dark, 0.2),
      '#ffffff',
      4.8,
      '#000000',
    ),
    'Applied the fallback dark tinted surface ramp.',
  );
}

export function evaluateStyleTransferThemeCompliance(
  theme: StyleTransferThemeRecord,
): StyleTransferThemeComplianceEvaluation {
  const analysis = analyzeStyleTransferThemeAccessibility(theme);
  const failingCorePairings = getFailingCorePairings(analysis);

  return {
    analysis,
    failingCorePairings,
    passesCorePairings: failingCorePairings.length === 0,
    status: failingCorePairings.length === 0 ? 'pass' : 'reject',
  };
}

export function ensurePromptStyleTransferThemeCompliance(
  theme: StyleTransferThemeRecord,
): StyleTransferThemeComplianceResult {
  const initialEvaluation = evaluateStyleTransferThemeCompliance(theme);

  if (!hasRepairablePairingFailures(initialEvaluation.analysis)) {
    return {
      adjustments: [],
      analysis: initialEvaluation.analysis,
      failureMessage: null,
      failingCorePairings: [],
      initialAnalysis: initialEvaluation.analysis,
      notes: [
        'The theme cleared the readability gate without semantic repairs.',
      ],
      status: 'pass',
      theme,
    };
  }

  const candidateTheme = cloneTheme(theme);
  const adjustments: StyleTransferThemeComplianceAdjustment[] = [];
  const hasDarkCoreFailure = initialEvaluation.failingCorePairings.some(
    (pairing) => !pairing.passesDark,
  );

  if (hasDarkCoreFailure) {
    normalizePromptDarkStructure(candidateTheme, adjustments);
  }

  repairableRoleConfigs.forEach(({ backgrounds, role, target }) => {
    (['light', 'dark'] as const).forEach((mode) => {
      const backgroundValues = backgrounds.map(
        (backgroundRole) => candidateTheme.palette[backgroundRole][mode],
      );
      const current = candidateTheme.palette[role][mode];
      const passes = backgroundValues.every(
        (background) => contrastRatio(current, background) >= target,
      );

      if (passes) {
        return;
      }

      const preferredAnchor = mode === 'dark' ? '#ffffff' : '#000000';
      const repaired = findForegroundRepair(
        current,
        backgroundValues,
        preferredAnchor,
        target,
      );

      if (!repaired || repaired === current) {
        return;
      }

      candidateTheme.palette[role][mode] = repaired;
      adjustments.push({
        from: current,
        mode,
        reason: `Raised ${mode} ${role} contrast against ${backgrounds.join(' and ')}.`,
        role,
        to: repaired,
      });
    });
  });

  let repairedTheme = styleTransferThemeRecordSchema.parse(candidateTheme);
  let finalEvaluation = evaluateStyleTransferThemeCompliance(repairedTheme);

  if (finalEvaluation.passesCorePairings) {
    return {
      adjustments,
      analysis: finalEvaluation.analysis,
      failureMessage: null,
      failingCorePairings: [],
      initialAnalysis: initialEvaluation.analysis,
      notes: [
        hasDarkCoreFailure
          ? `Normalized the dark palette and adjusted ${adjustments.length} semantic color value${adjustments.length === 1 ? '' : 's'} to keep the core readability pairings within target.`
          : `Adjusted ${adjustments.length} semantic color value${adjustments.length === 1 ? '' : 's'} to keep the core readability pairings within target.`,
      ],
      status: hasDarkCoreFailure ? 'normalized' : 'repaired',
      theme: repairedTheme,
    };
  }

  applyFallbackDarkMode(candidateTheme, adjustments);

  repairableRoleConfigs.forEach(({ backgrounds, role, target }) => {
    const backgroundValues = backgrounds.map(
      (backgroundRole) => candidateTheme.palette[backgroundRole].dark,
    );
    const current = candidateTheme.palette[role].dark;
    const repaired = findForegroundRepair(
      current,
      backgroundValues,
      '#ffffff',
      target,
    );

    if (!repaired || repaired === current) {
      return;
    }

    setPaletteValue(
      candidateTheme,
      adjustments,
      role,
      'dark',
      repaired,
      `Finalized dark ${role} against the fallback dark ramp.`,
    );
  });

  repairedTheme = styleTransferThemeRecordSchema.parse(candidateTheme);
  finalEvaluation = evaluateStyleTransferThemeCompliance(repairedTheme);

  if (finalEvaluation.passesCorePairings) {
    return {
      adjustments,
      analysis: finalEvaluation.analysis,
      failureMessage: null,
      failingCorePairings: [],
      initialAnalysis: initialEvaluation.analysis,
      notes: [
        'The original dark palette could not sustain readable text across the page and surface layers, so the system synthesized a safe dark ramp before applying the theme.',
        `Adjusted ${adjustments.length} semantic color value${adjustments.length === 1 ? '' : 's'} during normalization.`,
      ],
      status: 'normalized',
      theme: repairedTheme,
    };
  }

  const hardSafeTheme = cloneTheme(repairedTheme);

  setPaletteValue(
    hardSafeTheme,
    adjustments,
    'text',
    'dark',
    '#f3f7fb',
    'Applied a hard-safe dark text fallback.',
  );
  setPaletteValue(
    hardSafeTheme,
    adjustments,
    'muted',
    'dark',
    '#c7d2de',
    'Applied a hard-safe dark muted text fallback.',
  );

  repairedTheme = styleTransferThemeRecordSchema.parse(hardSafeTheme);
  finalEvaluation = evaluateStyleTransferThemeCompliance(repairedTheme);

  return {
    adjustments,
    analysis: finalEvaluation.analysis,
    failureMessage: null,
    failingCorePairings: finalEvaluation.failingCorePairings,
    initialAnalysis: initialEvaluation.analysis,
    notes: [
      'The original dark palette was rebuilt into a safe fallback ramp before the theme reached the page.',
      finalEvaluation.passesCorePairings
        ? 'The final fallback satisfies the core readability checks.'
        : createFailureMessage(finalEvaluation.failingCorePairings),
    ],
    status: 'normalized',
    theme: repairedTheme,
  };
}
