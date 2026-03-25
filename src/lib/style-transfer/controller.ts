import {
  createStyleTransferArtworkPreviewFromThemeSignals,
  type StyleTransferArtworkPreview,
} from './artwork';
import type { StyleTransferApplication } from './deriveTheme';

export type StyleTransferMode = 'auto' | 'dark' | 'light';

export type StyleTransferControllerState = {
  id: string | null;
  name: string;
  mode: StyleTransferMode;
  prompt: string | null;
  source: 'default' | 'preset' | 'prompt';
  presetId: string | null;
};

export type StyleTransferPresetSummary = {
  artwork: StyleTransferArtworkPreview;
  id: string;
  name: string;
  prompt: string | null;
};

export type StoredStyleTransferApplication = StyleTransferApplication & {
  artwork?: StyleTransferArtworkPreview | null;
};

export type StyleTransferGeneratedSummary = {
  application?: StoredStyleTransferApplication | null;
  artwork: StyleTransferArtworkPreview | null;
  id: string;
  name: string;
  prompt: string | null;
};

export type StyleTransferController = {
  getCurrentApplication: () => StoredStyleTransferApplication | null;
  getState: () => StyleTransferControllerState;
  getMode: () => StyleTransferMode;
  getPresets: () => StyleTransferPresetSummary[];
  getGeneratedThemes: () => StyleTransferGeneratedSummary[];
  setMode: (mode: StyleTransferMode) => boolean;
  applyPreset: (id: string) => boolean;
  applyGeneratedTheme: (id: string) => boolean;
  applyApplication: (
    application: StyleTransferApplication,
    options?: {
      artwork?: StyleTransferArtworkPreview | null;
    },
  ) => void;
  reset: () => void;
  sync: () => void;
};

export type ResolvedStyleTransferArtworkState = {
  artwork: StyleTransferArtworkPreview | null;
  key: string | null;
};

export const STYLE_TRANSFER_EVENT = 'site-style-transfer:change';
export const STYLE_TRANSFER_PANEL_OPEN_DATASET_KEY = 'styleTransferPanelOpen';

export const DEFAULT_STYLE_TRANSFER_CONTROLLER_STATE: StyleTransferControllerState =
  {
    id: null,
    name: 'Original Canvas',
    mode: 'auto',
    prompt: null,
    source: 'default',
    presetId: null,
  };

function getRootDataset() {
  if (typeof document === 'undefined') {
    return null;
  }

  return document.documentElement.dataset;
}

function createPromptFallbackArtwork(
  state: StyleTransferControllerState,
): StyleTransferArtworkPreview | null {
  if (state.source !== 'prompt' || !state.id) {
    return null;
  }

  const rootDataset = getRootDataset();

  return createStyleTransferArtworkPreviewFromThemeSignals(
    {
      buttonStyle: rootDataset?.styleButton ?? null,
      density: rootDataset?.styleDensity ?? null,
      id: state.id,
      motion: rootDataset?.styleMotion ?? null,
      name: state.name,
      pattern: rootDataset?.stylePattern ?? null,
      prompt: state.prompt,
      source: 'prompt',
      surfaceStyle: rootDataset?.styleSurface ?? null,
    },
    {
      source: 'fallback',
    },
  );
}

export function getStyleTransferController() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.__siteStyleTransfer ?? null;
}

export function getStyleTransferControllerState() {
  return (
    getStyleTransferController()?.getState() ??
    DEFAULT_STYLE_TRANSFER_CONTROLLER_STATE
  );
}

export function getStyleTransferPresetSummaries() {
  return getStyleTransferController()?.getPresets() ?? [];
}

export function getStyleTransferGeneratedSummaries() {
  return getStyleTransferController()?.getGeneratedThemes() ?? [];
}

export function subscribeToStyleTransferChanges(listener: EventListener) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  window.addEventListener(STYLE_TRANSFER_EVENT, listener);

  return () => {
    window.removeEventListener(STYLE_TRANSFER_EVENT, listener);
  };
}

export function setStyleTransferMode(mode: StyleTransferMode) {
  return getStyleTransferController()?.setMode(mode) ?? false;
}

export function applyStyleTransferPreset(presetId: string) {
  return getStyleTransferController()?.applyPreset(presetId) ?? false;
}

export function applyGeneratedStyleTransferTheme(themeId: string) {
  return getStyleTransferController()?.applyGeneratedTheme(themeId) ?? false;
}

export function applyStyleTransferApplication(
  application: StyleTransferApplication,
  options?: {
    artwork?: StyleTransferArtworkPreview | null;
  },
) {
  getStyleTransferController()?.applyApplication(application, options);
}

export function resetStyleTransferController() {
  getStyleTransferController()?.reset();
}

export function syncStyleTransferController() {
  getStyleTransferController()?.sync();
}

export function resolveActiveStyleTransferArtwork(): ResolvedStyleTransferArtworkState {
  const controller = getStyleTransferController();

  if (!controller) {
    return {
      artwork: null,
      key: null,
    };
  }

  const state = controller.getState();
  const currentApplication = controller.getCurrentApplication();

  if (state.source === 'preset' && state.presetId) {
    const preset = controller
      .getPresets()
      .find((entry) => entry.id === state.presetId);

    return {
      artwork: preset?.artwork ?? null,
      key: preset ? `preset:${preset.id}` : null,
    };
  }

  if (state.source === 'prompt' && state.id) {
    if (
      currentApplication?.source === 'prompt' &&
      currentApplication.id === state.id &&
      currentApplication.artwork
    ) {
      return {
        artwork: currentApplication.artwork,
        key: `prompt:${currentApplication.id}`,
      };
    }

    const generatedTheme = controller
      .getGeneratedThemes()
      .find((entry) => entry.id === state.id);

    if (generatedTheme?.artwork) {
      return {
        artwork: generatedTheme.artwork,
        key: `prompt:${generatedTheme.id}`,
      };
    }

    return {
      artwork: createPromptFallbackArtwork(state),
      key: `prompt:${state.id}`,
    };
  }

  return {
    artwork: null,
    key: null,
  };
}
