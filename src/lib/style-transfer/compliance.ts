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
export type StyleTransferThemeComplianceAdjustmentKind =
  | 'derivation'
  | 'fallback'
  | 'normalization'
  | 'repair';

export type StyleTransferThemeComplianceAdjustment = {
  kind: StyleTransferThemeComplianceAdjustmentKind;
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
  failingSupportPairings: StyleTransferAccessibilityPairing[];
  passesCorePairings: boolean;
  passesRequiredPairings: boolean;
  passesSupportPairings: boolean;
};

export type StyleTransferThemeComplianceResult = {
  status: Exclude<StyleTransferThemeComplianceStatus, 'reject'>;
  theme: StyleTransferThemeRecord;
  initialAnalysis: StyleTransferAccessibilityAnalysis;
  analysis: StyleTransferAccessibilityAnalysis;
  adjustments: StyleTransferThemeComplianceAdjustment[];
  failingCorePairings: StyleTransferAccessibilityPairing[];
  failingSupportPairings: StyleTransferAccessibilityPairing[];
  notes: string[];
  failureMessage: string | null;
  passesCorePairings: boolean;
  passesRequiredPairings: boolean;
  passesSupportPairings: boolean;
};

type RepairableRoleConfig = {
  role: Extract<StyleTransferThemeColorRole, 'muted' | 'text'>;
  target: number;
  backgrounds: StyleTransferThemeColorRole[];
};

type EnsureThemeComplianceOptions = {
  source: 'preset' | 'prompt';
};

const repairableRoleConfigs: RepairableRoleConfig[] = [
  {
    role: 'text',
    target: 4.5,
    backgrounds: ['background', 'surface', 'surfaceStrong', 'surfaceTint'],
  },
  {
    role: 'muted',
    target: 4.5,
    backgrounds: [
      'background',
      'backgroundAlt',
      'surface',
      'surfaceStrong',
      'surfaceTint',
    ],
  },
];

const repairAnchors = ['#ffffff', '#000000'] as const;
const repairSteps = 24;
const structuralRepairSteps = 20;

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

function getFailingSupportPairings(
  analysis: StyleTransferAccessibilityAnalysis,
) {
  return analysis.supportPairings.filter(
    (pairing) => !pairing.passesLight || !pairing.passesDark,
  );
}

function createFailureMessage(pairings: StyleTransferAccessibilityPairing[]) {
  const primaryPairing = pairings[0];

  if (!primaryPairing) {
    return 'The remix theme could not meet the site readability checks in both modes.';
  }

  const lightStatus = `light ${formatContrastRatio(primaryPairing.light)}`;
  const darkStatus = `dark ${formatContrastRatio(primaryPairing.dark)}`;

  return `${primaryPairing.label} stayed below the ${primaryPairing.target}:1 readability target (${lightStatus}, ${darkStatus}).`;
}

