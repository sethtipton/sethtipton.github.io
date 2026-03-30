import { useEffect, useMemo, useState } from 'react';

import {
  DEFAULT_STYLE_TRANSFER_CONTROLLER_STATE,
  getStyleTransferController,
  getStyleTransferControllerState,
  resolveActiveStyleTransferArtwork,
  subscribeToStyleTransferChanges,
  type StoredStyleTransferApplication,
  type StyleTransferControllerState,
} from '../../lib/style-transfer/controller';
import type { StyleTransferArtworkPreview } from '../../lib/style-transfer/artwork';
import { resolveThemeGlobeInput } from '../../lib/style-transfer/themeGlobeRuntime';
import type { ThemeGlobeActivityState } from './ThemeGlobe';
import ThemeGlobeSurface from './ThemeGlobeSurface';

type ActiveThemeGlobeProps = {
  activityState?: ThemeGlobeActivityState;
};

export default function ActiveThemeGlobe({
  activityState = 'idle',
}: ActiveThemeGlobeProps) {
  const [controllerState, setControllerState] =
    useState<StyleTransferControllerState>(
      DEFAULT_STYLE_TRANSFER_CONTROLLER_STATE,
    );
  const [currentApplication, setCurrentApplication] =
    useState<StoredStyleTransferApplication | null>(null);
  const [artworkFamily, setArtworkFamily] = useState<
    StyleTransferArtworkPreview['spec']['family'] | null
  >(null);
  const [prefersDarkScheme, setPrefersDarkScheme] = useState(false);

  useEffect(() => {
    const syncControllerState = () => {
      const controller = getStyleTransferController();
      const activeArtwork = resolveActiveStyleTransferArtwork();

      setControllerState(getStyleTransferControllerState());
      setCurrentApplication(controller?.getCurrentApplication?.() ?? null);
      setArtworkFamily(activeArtwork.artwork?.spec.family ?? null);
    };

    syncControllerState();

    return subscribeToStyleTransferChanges(
      syncControllerState as EventListener,
    );
  }, []);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const syncPreference = () => {
      setPrefersDarkScheme(mediaQuery.matches);
    };

    syncPreference();
    mediaQuery.addEventListener('change', syncPreference);

    return () => {
      mediaQuery.removeEventListener('change', syncPreference);
    };
  }, []);

  const globeProps = useMemo(
    () =>
      resolveThemeGlobeInput({
        artworkFamily,
        controllerState,
        currentApplication,
        prefersDarkScheme,
      }),
    [artworkFamily, controllerState, currentApplication, prefersDarkScheme],
  );

  return (
    <ThemeGlobeSurface
      {...globeProps}
      activityState={activityState}
      cameraPositionZ={4.1}
      dpr={[2, 3]}
      fallbackAppearance="empty"
      showOutlines
    />
  );
}
