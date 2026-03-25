import type {
  StoredStyleTransferApplication,
  StyleTransferMode,
} from './controller';

export type StyleTransferSyncTarget =
  | {
      type: 'preset';
      presetId: string;
    }
  | {
      type: 'current';
      application: StoredStyleTransferApplication;
    }
  | {
      type: 'default';
    };

export function resolveStyleTransferMode(
  modeFromUrl: StyleTransferMode | null,
  storedMode: StyleTransferMode,
) {
  return modeFromUrl ?? storedMode;
}

export function resolveStyleTransferSyncTarget(options: {
  currentStyleApplication: StoredStyleTransferApplication | null;
  storedPresetId: string | null;
  urlPresetId: string | null;
}): StyleTransferSyncTarget {
  const { currentStyleApplication, storedPresetId, urlPresetId } = options;

  if (urlPresetId) {
    return {
      type: 'preset',
      presetId: urlPresetId,
    };
  }

  if (storedPresetId) {
    return {
      type: 'preset',
      presetId: storedPresetId,
    };
  }

  if (currentStyleApplication) {
    return {
      type: 'current',
      application: currentStyleApplication,
    };
  }

  return {
    type: 'default',
  };
}
