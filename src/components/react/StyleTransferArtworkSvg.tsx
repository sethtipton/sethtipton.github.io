import { useId, type CSSProperties, type Ref } from 'react';

import type {
  StyleTransferArtworkPreview,
  StyleTransferArtworkRenderConfig,
  StyleTransferArtworkShape,
} from '../../lib/style-transfer/artwork';

type StyleTransferArtworkSvgProps = {
  ariaLabel: string;
  artwork: StyleTransferArtworkPreview;
  className?: string;
  config: StyleTransferArtworkRenderConfig;
  role?: 'img' | 'presentation';
  svgRef?: Ref<SVGSVGElement>;
};

function renderShape(shape: StyleTransferArtworkShape, key: string) {
  const style: CSSProperties | undefined = shape.blendMode
    ? {
        mixBlendMode: shape.blendMode as CSSProperties['mixBlendMode'],
      }
    : undefined;
  const sharedProps = {
    'data-style-transfer-shape': 'true',
    'data-style-transfer-shape-type': shape.type,
    style,
  } as const;

  switch (shape.type) {
    case 'ellipse': {
      const { blendMode, ...rest } = shape;
      void blendMode;
      return <ellipse key={key} {...sharedProps} {...rest} />;
    }
    case 'path': {
      const { blendMode, ...rest } = shape;
      void blendMode;
      return <path key={key} {...sharedProps} {...rest} />;
    }
    case 'line': {
      const { blendMode, ...rest } = shape;
      void blendMode;
      return <line key={key} {...sharedProps} {...rest} />;
    }
    case 'polygon': {
      const { blendMode, ...rest } = shape;
      void blendMode;
      return <polygon key={key} {...sharedProps} {...rest} />;
    }
    case 'rect': {
      const { blendMode, ...rest } = shape;
      void blendMode;
      return <rect key={key} {...sharedProps} {...rest} />;
    }
  }
}

function renderMask(maskId: string, config: StyleTransferArtworkRenderConfig) {
  const { height, width } = config.viewBox;

  switch (config.maskBehavior) {
    case 'fade-edges':
      return (
        <mask id={maskId}>
          <linearGradient id={`${maskId}-gradient`} x1="0%" x2="100%">
            <stop offset="0%" stopColor="black" />
            <stop offset="12%" stopColor="white" />
            <stop offset="88%" stopColor="white" />
            <stop offset="100%" stopColor="black" />
          </linearGradient>
          <rect
            x="0"
            y="0"
            width={width}
            height={height}
            fill={`url(#${maskId}-gradient)`}
          />
        </mask>
      );
    case 'fade-top':
      return (
        <mask id={maskId}>
          <linearGradient
            id={`${maskId}-gradient`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="black" />
            <stop offset="28%" stopColor="white" />
            <stop offset="100%" stopColor="white" />
          </linearGradient>
          <rect
            x="0"
            y="0"
            width={width}
            height={height}
            fill={`url(#${maskId}-gradient)`}
          />
        </mask>
      );
    case 'fade-bottom':
      return (
        <mask id={maskId}>
          <linearGradient
            id={`${maskId}-gradient`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="white" />
            <stop offset="72%" stopColor="white" />
            <stop offset="100%" stopColor="black" />
          </linearGradient>
          <rect
            x="0"
            y="0"
            width={width}
            height={height}
            fill={`url(#${maskId}-gradient)`}
          />
        </mask>
      );
    default:
      return null;
  }
}

export default function StyleTransferArtworkSvg({
  ariaLabel,
  artwork,
  className,
  config,
  role = 'img',
  svgRef,
}: StyleTransferArtworkSvgProps) {
  const maskId = useId().replace(/:/g, '-');

  return (
    <svg
      ref={svgRef}
      className={className}
      viewBox={`0 0 ${config.viewBox.width} ${config.viewBox.height}`}
      preserveAspectRatio="xMidYMid slice"
      aria-label={ariaLabel}
      role={role}
      data-style-transfer-artwork="true"
      data-style-transfer-artwork-family={artwork.spec.family}
      data-style-transfer-artwork-usage={artwork.spec.usage}
    >
      <defs>{renderMask(maskId, config)}</defs>
      <rect
        x="0"
        y="0"
        width={config.viewBox.width}
        height={config.viewBox.height}
        fill={
          config.bindings.background?.cssValue ??
          'color-mix(in srgb, var(--color-surface) 92%, transparent)'
        }
        fillOpacity={artwork.spec.usage === 'scrim' ? 0.38 : 0.12}
        data-style-transfer-artwork-background="true"
      />
      <g
        data-style-transfer-artwork-shapes="true"
        mask={config.maskBehavior === 'none' ? undefined : `url(#${maskId})`}
      >
        {config.shapes.map((shape, index) =>
          renderShape(shape, `${artwork.spec.family}-${index}`),
        )}
      </g>
    </svg>
  );
}
