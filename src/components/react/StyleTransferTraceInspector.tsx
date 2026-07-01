import { memo, useEffect, useMemo, useRef, useState } from 'react';

import StyleTransferArtworkSvg from './StyleTransferArtworkSvg';
import ThemeVoronoiSlab from './ThemeVoronoiSlab';
import type { StyleTransferAccessibilityPairing } from '../../lib/style-transfer/accessibility';
import {
  deriveStyleTransferArtworkRenderConfig,
  type StyleTransferArtworkPreview as StyleTransferArtworkPreviewData,
} from '../../lib/style-transfer/artwork';
import type { StyleTransferThemeRecord } from '../../lib/style-transfer/schema';
import type {
  StyleTransferTrace,
  StyleTransferTraceDataView,
  StyleTransferTraceStage,
} from '../../lib/style-transfer/trace';

type StyleTransferTraceInspectorProps = {
  artwork: StyleTransferArtworkPreviewData | null;
  effectiveMode?: 'dark' | 'light';
  palette?: StyleTransferThemeRecord['palette'];
  trace: StyleTransferTrace | null;
};

type ThemeRuntimeSummary = {
  buttonStyle?: string;
  density?: string;
  motion?: string;
  pattern?: string;
  radiusProfile?: string;
  surfaceStyle?: string;
};

type ReceiptRow = {
  label: string;
  value: string;
};

const keyContrastPairIds = [
  'text-on-background',
  'text-on-surface',
  'accent-strong-on-background',
  'focus-on-surface',
] as const;

function isKeyContrastPairId(
  value: string,
): value is (typeof keyContrastPairIds)[number] {
  return (keyContrastPairIds as readonly string[]).includes(value);
}

function formatEnumLabel(value: string | null | undefined) {
  if (!value) {
    return 'Unknown';
  }

  return value
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function getStage(
  trace: StyleTransferTrace,
  id: StyleTransferTraceStage['id'],
) {
  return trace.stages.find((stage) => stage.id === id) ?? null;
}

function getFactValue(stage: StyleTransferTraceStage | null, label: string) {
  return stage?.facts.find((fact) => fact.label === label)?.value ?? null;
}

function getView(
  stage: StyleTransferTraceStage | null,
  viewId: string,
): StyleTransferTraceDataView | null {
  return stage?.data?.views?.find((view) => view.id === viewId) ?? null;
}

function getHighlight(stage: StyleTransferTraceStage | null) {
  return typeof stage?.data?.highlight === 'string'
    ? stage.data.highlight
    : null;
}

function getStageNote(stage: StyleTransferTraceStage | null) {
  return (
    stage?.data?.notes?.find(
      (note): note is string =>
        typeof note === 'string' && note.trim().length > 0,
    ) ?? null
  );
}

function isStringRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isPairingArray(
  value: unknown,
): value is StyleTransferAccessibilityPairing[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isStringRecord(item) &&
        typeof item.id === 'string' &&
        typeof item.label === 'string' &&
        typeof item.foregroundRole === 'string' &&
        typeof item.backgroundRole === 'string' &&
        typeof item.light === 'number' &&
        typeof item.dark === 'number' &&
        typeof item.target === 'number' &&
        typeof item.passesLight === 'boolean' &&
        typeof item.passesDark === 'boolean',
    )
  );
}

function extractThemeRuntimeSummary(
  derivationStage: StyleTransferTraceStage | null,
): ThemeRuntimeSummary {
  const candidateViews = [
    getView(derivationStage, 'derived-theme'),
    getView(derivationStage, 'preset-theme'),
    getView(derivationStage, 'compiled-runtime-summary'),
  ];

  for (const view of candidateViews) {
    if (view?.kind !== 'json' || !isStringRecord(view.value)) {
      continue;
    }

    const viewValue = view.value;

    const readString = (...keys: string[]) => {
      for (const key of keys) {
        const candidate = viewValue[key];

        if (typeof candidate === 'string') {
          return candidate;
        }
      }

      return undefined;
    };

    return {
      buttonStyle: readString('buttonStyle', 'styleButton'),
      density: readString('density', 'styleDensity'),
      motion: readString('motion', 'styleMotion'),
      pattern: readString('pattern', 'stylePattern'),
      radiusProfile: readString('radiusProfile', 'styleRadius'),
      surfaceStyle: readString('surfaceStyle', 'styleSurface'),
    };
  }

  return {};
}

function extractAccessibilityPairings(
  accessibilityStage: StyleTransferTraceStage | null,
) {
  const pairingView = getView(accessibilityStage, 'pairings');

  if (pairingView?.kind !== 'json' || !isPairingArray(pairingView.value)) {
    return [];
  }

  return pairingView.value;
}

