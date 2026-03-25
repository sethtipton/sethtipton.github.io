import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';

import StyleTransferArtworkSvg from './StyleTransferArtworkSvg';
import {
  deriveStyleTransferArtworkRenderConfig,
  type StyleTransferArtworkPreview,
  type StyleTransferArtworkRenderConfig,
} from '../../lib/style-transfer/artwork';
import {
  resolveActiveStyleTransferArtwork,
  subscribeToStyleTransferChanges,
  type ResolvedStyleTransferArtworkState,
} from '../../lib/style-transfer/controller';
import { isStyleTransferDebugEnabled } from '../../lib/style-transfer/debug';

function logHeroDebug(message: string, details?: unknown) {
  if (!isStyleTransferDebugEnabled()) {
    return;
  }

  console.info(`[style-transfer] hero-artwork ${message}`, details ?? '');
}

function getFinalShapeOpacity(shape: SVGElement) {
  const fillOpacity = shape.getAttribute('fill-opacity');
  const strokeOpacity = shape.getAttribute('stroke-opacity');

  return Number.parseFloat(fillOpacity ?? strokeOpacity ?? '1') || 1;
}

function getGeometryShapes(svg: SVGSVGElement) {
  return Array.from(
    svg.querySelectorAll<SVGElement>('[data-style-transfer-shape="true"]'),
  );
}

function resolveAnimationProfile(
  family: StyleTransferArtworkPreview['spec']['family'],
) {
  switch (family) {
    case 'contour-lines':
    case 'layered-wave':
      return 'stroke-draw';
    case 'modular-tiles':
    case 'inset-frames':
    case 'paper-cut':
    case 'angled-panel':
      return 'panel-stagger';
    case 'offset-rings':
    case 'radial-burst':
    case 'constellation':
      return 'orbital-pulse';
    case 'scanline-band':
    case 'folded-ribbon':
      return 'band-sweep';
    case 'soft-blob':
    default:
      return 'soft-drift';
  }
}

function resetHeroArtwork(
  svg: SVGSVGElement,
  config: StyleTransferArtworkRenderConfig,
) {
  const shapes = getGeometryShapes(svg);

  gsap.killTweensOf([svg, ...shapes]);
  gsap.set(svg, { opacity: 1 });
  gsap.set(shapes, {
    clearProps: 'all',
  });
  gsap.set(shapes, {
    opacity: (_index: number, target: SVGElement) =>
      getFinalShapeOpacity(target),
  });

  if (config.strokeWidth > 0) {
    gsap.set(shapes, {
      strokeWidth: (_index: number, target: SVGElement) =>
        Number.parseFloat(target.getAttribute('stroke-width') ?? '') ||
        config.strokeWidth,
    });
  }
}

function animateStrokeDraw(
  svg: SVGSVGElement,
  config: StyleTransferArtworkRenderConfig,
) {
  const shapes = getGeometryShapes(svg);
  const strokeShapes = shapes.filter((shape) => shape.hasAttribute('stroke'));
  const drawableShapes = strokeShapes.filter(
    (shape) =>
      typeof (
        shape as SVGGeometryElement & {
          getTotalLength?: () => number;
        }
      ).getTotalLength === 'function',
  ) as SVGElement[];

  drawableShapes.forEach((shape) => {
    const geometry = shape as SVGGeometryElement;
    const length = geometry.getTotalLength();

    shape.setAttribute('stroke-dasharray', `${length}`);
    shape.setAttribute('stroke-dashoffset', `${length}`);
  });

  gsap.set(svg, { opacity: 0.2 });
  gsap.set(shapes, {
    opacity: 0,
    transformOrigin: '50% 50%',
  });
  gsap.set(drawableShapes, {
    opacity: 0.18,
    strokeWidth: config.strokeWidth * 0.7,
  });

  gsap
    .timeline({
      defaults: {
        ease: 'power2.out',
      },
    })
    .to(svg, {
      opacity: 1,
      duration: 0.28,
    })
    .to(
      drawableShapes,
      {
        duration: 1.4,
        opacity: (_index: number, target: SVGElement) =>
          getFinalShapeOpacity(target),
        strokeDashoffset: 0,
        strokeWidth: (_index: number, target: SVGElement) =>
          Number.parseFloat(target.getAttribute('stroke-width') ?? '') ||
          config.strokeWidth,
        stagger: 0.08,
      },
      0,
    )
    .to(
      shapes.filter((shape) => !drawableShapes.includes(shape)),
      {
        duration: 0.8,
        opacity: (_index: number, target: SVGElement) =>
          getFinalShapeOpacity(target),
        y: 0,
        stagger: 0.04,
      },
      0.18,
    );
}

function animatePanelStagger(svg: SVGSVGElement) {
  const shapes = getGeometryShapes(svg);

  gsap.set(svg, { opacity: 0.18 });
  gsap.set(shapes, {
    opacity: 0,
    scale: 0.9,
    y: 24,
    rotate: (_index: number) => (_index % 2 === 0 ? -4 : 4),
    transformOrigin: '50% 50%',
  });

  gsap
    .timeline({
      defaults: {
        ease: 'power3.out',
      },
    })
    .to(svg, {
      opacity: 1,
      duration: 0.32,
    })
    .to(
      shapes,
      {
        duration: 0.9,
        opacity: (_index: number, target: SVGElement) =>
          getFinalShapeOpacity(target),
        rotate: 0,
        scale: 1,
        y: 0,
        stagger: 0.08,
      },
      0,
    )
    .to(
      shapes,
      {
        duration: 0.35,
        scale: 1.01,
        yoyo: true,
        repeat: 1,
        stagger: 0.04,
        ease: 'power1.inOut',
      },
      0.25,
    );
}

