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
import {
  getRuntimeStyleTransferMotionProfile,
  motionMsToSeconds,
  type StyleTransferMotionProfile,
} from '../../lib/style-transfer/motion';

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
  motion: StyleTransferMotionProfile,
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
        ease: motion.easings.standard.gsap,
      },
    })
    .to(svg, {
      opacity: 1,
      duration: motionMsToSeconds(motion.durations.fast),
    })
    .to(
      drawableShapes,
      {
        duration: motionMsToSeconds(
          motion.durations.viewSlow + motion.durations.itemEnter,
        ),
        opacity: (_index: number, target: SVGElement) =>
          getFinalShapeOpacity(target),
        strokeDashoffset: 0,
        strokeWidth: (_index: number, target: SVGElement) =>
          Number.parseFloat(target.getAttribute('stroke-width') ?? '') ||
          config.strokeWidth,
        stagger: motionMsToSeconds(motion.stagger.md),
      },
      0,
    )
    .to(
      shapes.filter((shape) => !drawableShapes.includes(shape)),
      {
        duration: motionMsToSeconds(motion.durations.itemEnter),
        opacity: (_index: number, target: SVGElement) =>
          getFinalShapeOpacity(target),
        y: 0,
        stagger: motionMsToSeconds(motion.stagger.sm),
      },
      motionMsToSeconds(motion.stagger.md),
    );
}

function animatePanelStagger(
  svg: SVGSVGElement,
  motion: StyleTransferMotionProfile,
) {
  const shapes = getGeometryShapes(svg);

  gsap.set(svg, { opacity: 0.18 });
  gsap.set(shapes, {
    opacity: 0,
    scale: 0.9,
    y: motion.distances.md,
    rotate: (_index: number) => (_index % 2 === 0 ? -4 : 4),
    transformOrigin: '50% 50%',
  });

  gsap
    .timeline({
      defaults: {
        ease: motion.easings.emphasized.gsap,
      },
    })
    .to(svg, {
      opacity: 1,
      duration: motionMsToSeconds(motion.durations.fast),
    })
    .to(
      shapes,
      {
        duration: motionMsToSeconds(motion.durations.enter),
        opacity: (_index: number, target: SVGElement) =>
          getFinalShapeOpacity(target),
        rotate: 0,
        scale: 1,
        y: 0,
        stagger: motionMsToSeconds(motion.stagger.md),
      },
      0,
    )
    .to(
      shapes,
      {
        duration: motionMsToSeconds(motion.durations.exit),
        scale: 1.01,
        yoyo: true,
        repeat: 1,
        stagger: motionMsToSeconds(motion.stagger.sm),
        ease: motion.easings.inOut.gsap,
      },
      motionMsToSeconds(motion.stagger.md * 2),
    );
}

function animateOrbitalPulse(
  svg: SVGSVGElement,
  motion: StyleTransferMotionProfile,
) {
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
        ease: motion.easings.standard.gsap,
      },
    })
    .to(svg, {
      opacity: 1,
      rotate: 0,
      duration: motionMsToSeconds(motion.durations.enter),
    })
    .to(
      nodeShapes,
      {
        duration: motionMsToSeconds(motion.durations.enter),
        opacity: (_index: number, target: SVGElement) =>
          getFinalShapeOpacity(target),
        scale: 1,
        stagger: motionMsToSeconds(motion.stagger.sm),
      },
      0,
    )
    .to(
      nodeShapes.filter(
        (shape) =>
          shape.getAttribute('data-style-transfer-shape-type') === 'ellipse',
      ),
      {
        duration: motionMsToSeconds(motion.durations.exit),
        scale: 1.08,
        yoyo: true,
        repeat: 1,
        stagger: motionMsToSeconds(motion.stagger.sm * 1.25),
        ease: motion.easings.inOut.gsap,
      },
      motionMsToSeconds(motion.stagger.md),
    );
}

function animateBandSweep(
  svg: SVGSVGElement,
  motion: StyleTransferMotionProfile,
) {
  const shapes = getGeometryShapes(svg);

  gsap.set(svg, { opacity: 0.2 });
  gsap.set(shapes, {
    opacity: 0,
    x: motion.distances.md * -2,
  });

  gsap
    .timeline({
      defaults: {
        ease: motion.easings.standard.gsap,
      },
    })
    .to(svg, {
      opacity: 1,
      duration: motionMsToSeconds(motion.durations.fast),
    })
    .to(
      shapes,
      {
        duration: motionMsToSeconds(motion.durations.itemEnter),
        opacity: (_index: number, target: SVGElement) =>
          getFinalShapeOpacity(target),
        stagger: motionMsToSeconds(motion.stagger.sm),
        x: 0,
      },
      0,
    );
}

function animateSoftDrift(
  svg: SVGSVGElement,
  motion: StyleTransferMotionProfile,
) {
  const shapes = getGeometryShapes(svg);

  gsap.set(svg, { opacity: 0.16 });
  gsap.set(shapes, {
    opacity: 0,
    scale: 0.96,
    y: motion.distances.md,
    transformOrigin: '50% 50%',
  });

  gsap
    .timeline({
      defaults: {
        ease: motion.easings.standard.gsap,
      },
    })
    .to(svg, {
      opacity: 1,
      duration: motionMsToSeconds(motion.durations.fast),
    })
    .to(
      shapes,
      {
        duration: motionMsToSeconds(motion.durations.enter),
        opacity: (_index: number, target: SVGElement) =>
          getFinalShapeOpacity(target),
        scale: 1,
        stagger: motionMsToSeconds(motion.stagger.md),
        y: 0,
      },
      motionMsToSeconds(motion.stagger.sm),
    )
    .to(
      shapes,
      {
        duration: motionMsToSeconds(motion.durations.slow),
        ease: motion.easings.inOut.gsap,
        repeat: 1,
        stagger: motionMsToSeconds(motion.stagger.sm),
        y: (_index: number) =>
          _index % 2 === 0 ? -motion.distances.sm : motion.distances.sm,
        yoyo: true,
      },
      motionMsToSeconds(motion.stagger.md * 2),
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
  const motion = getRuntimeStyleTransferMotionProfile(document.documentElement);

  resetHeroArtwork(svg, config);

  if (prefersReducedMotion || !motion.decorativeEnabled) {
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
      animateStrokeDraw(svg, config, motion);
      break;
    case 'panel-stagger':
      animatePanelStagger(svg, motion);
      break;
    case 'orbital-pulse':
      animateOrbitalPulse(svg, motion);
      break;
    case 'band-sweep':
      animateBandSweep(svg, motion);
      break;
    case 'soft-drift':
    default:
      animateSoftDrift(svg, motion);
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