function createThemeReceiptRows(trace: StyleTransferTrace) {
  const derivationStage = getStage(trace, 'derivation');
  const runtimeSummary = extractThemeRuntimeSummary(derivationStage);

  return [
    {
      label: 'Surface style',
      value: formatEnumLabel(runtimeSummary.surfaceStyle),
    },
    {
      label: 'Buttons and controls',
      value: `${formatEnumLabel(runtimeSummary.buttonStyle)} / ${formatEnumLabel(
        runtimeSummary.radiusProfile,
      )}`,
    },
    {
      label: 'Density',
      value: formatEnumLabel(runtimeSummary.density),
    },
    {
      label: 'Motion + pattern',
      value: `${formatEnumLabel(runtimeSummary.motion)} / ${formatEnumLabel(
        runtimeSummary.pattern,
      )}`,
    },
  ] satisfies ReceiptRow[];
}

function formatRuntimeCount(value: string | null) {
  if (!value) {
    return 'Not available';
  }

  const match = value.match(/^(\d+)\s+(.*)$/);

  if (!match) {
    return value;
  }

  return `${match[1]} ${match[2]}`;
}

function getContrastCheckTotals(pairings: StyleTransferAccessibilityPairing[]) {
  const relevantPairings = pairings.filter((pairing) =>
    isKeyContrastPairId(pairing.id),
  );

  const passCount = relevantPairings.reduce((count, pairing) => {
    return count + (pairing.passesLight ? 1 : 0) + (pairing.passesDark ? 1 : 0);
  }, 0);

  return {
    passCount,
    totalCount: relevantPairings.length * 2,
  };
}

function createRuntimeRows(
  trace: StyleTransferTrace,
  artwork: StyleTransferArtworkPreviewData | null,
) {
  const applicationStage = getStage(trace, 'application');
  const cssVariableCount = formatRuntimeCount(
    getFactValue(applicationStage, 'CSS variables'),
  );
  const datasetFlagCount = formatRuntimeCount(
    getFactValue(applicationStage, 'Dataset flags'),
  );
  return [
    {
      label: 'Rendering',
      value: artwork
        ? 'HTML + CSS variables + SVG artwork'
        : 'HTML + CSS variables',
    },
    {
      label: 'Theme scope',
      value: `${cssVariableCount} + ${datasetFlagCount} on <html>`,
    },
    {
      label: 'Fallbacks',
      value:
        'The core HTML and CSS stay clear and readable without layered artwork or motion.',
    },
  ] satisfies ReceiptRow[];
}

function createContrastSummaryValue(
  pairings: StyleTransferAccessibilityPairing[],
) {
  const contrastTotals = getContrastCheckTotals(pairings);

  return `${contrastTotals.passCount} / ${contrastTotals.totalCount} key readability checks across light and dark`;
}