function animateOrbitalPulse(svg: SVGSVGElement) {
  const shapes = getGeometryShapes(svg);
  const nodeShapes = shapes.filter((shape) => {
    const type = shape.getAttribute('data-style-transfer-shape-type');
    return type === 'ellipse' || type === 'line';
  });

  gsap.set(svg, { opacity: 0.18, rotate: -3, transformOrigin: '50% 50%' });
  gsap.set(nodeShapes, {
    opacity: 0,
    scale: 0.84,
    transformOrigin: '50% 50%',
  });

  gsap
    .timeline({
      defaults: {
        ease: 'power2.out',
      },
    })
    .to(svg, {
      opacity: 1,
      rotate: 0,
      duration: 0.55,
    })
    .to(
      nodeShapes,
      {
        duration: 1,
        opacity: (_index: number, target: SVGElement) =>
          getFinalShapeOpacity(target),
        scale: 1,
        stagger: 0.05,
      },
      0,
    )
    .to(
      nodeShapes.filter(
        (shape) =>
          shape.getAttribute('data-style-transfer-shape-type') === 'ellipse',
      ),
      {
        duration: 0.5,
        scale: 1.08,
        yoyo: true,
        repeat: 1,
        stagger: 0.06,
        ease: 'sine.inOut',
      },
      0.2,
    );
}

function animateBandSweep(svg: SVGSVGElement) {
  const shapes = getGeometryShapes(svg);

  gsap.set(svg, { opacity: 0.2 });
  gsap.set(shapes, {
    opacity: 0,
    x: -44,
  });

  gsap
    .timeline({
      defaults: {
        ease: 'power2.out',
      },
    })
    .to(svg, {
      opacity: 1,
      duration: 0.24,
    })
    .to(
      shapes,
      {
        duration: 0.7,
        opacity: (_index: number, target: SVGElement) =>
          getFinalShapeOpacity(target),
        stagger: 0.03,
        x: 0,
      },
      0,
    );
}

function animateSoftDrift(svg: SVGSVGElement) {
  const shapes = getGeometryShapes(svg);

  gsap.set(svg, { opacity: 0.16 });
  gsap.set(shapes, {
    opacity: 0,
    scale: 0.96,
    y: 18,
    transformOrigin: '50% 50%',
  });

  gsap
    .timeline({
      defaults: {
        ease: 'power2.out',
      },
    })
    .to(svg, {
      opacity: 1,
      duration: 0.3,
    })
    .to(
      shapes,
      {
        duration: 1,
        opacity: (_index: number, target: SVGElement) =>
          getFinalShapeOpacity(target),
        scale: 1,
        stagger: 0.08,
        y: 0,
      },
      0.05,
    )
    .to(
      shapes,
      {
        duration: 0.9,
        ease: 'sine.inOut',
        repeat: 1,
        stagger: 0.05,
        y: (_index: number) => (_index % 2 === 0 ? -5 : 5),
        yoyo: true,
      },
      0.25,
    );
}

function animateHeroArtwork(
  svg: SVGSVGElement,
  artwork: StyleTransferArtworkPreview,
  config: StyleTransferArtworkRenderConfig,
) {
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  resetHeroArtwork(svg, config);

  if (prefersReducedMotion) {
    return;
  }

  const profile = resolveAnimationProfile(artwork.spec.family);

  logHeroDebug('animate', {
    family: artwork.spec.family,
    profile,
    usage: artwork.spec.usage,
  });

  switch (profile) {
    case 'stroke-draw':
      animateStrokeDraw(svg, config);
      break;
    case 'panel-stagger':
      animatePanelStagger(svg);
      break;
    case 'orbital-pulse':
      animateOrbitalPulse(svg);
      break;
    case 'band-sweep':
      animateBandSweep(svg);
      break;
    case 'soft-drift':
    default:
      animateSoftDrift(svg);
      break;
  }
}

export default function StyleTransferHeroArtwork() {
  const [activeArtwork, setActiveArtwork] =
    useState<ResolvedStyleTransferArtworkState>({
      artwork: null,
      key: null,
    });
  const lastAnimatedKeyRef = useRef<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const config = useMemo(
    () =>
      activeArtwork.artwork
        ? deriveStyleTransferArtworkRenderConfig(activeArtwork.artwork.spec)
        : null,
    [activeArtwork.artwork],
  );

  useEffect(() => {
    const syncArtwork = () => {
      const nextArtwork = resolveActiveStyleTransferArtwork();
      logHeroDebug('sync', nextArtwork);
      setActiveArtwork(nextArtwork);
    };

    syncArtwork();
    return subscribeToStyleTransferChanges(syncArtwork as EventListener);
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    if (!activeArtwork.artwork || !config || !svgRef.current) {
      delete root.dataset.themeHeroArtworkReady;
      lastAnimatedKeyRef.current = null;
      return;
    }

    root.dataset.themeHeroArtworkReady = 'true';

    if (activeArtwork.key && lastAnimatedKeyRef.current !== activeArtwork.key) {
      animateHeroArtwork(svgRef.current, activeArtwork.artwork, config);
      lastAnimatedKeyRef.current = activeArtwork.key;
      return;
    }

    resetHeroArtwork(svgRef.current, config);
  }, [activeArtwork, config]);

  return (
    <div
      className="theme-hero-artwork"
      aria-hidden="true"
      hidden={!activeArtwork.artwork || !config}
    >
      {activeArtwork.artwork && config ? (
        <StyleTransferArtworkSvg
          ariaLabel={`${activeArtwork.artwork.spec.family} theme artwork`}
          artwork={activeArtwork.artwork}
          className="theme-hero-artwork__svg"
          config={config}
          role="presentation"
          svgRef={svgRef}
        />
      ) : null}
    </div>
  );
}
