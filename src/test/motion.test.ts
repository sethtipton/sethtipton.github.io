import { describe, expect, it } from 'vitest';

import { deriveStyleTransferApplication } from '../lib/style-transfer/deriveTheme';
import {
  createStyleTransferMotionCssVars,
  getStyleTransferMotionProfile,
} from '../lib/style-transfer/motion';
import {
  createCustomStyleTransferThemeRecord,
  styleTransferMotionOptions,
  styleTransferModelOutputSchema,
} from '../lib/style-transfer/schema';

function createTheme(motion: (typeof styleTransferMotionOptions)[number]) {
  const payload = styleTransferModelOutputSchema.parse({
    styleName: 'Signal Studio',
    palette: {
      background: { light: '#f8fbff', dark: '#0d1520' },
      backgroundAlt: { light: '#edf3fb', dark: '#132030' },
      surface: { light: '#ffffff', dark: '#15202b' },
      surfaceStrong: { light: '#dfe8f2', dark: '#1c2b3a' },
      surfaceTint: { light: '#eef6ff', dark: '#223344' },
      surfacePaper: { light: '#fcfeff', dark: '#101923' },
      text: { light: '#132131', dark: '#e7f1fb' },
      muted: { light: '#5b6f84', dark: '#9bb0c6' },
      accent: { light: '#2563eb', dark: '#60a5fa' },
      accentStrong: { light: '#1d4ed8', dark: '#93c5fd' },
      focus: { light: '#0ea5e9', dark: '#fde68a' },
    },
    fonts: {
      sans: 'neo-grotesk',
      serif: 'editorial',
    },
    density: 'balanced',
    surfaceStyle: 'glass',
    buttonStyle: 'outline',
    pattern: 'grid',
    motion,
  });

  return createCustomStyleTransferThemeRecord('signal studio', payload);
}

describe('style transfer motion profiles', () => {
  it('creates expanded motion css vars for calm themes', () => {
    const profile = getStyleTransferMotionProfile('calm');
    const cssVars = createStyleTransferMotionCssVars(profile);

    expect(cssVars['--site-motion-enter']).toBe('220ms');
    expect(cssVars['--site-motion-item-enter']).toBe('190ms');
    expect(cssVars['--site-motion-ease-emphasized']).toBe(
      'cubic-bezier(0.16, 1, 0.3, 1)',
    );
    expect(cssVars['--site-motion-feedback-play-state']).toBe('running');
    expect(cssVars['--site-motion-decorative-iteration-count']).toBe(
      'infinite',
    );
  });

  it('turns semantic motion off into near-instant timings and paused loops', () => {
    const profile = getStyleTransferMotionProfile('off');
    const cssVars = createStyleTransferMotionCssVars(profile);

    expect(cssVars['--site-motion-fast']).toBe('1ms');
    expect(cssVars['--site-motion-distance-md']).toBe('0px');
    expect(cssVars['--site-motion-feedback-play-state']).toBe('paused');
    expect(cssVars['--site-motion-decorative-iteration-count']).toBe('1');
  });

  it('injects the expanded motion token set into derived theme applications', () => {
    const theme = createTheme('snappy');
    const application = deriveStyleTransferApplication(theme);

    expect(application.dataset.styleMotion).toBe('snappy');
    expect(application.cssVars['--site-motion-enter']).toBe('180ms');
    expect(application.cssVars['--site-motion-view-slow']).toBe('420ms');
    expect(application.cssVars['--site-motion-stagger-sm']).toBe('24ms');
    expect(application.cssVars['--site-motion-ease-standard']).toBe(
      'cubic-bezier(0.2, 0.8, 0.2, 1)',
    );
  });
});
