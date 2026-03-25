import { useEffect, useRef } from 'react';

import StyleTransferArtworkPreview from './StyleTransferArtworkPreview';
import type { StyleTransferArtworkPreview as StyleTransferArtworkPreviewData } from '../../lib/style-transfer/artwork';
import type {
  StyleTransferTrace,
  StyleTransferTraceDataView,
  StyleTransferTraceStage,
} from '../../lib/style-transfer/trace';

type StyleTransferTraceInspectorProps = {
  artwork: StyleTransferArtworkPreviewData | null;
  trace: StyleTransferTrace | null;
};

const stageStatusLabels = {
  applied: 'Applied',
  complete: 'Live',
  informational: 'Notes',
  synthetic: 'Local',
} as const;

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function renderDataView(view: StyleTransferTraceDataView) {
  switch (view.kind) {
    case 'json':
      return (
        <pre className="style-transfer__trace-code">
          <code>{formatJson(view.value)}</code>
        </pre>
      );
    case 'text':
      return (
        <p className="style-transfer__trace-detail-text">
          {String(view.value)}
        </p>
      );
    case 'list':
      return (
        <ul className="style-transfer__trace-note-list">
          {view.value.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case 'pairs':
      return (
        <dl className="style-transfer__trace-detail-grid">
          {view.value.map((fact) => (
            <div key={`${view.id}-${fact.label}`}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      );
    default:
      return null;
  }
}

type StyleTransferTraceStageItemProps = {
  artwork: StyleTransferArtworkPreviewData | null;
  index: number;
  shouldStartOpen: boolean;
  stage: StyleTransferTraceStage;
};

function StyleTransferTraceStageItem({
  artwork,
  index,
  shouldStartOpen,
  stage,
}: StyleTransferTraceStageItemProps) {
  const detailsRef = useRef<HTMLDetailsElement | null>(null);
  const hasDetails =
    Boolean(stage.data?.notes?.length) || Boolean(stage.data?.views?.length);

  useEffect(() => {
    if (!detailsRef.current) {
      return;
    }

    detailsRef.current.open = shouldStartOpen;
  }, [shouldStartOpen]);

  return (
    <li className="style-transfer__trace-stage">
      <details
        ref={detailsRef}
        className="style-transfer__trace-stage-accordion accordion-item"
      >
        <summary className="style-transfer__trace-stage-step accordion-summary">
          <span className="style-transfer__trace-stage-step-main">
            <span
              className="style-transfer__trace-stage-index"
              aria-hidden="true"
            >
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="style-transfer__trace-stage-label">
              {stage.title}
            </span>
          </span>
          <span className="style-transfer__trace-stage-step-meta">
            <span
              className={`style-transfer__trace-stage-status style-transfer__trace-stage-status--${stage.status}`}
            >
              {stageStatusLabels[stage.status]}
            </span>
            <span className="accordion-icon" aria-hidden="true" />
          </span>
        </summary>

        <div className="style-transfer__trace-stage-card accordion-content">
          <div className="style-transfer__trace-stage-card-inner accordion-content-inner">
            <p className="style-transfer__trace-stage-summary">
              {stage.summary}
            </p>

            {stage.data?.highlight ? (
              <blockquote className="style-transfer__trace-highlight">
                {stage.data.highlight}
              </blockquote>
            ) : null}

            <dl className="style-transfer__trace-facts">
              {stage.facts.map((fact) => (
                <div key={`${stage.id}-${fact.label}`}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>

            {stage.id === 'artwork' && artwork ? (
              <details className="style-transfer__trace-details accordion-item">
                <summary className="style-transfer__trace-details-summary accordion-summary">
                  <span className="style-transfer__trace-details-toggle">
                    <span className="style-transfer__trace-details-toggle-closed">
                      Show artwork preview
                    </span>
                    <span className="style-transfer__trace-details-toggle-open">
                      Hide artwork preview
                    </span>
                  </span>
                  <span className="accordion-icon" aria-hidden="true" />
                </summary>

                <div className="style-transfer__trace-details-panel accordion-content">
                  <div className="style-transfer__trace-details-body accordion-content-inner">
                    <StyleTransferArtworkPreview
                      artwork={artwork}
                      variant="inline"
                    />
                  </div>
                </div>
              </details>
            ) : null}

            {hasDetails ? (
              <details className="style-transfer__trace-details accordion-item">
                <summary className="style-transfer__trace-details-summary accordion-summary">
                  <span>View structured details</span>
                  <span className="accordion-icon" aria-hidden="true" />
                </summary>

                <div className="style-transfer__trace-details-panel accordion-content">
                  <div className="style-transfer__trace-details-body accordion-content-inner">
                    {stage.data?.views?.map((view) => (
                      <div
                        key={view.id}
                        className="style-transfer__trace-detail-block"
                      >
                        <p className="style-transfer__trace-detail-label">
                          {view.label}
                        </p>
                        {renderDataView(view)}
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            ) : null}
          </div>
        </div>
      </details>
    </li>
  );
}

export default function StyleTransferTraceInspector({
  artwork,
  trace,
}: StyleTransferTraceInspectorProps) {
  if (!trace) {
    return null;
  }

  return (
    <section
      className="style-transfer__trace"
      aria-labelledby="style-transfer-trace-heading"
    >
      <div className="style-transfer__trace-header">
        <div className="flow-sm">
          <p
            className="style-transfer__title"
            id="style-transfer-trace-heading"
          >
            {trace.source === 'prompt'
              ? 'How the remix turns into a theme'
              : 'How this preset became a theme'}
          </p>
          <p className="style-transfer__trace-intro">
            {trace.source === 'prompt'
              ? 'A quick trace of the brief, the structured output, and what made it onto the page.'
              : ''}
          </p>
        </div>
      </div>

      <ol className="style-transfer__trace-list accordion">
        {trace.stages.map((stage, index) => (
          <StyleTransferTraceStageItem
            artwork={artwork}
            key={`${trace.traceId}-${stage.id}`}
            index={index}
            shouldStartOpen={trace.source === 'prompt' && index === 0}
            stage={stage}
          />
        ))}
      </ol>
    </section>
  );
}
