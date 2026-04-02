import type { StyleTransferAccessibilityAnalysis } from './accessibility';
import type { StyleTransferArtworkPreview } from './artwork';
import type {
  StyleTransferThemeComplianceEvaluation,
  StyleTransferThemeComplianceResult,
} from './compliance';
import type { StyleTransferApplication } from './deriveTheme';
import type {
  StyleTransferModelOutput,
  StyleTransferThemeRecord,
} from './schema';

let styleTransferTraceCounter = 0;

export type StyleTransferTraceSource = 'prompt' | 'preset';

export type StyleTransferTraceStageId =
  | 'prompt'
  | 'response'
  | 'validation'
  | 'derivation'
  | 'application'
  | 'artwork'
  | 'accessibility';

export type StyleTransferTraceStageType =
  | 'input'
  | 'response'
  | 'validation'
  | 'derivation'
  | 'application'
  | 'artwork'
  | 'accessibility';

export type StyleTransferTraceStageStatus =
  | 'complete'
  | 'synthetic'
  | 'applied'
  | 'informational';

export type StyleTransferTraceFact = {
  label: string;
  value: string;
};

export type StyleTransferTraceDataView =
  | {
      id: string;
      kind: 'json' | 'text';
      label: string;
      value: unknown;
    }
  | {
      id: string;
      kind: 'list';
      label: string;
      value: string[];
    }
  | {
      id: string;
      kind: 'pairs';
      label: string;
      value: StyleTransferTraceFact[];
    };

export type StyleTransferTraceStage = {
  id: StyleTransferTraceStageId;
  type: StyleTransferTraceStageType;
  status: StyleTransferTraceStageStatus;
  title: string;
  summary: string;
  facts: StyleTransferTraceFact[];
  data?: {
    highlight?: string;
    notes?: string[];
    views?: StyleTransferTraceDataView[];
  };
  dependsOn?: StyleTransferTraceStageId[];
};

export type StyleTransferTrace = {
  traceVersion: '1';
  traceId: string;
  source: StyleTransferTraceSource;
  themeId: string;
  themeName: string;
  createdAt: string;
  stages: StyleTransferTraceStage[];
};

type PromptTraceInput = {
  accessibility: StyleTransferAccessibilityAnalysis;
  apiPrompt: string;
  application: StyleTransferApplication;
  artwork: StyleTransferArtworkPreview | null;
  compliance: StyleTransferThemeComplianceResult;
  prompt: string;
  responseArtwork: unknown;
  responseTheme: StyleTransferModelOutput;
  themeRecord: StyleTransferThemeRecord;
};

type PresetTraceInput = {
  accessibility: StyleTransferAccessibilityAnalysis;
  application: StyleTransferApplication;
  artwork: StyleTransferArtworkPreview | null;
  compliance: StyleTransferThemeComplianceEvaluation;
  theme: StyleTransferThemeRecord;
};

type RestoredPromptTraceInput = {
  accessibility: StyleTransferAccessibilityAnalysis;
  application: StyleTransferApplication;
  artwork: StyleTransferArtworkPreview | null;
  generatedTheme: {
    id: string;
    name: string;
    prompt: string | null;
  };
};

function createTraceId(themeId: string) {
  styleTransferTraceCounter += 1;

  return `${themeId}-${Date.now().toString(36)}-${styleTransferTraceCounter.toString(36)}`;
}

