import {
  styleTransferMotionOptions,
  type StyleTransferThemeRecord,
} from './schema';

export type StyleTransferMotionLevel =
  (typeof styleTransferMotionOptions)[number];

type MotionTimingCurve = {
  css: string;
  gsap: string;
};

export type StyleTransferMotionProfile = {
  decorativeEnabled: boolean;
  feedbackEnabled: boolean;
  distances: {
    md: number;
    sm: number;
  };
  durations: {
    enter: number;
    exit: number;
    fast: number;
    itemEnter: number;
    loopDecorativeFast: number;
    loopDecorativeSlow: number;
    loopFeedback: number;
    medium: number;
    slow: number;
    viewFast: number;
    viewMedium: number;
    viewSlow: number;
  };
  easings: {
    emphasized: MotionTimingCurve;
    exit: MotionTimingCurve;
    inOut: MotionTimingCurve;
    linear: MotionTimingCurve;
    standard: MotionTimingCurve;
  };
  globeRotationSpeed: number;
  signature: {
    maxDraw: number;
    minDraw: number;
    overlap: number;
  };
  stagger: {
    md: number;
    sm: number;
  };
};

export const styleTransferMotionCssVarKeys = [
  '--site-motion-fast',
  '--site-motion-medium',
  '--site-motion-slow',
  '--site-motion-enter',
  '--site-motion-item-enter',
  '--site-motion-exit',
  '--site-motion-view-fast',
  '--site-motion-view-medium',
  '--site-motion-view-slow',
  '--site-motion-loop-feedback',
  '--site-motion-loop-decorative-fast',
  '--site-motion-loop-decorative-slow',
  '--site-motion-stagger-sm',
  '--site-motion-stagger-md',
  '--site-motion-distance-sm',
  '--site-motion-distance-md',
  '--site-motion-ease-standard',
  '--site-motion-ease-emphasized',
  '--site-motion-ease-exit',
  '--site-motion-ease-in-out',
  '--site-motion-ease-linear',
  '--site-motion-feedback-play-state',
  '--site-motion-feedback-iteration-count',
  '--site-motion-decorative-play-state',
  '--site-motion-decorative-iteration-count',
] as const;

export type StyleTransferMotionCssVarKey =
  (typeof styleTransferMotionCssVarKeys)[number];

const motionProfiles = {
  off: {
    decorativeEnabled: false,
    feedbackEnabled: false,
    distances: {
      md: 0,
      sm: 0,
    },
    durations: {
      enter: 1,
      exit: 1,
      fast: 1,
      itemEnter: 1,
      loopDecorativeFast: 1,
      loopDecorativeSlow: 1,
      loopFeedback: 1,
      medium: 1,
      slow: 1,
      viewFast: 1,
      viewMedium: 1,
      viewSlow: 1,
    },
    easings: {
      emphasized: {
        css: 'linear',
        gsap: 'none',
      },
      exit: {
        css: 'linear',
        gsap: 'none',
      },
      inOut: {
        css: 'linear',
        gsap: 'none',
      },
      linear: {
        css: 'linear',
        gsap: 'none',
      },
      standard: {
        css: 'linear',
        gsap: 'none',
      },
    },
    globeRotationSpeed: 0.04,
    signature: {
      maxDraw: 1,
      minDraw: 1,
      overlap: 0,
    },
    stagger: {
      md: 0,
      sm: 0,
    },
  },
  calm: {
    decorativeEnabled: true,
    feedbackEnabled: true,
    distances: {
      md: 18,
      sm: 8,
    },
    durations: {
      enter: 220,
      exit: 170,
      fast: 180,
      itemEnter: 190,
      loopDecorativeFast: 1700,
      loopDecorativeSlow: 3200,
      loopFeedback: 1350,
      medium: 260,
      slow: 360,
      viewFast: 360,
      viewMedium: 420,
      viewSlow: 520,
    },
    easings: {
      emphasized: {
        css: 'cubic-bezier(0.16, 1, 0.3, 1)',
        gsap: 'power3.out',
      },
      exit: {
        css: 'cubic-bezier(0.4, 0, 1, 1)',
        gsap: 'power1.out',
      },
      inOut: {
        css: 'cubic-bezier(0.45, 0.05, 0.55, 0.95)',
        gsap: 'sine.inOut',
      },
      linear: {
        css: 'linear',
        gsap: 'none',
      },
      standard: {
        css: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        gsap: 'power2.out',
      },
    },
    globeRotationSpeed: 0.09,
    signature: {
      maxDraw: 580,
      minDraw: 240,
      overlap: 40,
    },
    stagger: {
      md: 40,
      sm: 32,
    },
  },
  snappy: {
    decorativeEnabled: true,
    feedbackEnabled: true,
    distances: {
      md: 14,
      sm: 6,
    },
    durations: {
      enter: 180,
      exit: 140,
      fast: 120,
      itemEnter: 160,
      loopDecorativeFast: 1350,
      loopDecorativeSlow: 2600,
      loopFeedback: 1050,
      medium: 180,
      slow: 260,
      viewFast: 280,
      viewMedium: 340,
      viewSlow: 420,
    },
    easings: {
      emphasized: {
        css: 'cubic-bezier(0.16, 1, 0.3, 1)',
        gsap: 'power3.out',
      },
      exit: {
        css: 'cubic-bezier(0.4, 0, 1, 1)',
        gsap: 'power1.out',
      },
      inOut: {
        css: 'cubic-bezier(0.45, 0.05, 0.55, 0.95)',
        gsap: 'sine.inOut',
      },
      linear: {
        css: 'linear',
        gsap: 'none',
      },
      standard: {
        css: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        gsap: 'power2.out',
      },
    },
    globeRotationSpeed: 0.12,
    signature: {
      maxDraw: 460,
      minDraw: 180,
      overlap: 28,
    },
    stagger: {
      md: 32,
      sm: 24,
    },
  },
} as const satisfies Record<
  StyleTransferMotionLevel,
  StyleTransferMotionProfile
