import type { StyleTransferArtworkPreview } from './artwork';
import type {
  StoredStyleTransferApplication,
  StyleTransferControllerState,
} from './controller';
import {
  createPaletteFromStoredApplication,
  defaultCanvasPalette,
  resolvePaletteForMode,
  resolveStyleTransferEffectiveMode,
} from './palette';
import type { ThemeGlobeInput } from './themeGlobe';

type ResolveThemeGlobeInputOptions = {
  artworkFamily?: StyleTransferArtworkPreview['spec']['family'] | null;
  controllerState: StyleTransferControllerState;
  currentApplication: StoredStyleTransferApplication | null;
  prefersDarkScheme: boolean;
};

export function resolveThemeGlobeInput({
  artworkFamily = null,
  controllerState,
  currentApplication,
  prefersDarkScheme,
}: ResolveThemeGlobeInputOptions): ThemeGlobeInput {
  const effectiveMode = resolveStyleTransferEffectiveMode(
    controllerState.mode,
    prefersDarkScheme,
  );
  const palette = currentApplication
    ? (createPaletteFromStoredApplication(currentApplication) ??
      defaultCanvasPalette)
    : defaultCanvasPalette;

  return {
    artworkFamily,
    colors: resolvePaletteForMode(palette, effectiveMode),
    dataset: currentApplication
      ? {
          styleButton: currentApplication.dataset.styleButton,
          styleDensity: currentApplication.dataset.styleDensity,
          styleMotion: currentApplication.dataset.styleMotion,
          stylePattern: currentApplication.dataset.stylePattern,
          styleSurface: currentApplication.dataset.styleSurface,
        }
      : {},
    effectiveMode,
    source:
      controllerState.source === 'prompt' ? 'prompt' : controllerState.source,
    themeId: controllerState.id ?? 'default',
    themeName: controllerState.name,
  };
}
