import {
  analyzeStyleTransferThemeAccessibility,
  contrastRatio,
  type StyleTransferAccessibilityAnalysis,
} from './accessibility';
import type { StyleTransferThemeRecord } from './schema';

export const styleTransferThemeQualityThreshold = 72;

export type StyleTransferThemeQualityResult = {
  score: number;
  threshold: number;
  passes: boolean;
  metrics: {
    accentDistinctness: number;
    darkStructure: number;
    mutedReadability: number;
    surfaceSeparation: number;
  };
  notes: string[];
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreRange(value: number, minimum: number, ideal: number) {
  if (value <= 0) {
    return 0;
  }

  if (value <= minimum) {
    return clampScore((value / minimum) * 40);
  }

  if (value >= ideal) {
    return 100;
  }

  const normalized = (value - minimum) / (ideal - minimum);

  return clampScore(40 + normalized * 60);
}

function evaluateMutedReadability(
  analysis: StyleTransferAccessibilityAnalysis,
) {
  const mutedPairings = analysis.supportPairings.filter(
    (pairing) => pairing.foregroundRole === 'muted',
  );
  const minimumContrast = Math.min(
    ...mutedPairings.flatMap((pairing) => [pairing.light, pairing.dark]),
  );

  return scoreRange(minimumContrast, 4.5, 7);
}

function evaluateSurfaceSeparation(theme: StyleTransferThemeRecord) {
  const lightSeparation = Math.min(
    contrastRatio(
      theme.palette.backgroundAlt.light,
      theme.palette.background.light,
    ),
    contrastRatio(
      theme.palette.surfacePaper.light,
      theme.palette.background.light,
    ),
    contrastRatio(theme.palette.surface.light, theme.palette.background.light),
    contrastRatio(
      theme.palette.surfaceStrong.light,
      theme.palette.surface.light,
    ),
  );
  const darkSeparation = Math.min(
    contrastRatio(
      theme.palette.backgroundAlt.dark,
      theme.palette.background.dark,
    ),
    contrastRatio(
      theme.palette.surfacePaper.dark,
      theme.palette.background.dark,
    ),
    contrastRatio(theme.palette.surface.dark, theme.palette.background.dark),
    contrastRatio(theme.palette.surfaceStrong.dark, theme.palette.surface.dark),
  );

  return scoreRange(Math.min(lightSeparation, darkSeparation), 1.04, 1.22);
}

function evaluateDarkStructure(theme: StyleTransferThemeRecord) {
  const roles = [
    'background',
    'backgroundAlt',
    'surfacePaper',
    'surface',
    'surfaceStrong',
  ] as const;
  const luminances = roles.map((role) => {
    const hex = theme.palette[role].dark.replace('#', '');
    const r = Number.parseInt(hex.slice(0, 2), 16) / 255;
    const g = Number.parseInt(hex.slice(2, 4), 16) / 255;
    const b = Number.parseInt(hex.slice(4, 6), 16) / 255;

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  });
  const orderedPairs = [
    luminances[1] > luminances[0],
    luminances[2] >= luminances[0],
    luminances[3] > luminances[2],
    luminances[4] > luminances[3],
    contrastRatio(theme.palette.surface.dark, theme.palette.background.dark) >=
      1.08,
    contrastRatio(
      theme.palette.surfaceStrong.dark,
      theme.palette.background.dark,
    ) >= 1.16,
    contrastRatio(theme.palette.text.dark, theme.palette.surfaceStrong.dark) >=
      4.5,
  ];

  return clampScore(
    (orderedPairs.filter(Boolean).length / orderedPairs.length) * 100,
  );
}

function evaluateAccentDistinctness(theme: StyleTransferThemeRecord) {
  const minimumBackgroundContrast = Math.min(
    contrastRatio(theme.palette.accent.light, theme.palette.background.light),
    contrastRatio(theme.palette.accent.dark, theme.palette.background.dark),
    contrastRatio(theme.palette.accent.light, theme.palette.surface.light),
    contrastRatio(theme.palette.accent.dark, theme.palette.surface.dark),
  );
  const minimumTextContrast = Math.min(
    contrastRatio(theme.palette.accent.light, theme.palette.text.light),
    contrastRatio(theme.palette.accent.dark, theme.palette.text.dark),
    contrastRatio(theme.palette.accent.light, theme.palette.muted.light),
    contrastRatio(theme.palette.accent.dark, theme.palette.muted.dark),
  );

  return clampScore(
    scoreRange(minimumBackgroundContrast, 2, 3.6) * 0.6 +
      scoreRange(minimumTextContrast, 1.15, 1.65) * 0.4,
  );
}

export function evaluateStyleTransferThemeQuality(
  theme: StyleTransferThemeRecord,
  analysis = analyzeStyleTransferThemeAccessibility(theme),
): StyleTransferThemeQualityResult {
  const mutedReadability = evaluateMutedReadability(analysis);
  const surfaceSeparation = evaluateSurfaceSeparation(theme);
  const darkStructure = evaluateDarkStructure(theme);
  const accentDistinctness = evaluateAccentDistinctness(theme);
  const score = clampScore(
    mutedReadability * 0.35 +
      surfaceSeparation * 0.25 +
      darkStructure * 0.2 +
      accentDistinctness * 0.2,
  );
  const notes: string[] = [];

  if (mutedReadability < 70) {
    notes.push(
      'Support text is still too close to the readability floor on one or more surfaces.',
    );
  }

  if (surfaceSeparation < 70) {
    notes.push(
      'Surface layers are still too compressed, so sections and cards may read as flat.',
    );
  }

  if (darkStructure < 70) {
    notes.push(
      'The dark palette ramp is still weak, which can make elevated layers feel muddy.',
    );
  }

  if (accentDistinctness < 70) {
    notes.push(
      'Accent colors are not pulling far enough away from surrounding text and surfaces.',
    );
  }

  return {
    metrics: {
      accentDistinctness,
      darkStructure,
      mutedReadability,
      surfaceSeparation,
    },
    notes,
    passes: score >= styleTransferThemeQualityThreshold,
    score,
    threshold: styleTransferThemeQualityThreshold,
  };
}