>;

function formatMs(value: number) {
  return `${Math.max(1, Math.round(value))}ms`;
}

function formatPx(value: number) {
  return `${Math.max(0, Number(value.toFixed(3)))}px`;
}

export function getStyleTransferMotionProfile(
  motion: StyleTransferMotionLevel | null | undefined,
) {
  if (!motion) {
    return motionProfiles.calm;
  }

  return motionProfiles[motion] ?? motionProfiles.calm;
}

export function createStyleTransferMotionCssVars(
  profile: StyleTransferMotionProfile,
): Record<StyleTransferMotionCssVarKey, string> {
  return {
    '--site-motion-fast': formatMs(profile.durations.fast),
    '--site-motion-medium': formatMs(profile.durations.medium),
    '--site-motion-slow': formatMs(profile.durations.slow),
    '--site-motion-enter': formatMs(profile.durations.enter),
    '--site-motion-item-enter': formatMs(profile.durations.itemEnter),
    '--site-motion-exit': formatMs(profile.durations.exit),
    '--site-motion-view-fast': formatMs(profile.durations.viewFast),
    '--site-motion-view-medium': formatMs(profile.durations.viewMedium),
    '--site-motion-view-slow': formatMs(profile.durations.viewSlow),
    '--site-motion-loop-feedback': formatMs(profile.durations.loopFeedback),
    '--site-motion-loop-decorative-fast': formatMs(
      profile.durations.loopDecorativeFast,
    ),
    '--site-motion-loop-decorative-slow': formatMs(
      profile.durations.loopDecorativeSlow,
    ),
    '--site-motion-stagger-sm': formatMs(profile.stagger.sm),
    '--site-motion-stagger-md': formatMs(profile.stagger.md),
    '--site-motion-distance-sm': formatPx(profile.distances.sm),
    '--site-motion-distance-md': formatPx(profile.distances.md),
    '--site-motion-ease-standard': profile.easings.standard.css,
    '--site-motion-ease-emphasized': profile.easings.emphasized.css,
    '--site-motion-ease-exit': profile.easings.exit.css,
    '--site-motion-ease-in-out': profile.easings.inOut.css,
    '--site-motion-ease-linear': profile.easings.linear.css,
    '--site-motion-feedback-play-state': profile.feedbackEnabled
      ? 'running'
      : 'paused',
    '--site-motion-feedback-iteration-count': profile.feedbackEnabled
      ? 'infinite'
      : '1',
    '--site-motion-decorative-play-state': profile.decorativeEnabled
      ? 'running'
      : 'paused',
    '--site-motion-decorative-iteration-count': profile.decorativeEnabled
      ? 'infinite'
      : '1',
  };
}

export function motionMsToSeconds(value: number) {
  return Math.max(0.001, value / 1000);
}

export function getRuntimeStyleTransferMotionProfile(
  root?: HTMLElement | null,
) {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    return motionProfiles.off;
  }

  const motion = root?.dataset.styleMotion as
    | StyleTransferMotionLevel
    | undefined;

  return getStyleTransferMotionProfile(motion);
}

export function getThemeMotionProfile(
  theme: Pick<StyleTransferThemeRecord, 'motion'>,
) {
  return getStyleTransferMotionProfile(theme.motion);
}