function formatEnumLabel(value: string) {
  if (!value) {
    return value;
  }

  return value
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function countArtworkSlots(value: unknown) {
  if (!value || typeof value !== 'object') {
    return 0;
  }

  return Object.values(value as Record<string, unknown>).filter(Boolean).length;
}

function createApplicationPreview(application: StyleTransferApplication) {
  const tokenEntries = Object.entries(application.cssVars);
  const tokenGroups = [
    {
      label: 'Color roles',
      count: tokenEntries.filter(([key]) => key.startsWith('--color-')).length,
    },
    {
      label: 'Typography',
      count: tokenEntries.filter(([key]) => key.startsWith('--font-')).length,
    },
    {
      label: 'Layout',
      count: tokenEntries.filter(
        ([key]) =>
          key.startsWith('--space-') ||
          key.startsWith('--radius-') ||
          key === '--container-width' ||
          key === '--content-width',
      ).length,
    },
    {
      label: 'Surface + controls',
      count: tokenEntries.filter(
        ([key]) =>
          key.startsWith('--surface-') ||
          key.startsWith('--button-') ||
          key.startsWith('--control-') ||
          key.startsWith('--panel-') ||
          key.startsWith('--site-header-'),
      ).length,
    },
    {
      label: 'Motion + pattern',
      count: tokenEntries.filter(
        ([key]) =>
          key.startsWith('--site-motion-') ||
          key.startsWith('--site-pattern-') ||
          key.startsWith('--site-overlay-') ||
          key.startsWith('--site-noise-') ||
          key === '--surface-hover-translate-y',
      ).length,
    },
  ];

  return {
    dataset: Object.entries(application.dataset).map(([key, value]) => ({
      label: key,
      value,
    })),
    tokenGroups: tokenGroups.map((group) => ({
      label: group.label,
      value: `${group.count}`,
    })),
    tokenPreview: {
      '--color-background': application.cssVars['--color-background'],
      '--color-text': application.cssVars['--color-text'],
      '--color-accent': application.cssVars['--color-accent'],
      '--font-sans': application.cssVars['--font-sans'],
      '--surface-card-background':
        application.cssVars['--surface-card-background'],
      '--button-primary-background':
        application.cssVars['--button-primary-background'],
      '--site-motion-medium': application.cssVars['--site-motion-medium'],
      '--site-pattern-line-size':
        application.cssVars['--site-pattern-line-size'],
    },
  };
}

function createArtworkFacts(artwork: StyleTransferArtworkPreview | null) {
  if (!artwork) {
    return [
      {
        label: 'Artwork',
        value: 'No artwork preview',
      },
    ];
  }

  return [
    {
      label: 'Source',
      value: formatEnumLabel(artwork.source),
    },
    {
      label: 'Family',
      value: formatEnumLabel(artwork.spec.family),
    },
    {
      label: 'Usage',
      value: formatEnumLabel(artwork.spec.usage),
    },
    {
      label: 'Slot',
      value: artwork.slotKey,
    },
  ];
}

function createAccessibilityFacts(
  accessibility: StyleTransferAccessibilityAnalysis,
) {
  const textOnBackground = accessibility.pairings.find(
    (pairing) => pairing.id === 'text-on-background',
  );
  const mutedOnSurface = accessibility.pairings.find(
    (pairing) => pairing.id === 'muted-on-surface',
  );
  const accentStrongOnBackground = accessibility.pairings.find(
    (pairing) => pairing.id === 'accent-strong-on-background',
  );
  const focusOnSurface = accessibility.pairings.find(
    (pairing) => pairing.id === 'focus-on-surface',
  );

  return [
    {
      label: 'Core pairings',
      value: `${accessibility.corePassCount} / ${accessibility.coreTotal} pass`,
    },
    {
      label: 'Text / background',
      value: `${textOnBackground?.light.toFixed(2) ?? '--'} / ${
        textOnBackground?.dark.toFixed(2) ?? '--'
      }`,
    },
    {
      label: 'Muted / surface',
      value: `${mutedOnSurface?.light.toFixed(2) ?? '--'} / ${
        mutedOnSurface?.dark.toFixed(2) ?? '--'
      }`,
    },
    {
      label: 'Accent strong / background',
      value: `${accentStrongOnBackground?.light.toFixed(2) ?? '--'} / ${
        accentStrongOnBackground?.dark.toFixed(2) ?? '--'
      }`,
    },
    {
      label: 'Focus / surface',
      value: `${focusOnSurface?.light.toFixed(2) ?? '--'} / ${
        focusOnSurface?.dark.toFixed(2) ?? '--'
      }`,
    },
  ];
}

function formatComplianceStatus(
  compliance:
    | StyleTransferThemeComplianceEvaluation
    | StyleTransferThemeComplianceResult,
) {
  if (compliance.status === 'repaired') {
    return 'Repaired';
  }

  if (compliance.status === 'normalized') {
    return 'Dark mode normalized';
  }

  if (compliance.status === 'reject') {
    return 'Rejected';
  }

  return 'Passed';
}

function createBaseTrace(
  source: StyleTransferTraceSource,
  themeId: string,
  themeName: string,
) {
  return {
    createdAt: new Date().toISOString(),
    source,
    themeId,
    themeName,
    traceId: createTraceId(themeId),
    traceVersion: '1' as const,
  };
}

export function createRestoredPromptStyleTransferTrace({
  accessibility,
  application,
  artwork,
  generatedTheme,
}: RestoredPromptTraceInput): StyleTransferTrace {
  const applicationPreview = createApplicationPreview(application);

  return {
    ...createBaseTrace('prompt', generatedTheme.id, generatedTheme.name),
    stages: [
      {
        id: 'prompt',
        type: 'input',
        status: 'complete',
        title: 'Starting point',
        summary:
          'This generated theme was restored from compact client history, so the original prompt remains available even though the full live remix session is no longer in memory.',
        facts: [
          {
            label: 'Input path',
            value: 'Prompt remix',
          },
          {
            label: 'Trace mode',
            value: 'Restored from history',
          },
          {
            label: 'Prompt',
            value: generatedTheme.prompt ? 'Retained' : 'Unavailable',
          },
        ],
        data: generatedTheme.prompt
          ? {
              highlight: generatedTheme.prompt,
            }
          : {
              notes: [
                'The compact history entry kept the accepted runtime application, but not the original prompt text.',
              ],
            },
      },
      {
        id: 'response',
        type: 'response',
        status: 'synthetic',
        title: 'Theme setup',
        summary:
          'Raw model response JSON is intentionally ephemeral. This restored view uses the accepted generated-theme summary and runtime application preserved in client history.',
        facts: [
          {
            label: 'Theme name',
            value: generatedTheme.name,
          },
          {
            label: 'Response payload',
            value: 'Not persisted',
          },
          {
            label: 'History record',
            value: 'Compact runtime summary',
          },
        ],
        data: {
          views: [
            {
              id: 'restored-generated-summary',
              kind: 'json',
              label: 'Restored generated theme',
              value: {
                id: generatedTheme.id,
                name: generatedTheme.name,
                prompt: generatedTheme.prompt,
              },
            },
          ],
        },
        dependsOn: ['prompt'],
      },
      {
        id: 'validation',
        type: 'validation',
        status: 'synthetic',
        title: 'Quick checks',
        summary:
          'The response was checked locally before the theme was allowed onto the page.',
        facts: [
          {
            label: 'Replay mode',
            value: 'Accepted history record',
          },
          {
            label: 'Core pairings',
            value: `${accessibility.corePassCount} / ${accessibility.coreTotal} pass`,
          },
          {
            label: 'Readability state',
            value:
              accessibility.corePassCount === accessibility.coreTotal
                ? 'Readable'
                : 'Needs review',
          },
        ],
        data: {
          notes: accessibility.notes,
        },
        dependsOn: ['response'],
      },
      {
        id: 'derivation',
        type: 'derivation',
        status: 'complete',
        title: 'How the site tuned it',
        summary:
          'The stored runtime application still exposes the bounded design-system decisions that were derived from the accepted remix.',
        facts: [
          {
            label: 'Density',
            value: formatEnumLabel(
              application.dataset.styleDensity ?? 'unknown',
            ),
          },
          {
            label: 'Surface',
            value: formatEnumLabel(
              application.dataset.styleSurface ?? 'unknown',
            ),
          },
          {
            label: 'Controls',
            value: formatEnumLabel(
              application.dataset.styleButton ?? 'unknown',
            ),
          },
          {
            label: 'Motion + pattern',
            value: `${formatEnumLabel(application.dataset.styleMotion ?? 'unknown')} / ${formatEnumLabel(application.dataset.stylePattern ?? 'unknown')}`,
          },
        ],
        data: {
          views: [
            {
              id: 'compiled-runtime-summary',
              kind: 'json',
              label: 'Compiled runtime summary',
              value: {
                fontSans: application.cssVars['--font-sans'],
                fontSerif: application.cssVars['--font-serif'],
                styleButton: application.dataset.styleButton,
                styleDensity: application.dataset.styleDensity,
                styleMotion: application.dataset.styleMotion,
                stylePattern: application.dataset.stylePattern,
                styleSurface: application.dataset.styleSurface,
              },
            },
          ],
        },
        dependsOn: ['validation'],
      },
      {
        id: 'application',
        type: 'application',
        status: 'applied',
        title: 'What changed',
        summary:
          'The restored generated theme still applies through the same allow-listed CSS variables and dataset flags on <html>.',
        facts: [
          {
            label: 'Target',
            value: '<html>',
          },
          {
            label: 'CSS variables',
            value: `${Object.keys(application.cssVars).length} allow-listed values`,
          },
          {
            label: 'Dataset flags',
            value: `${Object.keys(application.dataset).length} runtime markers`,
          },
          {
            label: 'Theme color',
            value: `${application.themeColor.light} / ${application.themeColor.dark}`,
          },
        ],
        data: {
          views: [
            {
              id: 'token-groups',
              kind: 'pairs',
              label: 'Token groups',
              value: applicationPreview.tokenGroups,
            },
            {
              id: 'runtime-flags',
              kind: 'pairs',
              label: 'Runtime flags',
              value: applicationPreview.dataset,
            },
            {
              id: 'token-preview',
              kind: 'json',
              label: 'Selected CSS variables',
              value: applicationPreview.tokenPreview,
            },
          ],
        },
        dependsOn: ['derivation'],
      },
      {
        id: 'artwork',
        type: 'artwork',
        status: artwork?.source === 'fallback' ? 'synthetic' : 'complete',
        title: 'Background art',
        summary: artwork
          ? artwork.source === 'api'
            ? 'The stored history entry kept the structured artwork preview, so the restored trace still points at the deterministic SVG renderer.'
            : 'The restored trace uses the same deterministic artwork path as the original remix session.'
          : 'This generated theme did not resolve to a preview artwork.',
        facts: createArtworkFacts(artwork),
        data: artwork
          ? {
              views: [
                {
                  id: 'artwork-summary',
                  kind: 'json',
                  label: 'Artwork summary',
                  value: {
                    blendStyle: artwork.spec.blendStyle,
                    colorBinding: artwork.spec.colorBinding,
                    family: artwork.spec.family,
                    motionStyle: artwork.spec.motionStyle,
                    slotKey: artwork.slotKey,
                    source: artwork.source,
                    usage: artwork.spec.usage,
                  },
                },
              ],
            }
          : undefined,
        dependsOn: ['application'],
      },
      {
        id: 'accessibility',
        type: 'accessibility',
        status: 'informational',
        title: 'Contrast and readability',
        summary:
          'These notes come from the restored runtime palette and stay informational in v1.',
        facts: createAccessibilityFacts(accessibility),
        data: {
          notes: accessibility.notes,
          views: [
            {
              id: 'pairings',
              kind: 'json',
              label: 'Contrast pairings',
              value: accessibility.pairings,
            },
          ],
        },
        dependsOn: ['application'],
      },
    ],
  };
}

export function createPromptStyleTransferTrace({
  accessibility,
  application,
  artwork,
  compliance,
  prompt,
  responseArtwork,
  responseTheme,
  themeRecord,
}: PromptTraceInput): StyleTransferTrace {
  const applicationPreview = createApplicationPreview(application);

  return {
    ...createBaseTrace('prompt', themeRecord.id, themeRecord.name),
    stages: [
      {
        id: 'prompt',
        type: 'input',
        status: 'complete',
        title: 'Starting point',
        summary:
          'A short natural-language brief set the visual direction while keeping the output constrained to the site theme contract.',
        facts: [
          {
            label: 'Input path',
            value: 'Prompt remix',
          },
          {
            label: 'Original length',
            value: `${prompt.length} chars`,
          },
        ],
        data: {
          highlight: prompt,
        },
      },
      {
        id: 'response',
        type: 'response',
        status: 'complete',
        title: 'Theme setup',
        summary:
          'The remix API returned a typed theme proposal and optional artwork slots. The proposal is then normalized locally before application rather than turning directly into runtime CSS.',
        facts: [
          {
            label: 'Model-proposed name',
            value: responseTheme.styleName,
          },
          {
            label: 'Palette',
            value: '11 semantic roles',
          },
          {
            label: 'Fonts',
            value: `${formatEnumLabel(responseTheme.fonts.sans)} / ${formatEnumLabel(responseTheme.fonts.serif)}`,
          },
          {
            label: 'Artwork slots',
            value: `${countArtworkSlots(responseArtwork)}`,
          },
        ],
        data: {
          views: [
            {
              id: 'theme-response',
              kind: 'json',
              label: 'Model response JSON',
              value: responseTheme,
            },
            ...(countArtworkSlots(responseArtwork) > 0
              ? [
                  {
                    id: 'artwork-response',
                    kind: 'json' as const,
                    label: 'Artwork response',
                    value: responseArtwork,
                  },
                ]
              : []),
          ],
        },
        dependsOn: ['prompt'],
      },
      {
        id: 'validation',
        type: 'validation',
        status: 'complete',
        title: 'Quick checks',
        summary:
          'The proposal was rebuilt and validated locally. Support surfaces and muted text were normalized from the palette rules, then readability was checked across backgrounds.',
        facts: [
          {
            label: 'Theme schema',
            value: 'Accepted',
          },
          {
            label: 'Readability',
            value: formatComplianceStatus(compliance),
          },
          {
            label: 'Palette roles',
            value: '11 dual-mode pairs',
          },
          {
            label: 'Predefined options',
            value: `${responseTheme.density}, ${responseTheme.surfaceStyle}, ${responseTheme.buttonStyle}, ${responseTheme.pattern}, ${responseTheme.motion}`,
          },
        ],
        data: {
          notes: [
            ...compliance.notes,
            'If a generated theme is readable but still weak on contrast or support-text quality, the system can retry once or more, then apply the strongest result.',
          ],
          views: [
            {
              id: 'validated-theme',
              kind: 'json',
              label: 'Accepted theme summary',
              value: {
                density: responseTheme.density,
                fonts: responseTheme.fonts,
                motion: responseTheme.motion,
                pattern: responseTheme.pattern,
                styleName: responseTheme.styleName,
                surfaceStyle: responseTheme.surfaceStyle,
              },
            },
            ...(compliance.adjustments.length
              ? [
                  {
                    id: 'semantic-repairs',
                    kind: 'pairs' as const,
                    label: 'Semantic repairs',
                    value: compliance.adjustments.map((adjustment) => ({
                      label: `${adjustment.mode} ${adjustment.role}`,
                      value: `${adjustment.from} -> ${adjustment.to}`,
                    })),
                  },
                ]
              : []),
          ],
        },
        dependsOn: ['response'],
      },
      {
        id: 'derivation',
        type: 'derivation',
        status: 'complete',
        title: 'How the site tuned it',
        summary:
          'The accepted theme was compiled into the site design using semantic colors, type stacks, spacing, surfaces, controls, motion, and pattern tokens.',
        facts: [
          {
            label: 'Applied name',
            value: themeRecord.name,
          },
          {
            label: 'Fonts',
            value: `${formatEnumLabel(themeRecord.fonts.sans)} / ${formatEnumLabel(themeRecord.fonts.serif)}`,
          },
          {
            label: 'Density',
            value: formatEnumLabel(themeRecord.density),
          },
          {
            label: 'Surface',
            value: formatEnumLabel(themeRecord.surfaceStyle),
          },
          {
            label: 'Controls',
            value: `${formatEnumLabel(themeRecord.buttonStyle)} / ${formatEnumLabel(themeRecord.radiusProfile ?? 'balanced')}`,
          },
          {
            label: 'Motion + pattern',
            value: `${formatEnumLabel(themeRecord.motion)} / ${formatEnumLabel(themeRecord.pattern)}`,
          },
        ],
        data: {
          views: [
            {
              id: 'derived-theme',
              kind: 'json',
              label: 'Canonical theme record',
              value: {
                buttonStyle: themeRecord.buttonStyle,
                density: themeRecord.density,
                fonts: themeRecord.fonts,
                id: themeRecord.id,
                motion: themeRecord.motion,
                name: themeRecord.name,
                pattern: themeRecord.pattern,
                radiusProfile: themeRecord.radiusProfile,
                source: themeRecord.source,
                surfaceStyle: themeRecord.surfaceStyle,
              },
            },
          ],
        },
        dependsOn: ['validation'],
      },
      {
        id: 'application',
        type: 'application',
        status: 'applied',
        title: 'What changed',
        summary:
          'Only approved CSS variables and dataset flags are applied to <html>, keeping the theming system controlled and predictable.',
        facts: [
          {
            label: 'Target',
            value: '<html>',
          },
          {
            label: 'CSS variables',
            value: `${Object.keys(application.cssVars).length} allowed values`,
          },
          {
            label: 'Dataset flags',
            value: `${Object.keys(application.dataset).length} allowed values`,
          },
          {
            label: 'Theme color',
            value: `${application.themeColor.light} / ${application.themeColor.dark}`,
          },
        ],
        data: {
          views: [
            {
              id: 'token-groups',
              kind: 'pairs',
              label: 'Token groups',
              value: applicationPreview.tokenGroups,
            },
            {
              id: 'runtime-flags',
              kind: 'pairs',
              label: 'Runtime flags',
              value: applicationPreview.dataset,
            },
            {
              id: 'token-preview',
              kind: 'json',
              label: 'Selected CSS variables',
              value: applicationPreview.tokenPreview,
            },
          ],
        },
        dependsOn: ['derivation'],
      },
      {
        id: 'artwork',
        type: 'artwork',
        status: artwork?.source === 'fallback' ? 'synthetic' : 'complete',
        title: 'Background art',
        summary: artwork
          ? artwork.source === 'api'
            ? 'The active hero artwork comes from the structured artwork response.'
            : artwork.source === 'fallback'
              ? 'Artwork fell back to the local generator, using the accepted theme and prompt.'
              : 'The preset ships with a deterministic artwork preview that stays inside the same rendering system.'
          : 'This theme did not resolve to a preview artwork.',
        facts: createArtworkFacts(artwork),
        data: artwork
          ? {
              views: [
                {
                  id: 'artwork-summary',
                  kind: 'json',
                  label: 'Artwork summary',
                  value: {
                    blendStyle: artwork.spec.blendStyle,
                    colorBinding: artwork.spec.colorBinding,
                    family: artwork.spec.family,
                    motionStyle: artwork.spec.motionStyle,
                    slotKey: artwork.slotKey,
                    source: artwork.source,
                    usage: artwork.spec.usage,
                  },
                },
              ],
            }
          : undefined,
        dependsOn: ['application'],
      },
      {
        id: 'accessibility',
        type: 'accessibility',
        status: 'informational',
        title: 'Contrast and readability',
        summary:
          'These notes are informational only. They help explain readability and motion behavior without mutating the applied theme.',
        facts: createAccessibilityFacts(accessibility),
        data: {
          notes: accessibility.notes,
          views: [
            {
              id: 'pairings',
              kind: 'json',
              label: 'Contrast pairings',
              value: accessibility.pairings,
            },
          ],
        },
        dependsOn: ['application'],
      },
    ],
  };
}

export function createPresetStyleTransferTrace({
  accessibility,
  application,
  artwork,
  compliance,
  theme,
}: PresetTraceInput): StyleTransferTrace {
  const applicationPreview = createApplicationPreview(application);

  return {
    ...createBaseTrace('preset', theme.id, theme.name),
    stages: [
      {
        id: 'prompt',
        type: 'input',
        status: 'synthetic',
        title: 'Starting point',
        summary:
          'This starts from a local preset and runs through the same shared theme system as every other theme.',
        facts: [
          {
            label: 'Input path',
            value: 'Local preset',
          },
          {
            label: 'Network',
            value: 'No request',
          },
        ],
        data: theme.prompt
          ? {
              highlight: theme.prompt,
            }
          : undefined,
      },
      {
        id: 'response',
        type: 'response',
        status: 'synthetic',
        title: 'Theme setup',
        summary:
          'The selected preset already exists as structured theme data in the local catalog, so the response stage is a zero-fetch local equivalent.',
        facts: [
          {
            label: 'Theme name',
            value: theme.name,
          },
          {
            label: 'Palette',
            value: '11 semantic roles',
          },
          {
            label: 'Fonts',
            value: `${formatEnumLabel(theme.fonts.sans)} / ${formatEnumLabel(theme.fonts.serif)}`,
          },
          {
            label: 'Source',
            value: 'Local catalog',
          },
        ],
        data: {
          views: [
            {
              id: 'preset-record',
              kind: 'json',
              label: 'Preset record',
              value: {
                buttonStyle: theme.buttonStyle,
                density: theme.density,
                fonts: theme.fonts,
                id: theme.id,
                motion: theme.motion,
                name: theme.name,
                pattern: theme.pattern,
                prompt: theme.prompt,
                radiusProfile: theme.radiusProfile,
                surfaceStyle: theme.surfaceStyle,
              },
            },
          ],
        },
        dependsOn: ['prompt'],
      },
      {
        id: 'validation',
        type: 'validation',
        status: 'complete',
        title: 'Quick checks',
        summary:
          'The response was checked locally before the theme was allowed onto the page.',
        facts: [
          {
            label: 'Catalog schema',
            value: 'Accepted',
          },
          {
            label: 'Readability gate',
            value: formatComplianceStatus(compliance),
          },
          {
            label: 'Preset source',
            value: 'Build-time JSON',
          },
          {
            label: 'Runtime mode',
            value: 'Zero fetch',
          },
        ],
        data: {
          notes: compliance.analysis.notes,
          views: [
            {
              id: 'validation-summary',
              kind: 'pairs',
              label: 'Accepted preset contract',
              value: [
                {
                  label: 'Palette roles',
                  value: '11 dual-mode pairs',
                },
                {
                  label: 'Fonts',
                  value: 'Bounded enums',
                },
                {
                  label: 'Motion + pattern',
                  value: 'Bounded enums',
                },
              ],
            },
          ],
        },
        dependsOn: ['response'],
      },
      {
        id: 'derivation',
        type: 'derivation',
        status: 'complete',
        title: 'How the site tuned it',
        summary:
          'The preset is shaped by the same system as a prompt remix, so both paths use the same underlying model.',
        facts: [
          {
            label: 'Fonts',
            value: `${formatEnumLabel(theme.fonts.sans)} / ${formatEnumLabel(theme.fonts.serif)}`,
          },
          {
            label: 'Density',
            value: formatEnumLabel(theme.density),
          },
          {
            label: 'Surface',
            value: formatEnumLabel(theme.surfaceStyle),
          },
          {
            label: 'Controls',
            value: `${formatEnumLabel(theme.buttonStyle)} / ${formatEnumLabel(theme.radiusProfile ?? 'balanced')}`,
          },
          {
            label: 'Motion + pattern',
            value: `${formatEnumLabel(theme.motion)} / ${formatEnumLabel(theme.pattern)}`,
          },
        ],
        data: {
          views: [
            {
              id: 'preset-theme',
              kind: 'json',
              label: 'Compiled theme summary',
              value: {
                buttonStyle: theme.buttonStyle,
                density: theme.density,
                fonts: theme.fonts,
                motion: theme.motion,
                pattern: theme.pattern,
                radiusProfile: theme.radiusProfile,
                surfaceStyle: theme.surfaceStyle,
              },
            },
          ],
        },
        dependsOn: ['validation'],
      },
      {
        id: 'application',
        type: 'application',
        status: 'applied',
        title: 'What changed',
        summary:
          'The preset resolves to the same allow-listed CSS variables and dataset flags that drive prompt remixes, then applies them to <html>.',
        facts: [
          {
            label: 'Target',
            value: '<html>',
          },
          {
            label: 'CSS variables',
            value: `${Object.keys(application.cssVars).length} allow-listed values`,
          },
          {
            label: 'Dataset flags',
            value: `${Object.keys(application.dataset).length} runtime markers`,
          },
          {
            label: 'Theme color',
            value: `${application.themeColor.light} / ${application.themeColor.dark}`,
          },
        ],
        data: {
          views: [
            {
              id: 'token-groups',
              kind: 'pairs',
              label: 'Token groups',
              value: applicationPreview.tokenGroups,
            },
            {
              id: 'runtime-flags',
              kind: 'pairs',
              label: 'Runtime flags',
              value: applicationPreview.dataset,
            },
            {
              id: 'token-preview',
              kind: 'json',
              label: 'Selected CSS variables',
              value: applicationPreview.tokenPreview,
            },
          ],
        },
        dependsOn: ['derivation'],
      },
      {
        id: 'artwork',
        type: 'artwork',
        status: 'complete',
        title: 'Background art',
        summary: artwork
          ? 'Preset artwork uses the same rendering path as remixes, keeping visuals inside the bounded system.'
          : 'This preset did not resolve to a preview artwork.',
        facts: createArtworkFacts(artwork),
        data: artwork
          ? {
              views: [
                {
                  id: 'artwork-summary',
                  kind: 'json',
                  label: 'Artwork summary',
                  value: {
                    blendStyle: artwork.spec.blendStyle,
                    colorBinding: artwork.spec.colorBinding,
                    family: artwork.spec.family,
                    motionStyle: artwork.spec.motionStyle,
                    slotKey: artwork.slotKey,
                    source: artwork.source,
                    usage: artwork.spec.usage,
                  },
                },
              ],
            }
          : undefined,
        dependsOn: ['application'],
      },
      {
        id: 'accessibility',
        type: 'accessibility',
        status: 'informational',
        title: 'Contrast and readability',
        summary:
          'Local context on contrast, readability, and theme fit. No preset changes were made.',
        facts: createAccessibilityFacts(accessibility),
        data: {
          notes: accessibility.notes,
          views: [
            {
              id: 'pairings',
              kind: 'json',
              label: 'Contrast pairings',
              value: accessibility.pairings,
            },
          ],
        },
        dependsOn: ['application'],
      },
    ],
  };
}