function StyleTransferReceiptRows({
  className,
  rows,
}: {
  className?: string;
  rows: ReceiptRow[];
}) {
  return (
    <dl
      className={`style-transfer__trace-receipt-grid${
        className ? ` ${className}` : ''
      }`}
    >
      {rows.map((row) => (
        <div key={row.label} className="style-transfer__trace-receipt-row">
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function StyleTransferContrastReceipt({
  effectiveMode = 'light',
  pairings,
}: {
  effectiveMode?: 'dark' | 'light';
  pairings: StyleTransferAccessibilityPairing[];
}) {
  return (
    <ul
      className="style-transfer__contrast-receipt"
      aria-label="Key contrast checks"
    >
      {pairings
        .filter((pairing) => isKeyContrastPairId(pairing.id))
        .map((pairing) => {
          const ratio = effectiveMode === 'dark' ? pairing.dark : pairing.light;
          const passes =
            effectiveMode === 'dark' ? pairing.passesDark : pairing.passesLight;
          const modeLabel = formatEnumLabel(effectiveMode);

          return (
            <li key={pairing.id} className="style-transfer__contrast-pair">
              <span className="style-transfer__sr-only">
                {`${pairing.label}: ${modeLabel} mode contrast is ${ratio.toFixed(
                  2,
                )}:1 against a target of ${pairing.target.toFixed(1)}:1.`}
              </span>
              <span
                className={`style-transfer__contrast-preview style-transfer__contrast-preview--${pairing.id}`}
                aria-hidden="true"
              >
                {pairing.id === 'focus-on-surface' ? (
                  <>
                    Focus{' '}
                    <span className="style-transfer__contrast-target">
                      on surface
                    </span>
                  </>
                ) : pairing.id === 'accent-strong-on-background' ? (
                  <>
                    Accent strong{' '}
                    <span className="style-transfer__contrast-target">
                      on background
                    </span>
                  </>
                ) : pairing.id === 'text-on-surface' ? (
                  <>
                    Text{' '}
                    <span className="style-transfer__contrast-target">
                      on surface
                    </span>
                  </>
                ) : (
                  <>
                    Text{' '}
                    <span className="style-transfer__contrast-target">
                      on background
                    </span>
                  </>
                )}
              </span>
              <span className="style-transfer__contrast-result">
                <span
                  className={`style-transfer__contrast-badge${
                    passes
                      ? ' style-transfer__contrast-badge--pass'
                      : ' style-transfer__contrast-badge--warn'
                  }`}
                >
                  {passes ? 'Pass' : 'Review'}
                </span>
                <span className="style-transfer__contrast-ratio">
                  {`${ratio.toFixed(2)}:1`}
                </span>
              </span>
            </li>
          );
        })}
    </ul>
  );
}

function StyleTransferArtworkReceiptCard({
  artwork,
}: {
  artwork: StyleTransferArtworkPreviewData | null;
}) {
  const config = useMemo(
    () =>
      artwork ? deriveStyleTransferArtworkRenderConfig(artwork.spec) : null,
    [artwork],
  );

  return (
    <div className="style-transfer__trace-artwork-card">
      <div className="style-transfer__trace-artwork-copy">
        <p className="style-transfer__trace-artwork-label">Background art</p>
        <p className="style-transfer__trace-artwork-value">
          {artwork
            ? formatEnumLabel(artwork.spec.family)
            : 'No artwork preview'}
        </p>
      </div>

      {artwork && config ? (
        <div className="style-transfer__trace-artwork-mini">
          <StyleTransferArtworkSvg
            ariaLabel={`${formatEnumLabel(artwork.spec.family)} background art preview`}
            artwork={artwork}
            className="style-transfer__trace-artwork-mini-svg"
            config={config}
            role="img"
          />
        </div>
      ) : null}
    </div>
  );
}

function StyleTransferTraceInspector({
  artwork,
  effectiveMode,
  palette,
  trace,
}: StyleTransferTraceInspectorProps) {
  const detailsRef = useRef<HTMLDetailsElement | null>(null);
  const summaryRef = useRef<HTMLElement | null>(null);
  const pulseTimeoutRef = useRef<number | null>(null);
  const previousTraceKeyRef = useRef<string | null>(null);
  const dismissedPulseTraceKeyRef = useRef<string | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncPreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    syncPreference();
    mediaQuery.addEventListener('change', syncPreference);

    return () => {
      mediaQuery.removeEventListener('change', syncPreference);
    };
  }, []);

  const traceChangeKey = trace ? `${trace.source}:${trace.themeId}` : null;

  useEffect(() => {
    return () => {
      if (pulseTimeoutRef.current !== null) {
        window.clearTimeout(pulseTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const summary = summaryRef.current;
    const previousTraceKey = previousTraceKeyRef.current;

    if (!summary || !traceChangeKey) {
      previousTraceKeyRef.current = traceChangeKey;
      return;
    }

    const shouldPulse =
      previousTraceKey !== null &&
      previousTraceKey !== traceChangeKey &&
      !prefersReducedMotion &&
      !detailsRef.current?.open &&
      dismissedPulseTraceKeyRef.current !== traceChangeKey;

    previousTraceKeyRef.current = traceChangeKey;

    if (!shouldPulse) {
      summary.dataset.pulse = 'false';
      return;
    }

    summary.dataset.pulse = 'true';

    if (pulseTimeoutRef.current !== null) {
      window.clearTimeout(pulseTimeoutRef.current);
    }

    pulseTimeoutRef.current = window.setTimeout(() => {
      if (summaryRef.current) {
        summaryRef.current.dataset.pulse = 'false';
      }
      pulseTimeoutRef.current = null;
    }, 900);
  }, [prefersReducedMotion, traceChangeKey]);

  if (!trace) {
    return null;
  }

  const promptStage = getStage(trace, 'prompt');
  const derivationStage = getStage(trace, 'derivation');
  const accessibilityStage = getStage(trace, 'accessibility');
  const highlight = getHighlight(promptStage);
  const pairings = extractAccessibilityPairings(accessibilityStage);
  const themeReceiptRows = createThemeReceiptRows(trace);
  const runtimeRows = createRuntimeRows(trace, artwork);
  const receiptSummary =
    derivationStage?.summary ??
    'The active theme is compiled into the same bounded system that shapes the rest of the site.';
  const contrastSummary =
    pairings.length > 0
      ? createContrastSummaryValue(pairings)
      : (accessibilityStage?.summary ??
        'Key readability checks for the active palette and mode.');
  const runtimeSummary =
    'The site applies this theme through CSS variables first, then layers in artwork and motion when the environment supports it.';
  const startingPointNote =
    getStageNote(promptStage) ??
    (trace.source === 'prompt' ? `Generated theme: ${trace.themeName}` : null);
  const startingPointText =
    trace.source === 'prompt' ? (startingPointNote ?? highlight) : highlight;
  const supportingStartingPointNote =
    trace.source === 'prompt' ? null : startingPointNote;

  return (
    <section
      className="style-transfer__trace"
      aria-labelledby="style-transfer-trace-heading"
    >
      <details
        ref={detailsRef}
        className="style-transfer__trace-shell accordion-item"
        onToggle={() => {
          if (detailsRef.current?.open) {
            dismissedPulseTraceKeyRef.current = traceChangeKey;
            if (summaryRef.current) {
              summaryRef.current.dataset.pulse = 'false';
            }
          }
        }}
      >
        <summary
          className="style-transfer__trace-toggle accordion-summary"
          data-pulse="false"
          id="style-transfer-trace-heading"
          ref={summaryRef}
          onClick={() => {
            dismissedPulseTraceKeyRef.current = traceChangeKey;
            if (summaryRef.current) {
              summaryRef.current.dataset.pulse = 'false';
            }
          }}
        >
          <span className="style-transfer__trace-toggle-copy">
            <span className="style-transfer__title">
              {trace.source === 'prompt'
                ? 'How this remix shapes the site'
                : 'How this preset shapes the site'}
            </span>
          </span>
          <span className="accordion-icon" aria-hidden="true" />
        </summary>

        <div className="style-transfer__trace-body accordion-content">
          <div className="style-transfer__trace-body-inner accordion-content-inner">
            <p className="style-transfer__trace-intro">
              {trace.source === 'prompt'
                ? 'Each generated theme applies 61 theme variables that shape the palette, materials, background artwork, border radius, and the broader visual system. The accepted theme was compiled into the site design using semantic colors, type stacks, spacing, surfaces, controls, motion, and pattern tokens.'
                : 'Each preset changes 61 variables across the site, shaping color, surfaces, background art, border radius, spacing, and motion. It all runs through the same design system that keeps every theme accessible and controlled.'}
            </p>

            {effectiveMode && palette ? (
              <ThemeVoronoiSlab
                effectiveMode={effectiveMode}
                palette={palette}
              />
            ) : null}

            <section
              className="style-transfer__trace-section"
              aria-label="Theme receipt"
            >
              <div className="style-transfer__trace-section-header">
                <p className="style-transfer__trace-section-summary">
                  {receiptSummary}
                </p>
              </div>

              {startingPointText ? (
                <div className="style-transfer__trace-brief">
                  <p className="style-transfer__trace-brief-label">
                    Starting point
                  </p>
                  <blockquote className="style-transfer__trace-highlight">
                    {startingPointText}
                  </blockquote>
                  {supportingStartingPointNote ? (
                    <p className="style-transfer__trace-brief-note">
                      {supportingStartingPointNote}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <StyleTransferReceiptRows rows={themeReceiptRows} />
              <StyleTransferArtworkReceiptCard artwork={artwork} />
            </section>

            <section
              className="style-transfer__trace-section"
              aria-labelledby="style-transfer-trace-contrast-heading"
            >
              <div className="style-transfer__trace-section-header">
                <p className="style-transfer__trace-section-summary">
                  {contrastSummary}
                </p>
              </div>

              {pairings.length ? (
                <StyleTransferContrastReceipt
                  effectiveMode={effectiveMode}
                  pairings={pairings}
                />
              ) : (
                <p className="style-transfer__trace-empty">
                  Contrast details are unavailable for this theme.
                </p>
              )}
            </section>

            <section
              className="style-transfer__trace-section"
              aria-label="Runtime state"
            >
              <div className="style-transfer__trace-section-header">
                <p className="style-transfer__trace-section-summary">
                  {runtimeSummary}
                </p>
              </div>

              <StyleTransferReceiptRows
                className="style-transfer__trace-receipt-grid--runtime"
                rows={runtimeRows}
              />
            </section>
          </div>
        </div>
      </details>
    </section>
  );
}

export default memo(StyleTransferTraceInspector);
