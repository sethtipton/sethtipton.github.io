import { useEffect, useMemo } from 'react';

import StyleTransferArtworkSvg from './StyleTransferArtworkSvg';
import {
  deriveStyleTransferArtworkRenderConfig,
  getStyleTransferArtworkDebugBindings,
  type StyleTransferArtworkPreview,
} from '../../lib/style-transfer/artwork';
import { isStyleTransferDebugEnabled } from '../../lib/style-transfer/debug';

type StyleTransferArtworkPreviewProps = {
  artwork: StyleTransferArtworkPreview | null;
  variant?: 'card' | 'inline';
};

export default function StyleTransferArtworkPreview({
  artwork,
  variant = 'card',
}: StyleTransferArtworkPreviewProps) {
  const config = useMemo(
    () =>
      artwork ? deriveStyleTransferArtworkRenderConfig(artwork.spec) : null,
    [artwork],
  );

  useEffect(() => {
    if (!artwork || !config || !isStyleTransferDebugEnabled()) {
      return;
    }

    console.info('[style-transfer] artwork-resolved', {
      bindings: getStyleTransferArtworkDebugBindings(artwork.spec),
      family: artwork.spec.family,
      layerCount: config.layerCount,
      slotKey: artwork.slotKey,
      source: artwork.source,
      usage: artwork.spec.usage,
      viewBox: config.viewBox,
    });
  }, [artwork, config]);

  const isInline = variant === 'inline';

  return (
    <div
      className={`style-transfer__artwork${isInline ? ' style-transfer__artwork--inline' : ' surface-card'}`}
    >
      {!isInline ? (
        <div className="style-transfer__artwork-header">
          <div>
            <p className="style-transfer__eyebrow">Theme background preview</p>
          </div>
        </div>
      ) : null}

      {artwork && config ? (
        <>
          {/*
          <div className="style-transfer__artwork-meta" role="list">
            <span className="style-transfer__artwork-pill" role="listitem">
              slot: {artwork.slotKey}
            </span>
            <span className="style-transfer__artwork-pill" role="listitem">
              family: {artwork.spec.family}
            </span>
            <span className="style-transfer__artwork-pill" role="listitem">
              usage: {artwork.spec.usage}
            </span>
            <span className="style-transfer__artwork-pill" role="listitem">
              layers: {config.layerCount}
            </span>
            <span className="style-transfer__artwork-pill" role="listitem">
              source: {artwork.source}
            </span>
          </div>
          */}

          <div className="style-transfer__artwork-canvas">
            <StyleTransferArtworkSvg
              ariaLabel="Theme background preview"
              artwork={artwork}
              className="style-transfer__artwork-svg"
              config={config}
              role="img"
            />
          </div>

          {/*
          <dl className="style-transfer__artwork-debug">
            <div>
              <dt>Primary</dt>
              <dd>{config.bindings.primary.role}</dd>
            </div>
            <div>
              <dt>Secondary</dt>
              <dd>{config.bindings.secondary?.role ?? 'none'}</dd>
            </div>
            <div>
              <dt>Stroke</dt>
              <dd>{config.bindings.stroke?.role ?? 'none'}</dd>
            </div>
            <div>
              <dt>Blend</dt>
              <dd>{artwork.spec.blendStyle}</dd>
            </div>
          </dl>
          */}
        </>
      ) : (
        <p className="style-transfer__artwork-empty">
          Select a theme or generate a remix to preview the background artwork.
        </p>
      )}
    </div>
  );
}