function setPaletteValue(
  theme: StyleTransferThemeRecord,
  adjustments: StyleTransferThemeComplianceAdjustment[],
  role: StyleTransferThemeColorRole,
  mode: StyleTransferThemeComplianceMode,
  nextValue: string,
  reason: string,
  kind: StyleTransferThemeComplianceAdjustmentKind,
) {
  const currentValue = theme.palette[role][mode];

  if (currentValue.toLowerCase() === nextValue.toLowerCase()) {
    return false;
  }

  theme.palette[role][mode] = nextValue;
  adjustments.push({
    from: currentValue,
    kind,
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

function getSurfaceElevationAnchor(background: string, surface: string) {
  return luminance(surface) >= luminance(background) ? '#ffffff' : '#000000';
}

function buildDerivedSurfaceStrong(
  background: string,
  surface: string,
  text: string,
) {
  const anchor = getSurfaceElevationAnchor(background, surface);
  let bestCandidate = mixHex(surface, anchor, 0.12);

  for (let step = 1; step <= structuralRepairSteps; step += 1) {
    const candidate = mixHex(surface, anchor, Math.min(0.3, 0.1 + step * 0.01));

    if (
      contrastRatio(text, candidate) >= 4.5 &&
      contrastRatio(candidate, background) >= 1.14
    ) {
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}

function buildDerivedSurfacePaper(
  background: string,
  surface: string,
  text: string,
) {
  let bestCandidate = mixHex(background, surface, 0.3);

  for (let step = 1; step <= structuralRepairSteps; step += 1) {
    const candidate = mixHex(
      background,
      surface,
      Math.min(0.38, 0.24 + step * 0.007),
    );

    if (
      contrastRatio(text, candidate) >= 4.5 &&
      contrastRatio(candidate, background) >= 1.03
    ) {
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}

function buildDerivedSurfaceTint(
  background: string,
  surface: string,
  accent: string,
  text: string,
) {
  let bestCandidate = mixHex(surface, accent, 0.12);

  for (let step = 1; step <= structuralRepairSteps; step += 1) {
    const candidate = mixHex(
      surface,
      accent,
      Math.min(0.24, 0.08 + step * 0.008),
    );

    if (
      contrastRatio(text, candidate) >= 4.5 &&
      contrastRatio(candidate, background) >= 1.03
    ) {
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}

function deriveSupportSurfacePalette(
  theme: StyleTransferThemeRecord,
  adjustments: StyleTransferThemeComplianceAdjustment[],
  modes: readonly StyleTransferThemeComplianceMode[],
  kind: Extract<
    StyleTransferThemeComplianceAdjustmentKind,
    'derivation' | 'fallback' | 'normalization'
  >,
) {
  modes.forEach((mode) => {
    const background = theme.palette.background[mode];
    const surface = theme.palette.surface[mode];
    const text = theme.palette.text[mode];
    const accent = theme.palette.accent[mode];

    setPaletteValue(
      theme,
      adjustments,
      'backgroundAlt',
      mode,
      mixHex(background, surface, 0.42),
      `Rebuilt the ${mode} alternate background from the local surface ramp.`,
      kind,
    );
    setPaletteValue(
      theme,
      adjustments,
      'surfacePaper',
      mode,
      buildDerivedSurfacePaper(background, surface, text),
      `Rebuilt the ${mode} paper surface from the local surface ramp.`,
      kind,
    );
    setPaletteValue(
      theme,
      adjustments,
      'surfaceStrong',
      mode,
      buildDerivedSurfaceStrong(background, surface, text),
      `Derived the ${mode} elevated surface from the core palette seed.`,
      kind,
    );
    setPaletteValue(
      theme,
      adjustments,
      'surfaceTint',
      mode,
      buildDerivedSurfaceTint(background, surface, accent, text),
      `Derived the ${mode} tinted surface from the core palette seed.`,
      kind,
    );
  });
}

function deriveMutedValue(
  theme: StyleTransferThemeRecord,
  mode: StyleTransferThemeComplianceMode,
) {
  const background = theme.palette.background[mode];
  const surface = theme.palette.surface[mode];
  const backgroundAlt = theme.palette.backgroundAlt[mode];
  const surfaceStrong = theme.palette.surfaceStrong[mode];
  const surfaceTint = theme.palette.surfaceTint[mode];
  const text = theme.palette.text[mode];
  const supportAnchor = mixHex(background, surface, 0.5);
  let bestCandidate = text;

  for (let step = 1; step <= repairSteps + 6; step += 1) {
    const candidate = mixHex(text, supportAnchor, step / (repairSteps + 6));

    if (
      contrastRatio(candidate, background) >= 4.5 &&
      contrastRatio(candidate, backgroundAlt) >= 4.5 &&
      contrastRatio(candidate, surface) >= 4.5 &&
      contrastRatio(candidate, surfaceStrong) >= 4.5 &&
      contrastRatio(candidate, surfaceTint) >= 4.5 &&
      contrastRatio(text, candidate) >= 1.15
    ) {
      bestCandidate = candidate;
      continue;
    }

    break;
  }

  return bestCandidate;
}

function deriveMutedPalette(
  theme: StyleTransferThemeRecord,
  adjustments: StyleTransferThemeComplianceAdjustment[],
  modes: readonly StyleTransferThemeComplianceMode[],
) {
  modes.forEach((mode) => {
    setPaletteValue(
      theme,
      adjustments,
      'muted',
      mode,
      deriveMutedValue(theme, mode),
      `Derived the ${mode} muted text token from the local text and surface ramp.`,
      'derivation',
    );
  });
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
    'normalization',
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
    'Lifted the dark surface above the page background while preserving contrast.',
    'normalization',
  );

  deriveSupportSurfacePalette(theme, adjustments, ['dark'], 'normalization');
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
    'fallback',
  );
  setPaletteValue(
    theme,
    adjustments,
    'surface',
    'dark',
    anchoredSurface,
    'Applied the fallback dark surface ramp.',
    'fallback',
  );
  deriveSupportSurfacePalette(theme, adjustments, ['dark'], 'fallback');
}

function repairReadableForegroundRoles(
  theme: StyleTransferThemeRecord,
  adjustments: StyleTransferThemeComplianceAdjustment[],
  roles: readonly RepairableRoleConfig[],
  modes: readonly StyleTransferThemeComplianceMode[],
) {
  roles.forEach(({ backgrounds, role, target }) => {
    modes.forEach((mode) => {
      const backgroundValues = backgrounds.map(
        (backgroundRole) => theme.palette[backgroundRole][mode],
      );
      const current = theme.palette[role][mode];
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

      setPaletteValue(
        theme,
        adjustments,
        role,
        mode,
        repaired,
        `Raised ${mode} ${role} contrast against ${backgrounds.join(', ')}.`,
        'repair',
      );
    });
  });
}

function resolveComplianceStatus(
  adjustments: StyleTransferThemeComplianceAdjustment[],
) {
  if (
    adjustments.some(
      (adjustment) =>
        adjustment.kind === 'normalization' || adjustment.kind === 'fallback',
    )
  ) {
    return 'normalized' as const;
  }

  if (adjustments.some((adjustment) => adjustment.kind === 'repair')) {
    return 'repaired' as const;
  }

  return 'pass' as const;
}

function createComplianceNotes(
  source: EnsureThemeComplianceOptions['source'],
  status: Exclude<StyleTransferThemeComplianceStatus, 'reject'>,
  adjustments: StyleTransferThemeComplianceAdjustment[],
  finalEvaluation: StyleTransferThemeComplianceEvaluation,
) {
  const repairCount = adjustments.filter(
    (adjustment) => adjustment.kind === 'repair',
  ).length;
  const normalizationCount = adjustments.filter(
    (adjustment) =>
      adjustment.kind === 'normalization' || adjustment.kind === 'fallback',
  ).length;
  const notes: string[] = [];

  if (status === 'pass') {
    notes.push(
      source === 'prompt'
        ? 'The theme cleared the readability gate after rebuilding its support palette locally.'
        : 'The preset support palette was rebuilt locally without requiring contrast repairs.',
    );
  }

  if (repairCount > 0) {
    notes.push(
      `Adjusted ${repairCount} semantic text value${repairCount === 1 ? '' : 's'} to keep support text readable across the site surfaces.`,
    );
  }

  if (normalizationCount > 0) {
    notes.push(
      'The dark palette ramp needed structural normalization before the theme could be applied safely.',
    );
  }

  if (!finalEvaluation.passesSupportPairings) {
    notes.push(
      'Support text still falls below the target threshold on at least one supporting surface.',
    );
  }

  return notes;
}

function createComplianceResult(
  source: EnsureThemeComplianceOptions['source'],
  theme: StyleTransferThemeRecord,
  initialAnalysis: StyleTransferAccessibilityAnalysis,
  adjustments: StyleTransferThemeComplianceAdjustment[],
  evaluation: StyleTransferThemeComplianceEvaluation,
) {
  const status = resolveComplianceStatus(adjustments);
  const failingPairings = [
    ...evaluation.failingCorePairings,
    ...evaluation.failingSupportPairings,
  ];

  return {
    adjustments,
    analysis: evaluation.analysis,
    failureMessage: evaluation.passesRequiredPairings
      ? null
      : createFailureMessage(failingPairings),
    failingCorePairings: evaluation.failingCorePairings,
    failingSupportPairings: evaluation.failingSupportPairings,
    initialAnalysis,
    notes: createComplianceNotes(source, status, adjustments, evaluation),
    passesCorePairings: evaluation.passesCorePairings,
    passesRequiredPairings: evaluation.passesRequiredPairings,
    passesSupportPairings: evaluation.passesSupportPairings,
    status,
    theme,
  } satisfies StyleTransferThemeComplianceResult;
}

export function evaluateStyleTransferThemeCompliance(
  theme: StyleTransferThemeRecord,
): StyleTransferThemeComplianceEvaluation {
  const analysis = analyzeStyleTransferThemeAccessibility(theme);
  const failingCorePairings = getFailingCorePairings(analysis);
  const failingSupportPairings = getFailingSupportPairings(analysis);
  const passesCorePairings = failingCorePairings.length === 0;
  const passesSupportPairings = failingSupportPairings.length === 0;

  return {
    analysis,
    failingCorePairings,
    failingSupportPairings,
    passesCorePairings,
    passesRequiredPairings: passesCorePairings && passesSupportPairings,
    passesSupportPairings,
    status: passesCorePairings && passesSupportPairings ? 'pass' : 'reject',
  };
}

function ensureStyleTransferThemeCompliance(
  theme: StyleTransferThemeRecord,
  options: EnsureThemeComplianceOptions,
) {
  const candidateTheme = cloneTheme(theme);
  const adjustments: StyleTransferThemeComplianceAdjustment[] = [];

  deriveSupportSurfacePalette(
    candidateTheme,
    adjustments,
    ['light', 'dark'],
    'derivation',
  );
  deriveMutedPalette(candidateTheme, adjustments, ['light', 'dark']);

  let repairedTheme = styleTransferThemeRecordSchema.parse(candidateTheme);
  const initialEvaluation = evaluateStyleTransferThemeCompliance(repairedTheme);

  if (initialEvaluation.passesRequiredPairings) {
    return createComplianceResult(
      options.source,
      repairedTheme,
      initialEvaluation.analysis,
      adjustments,
      initialEvaluation,
    );
  }

  const hasDarkCoreFailure = initialEvaluation.failingCorePairings.some(
    (pairing) => !pairing.passesDark,
  );

  if (hasDarkCoreFailure) {
    normalizePromptDarkStructure(candidateTheme, adjustments);
  }

  repairReadableForegroundRoles(
    candidateTheme,
    adjustments,
    [repairableRoleConfigs[0]!],
    ['light', 'dark'],
  );
  deriveMutedPalette(candidateTheme, adjustments, ['light', 'dark']);
  repairReadableForegroundRoles(
    candidateTheme,
    adjustments,
    [repairableRoleConfigs[1]!],
    ['light', 'dark'],
  );

  repairedTheme = styleTransferThemeRecordSchema.parse(candidateTheme);
  let finalEvaluation = evaluateStyleTransferThemeCompliance(repairedTheme);

  if (finalEvaluation.passesRequiredPairings) {
    return createComplianceResult(
      options.source,
      repairedTheme,
      initialEvaluation.analysis,
      adjustments,
      finalEvaluation,
    );
  }

  applyFallbackDarkMode(candidateTheme, adjustments);
  repairReadableForegroundRoles(
    candidateTheme,
    adjustments,
    repairableRoleConfigs,
    ['dark'],
  );
  deriveMutedPalette(candidateTheme, adjustments, ['dark']);
  repairReadableForegroundRoles(
    candidateTheme,
    adjustments,
    [repairableRoleConfigs[1]!],
    ['dark'],
  );

  repairedTheme = styleTransferThemeRecordSchema.parse(candidateTheme);
  finalEvaluation = evaluateStyleTransferThemeCompliance(repairedTheme);

  return createComplianceResult(
    options.source,
    repairedTheme,
    initialEvaluation.analysis,
    adjustments,
    finalEvaluation,
  );
}

export function ensurePromptStyleTransferThemeCompliance(
  theme: StyleTransferThemeRecord,
) {
  return ensureStyleTransferThemeCompliance(theme, {
    source: 'prompt',
  });
}

export function ensurePresetStyleTransferThemeCompliance(
  theme: StyleTransferThemeRecord,
) {
  return ensureStyleTransferThemeCompliance(theme, {
    source: 'preset',
  });
}
