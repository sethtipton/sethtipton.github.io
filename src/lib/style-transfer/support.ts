import type { StyleTransferMode } from './controller';

export type StyleTransferSupportStatus = {
  message: string | null;
  missingFeatures: string[];
  supported: boolean;
};

const unsupportedMessage =
  'Theme presets and remixes need a browser that supports light-dark() and color-mix(). You can still view the site normally here.';

function hasCssSupportsApi() {
  return typeof CSS !== 'undefined' && typeof CSS.supports === 'function';
}

function supportsLightDark() {
  if (!hasCssSupportsApi()) {
    return true;
  }

  return CSS.supports('color', 'light-dark(white, black)');
}

function supportsColorMix() {
  if (!hasCssSupportsApi()) {
    return true;
  }

  return CSS.supports(
    'background',
    'color-mix(in srgb, black 50%, transparent)',
  );
}

export function getStyleTransferSupportStatus(): StyleTransferSupportStatus {
  if (typeof window === 'undefined') {
    return {
      message: null,
      missingFeatures: [],
      supported: true,
    };
  }

  const missingFeatures: string[] = [];

  if (!supportsLightDark()) {
    missingFeatures.push('light-dark()');
  }

  if (!supportsColorMix()) {
    missingFeatures.push('color-mix()');
  }

  return {
    message: missingFeatures.length > 0 ? unsupportedMessage : null,
    missingFeatures,
    supported: missingFeatures.length === 0,
  };
}

export function resolveStyleTransferEffectiveMode(
  mode: StyleTransferMode,
  prefersDark: boolean,
) {
  return mode === 'auto' ? (prefersDark ? 'dark' : 'light') : mode;
}
