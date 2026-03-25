import { siteMeta } from '../../data/site';
import {
  STYLE_TRANSFER_EVENT,
  STYLE_TRANSFER_PANEL_OPEN_DATASET_KEY,
  type StyleTransferController,
  type StyleTransferControllerState,
  type StoredStyleTransferApplication,
  type StyleTransferMode,
} from './controller';
import {
  styleTransferCssVarKeys,
  styleTransferDatasetKeys,
} from './deriveTheme';
import { isStyleTransferDebugEnabled } from './debug';
import {
  styleTransferPresetApplications,
  styleTransferPresetSummaries,
} from './presets';
import { getStyleTransferSupportStatus } from './support';
import {
  MODE_QUERY_PARAM_KEY,
  STYLE_QUERY_PARAM_KEY,
  syncThemeQueryLinks,
} from './themeQuery';

const themeStorageKey = 'theme-preference';
const styleStorageKey = 'site-style-transfer-v1';
const customStyleStorageKey = 'site-style-transfer-custom-v1';
const customStyleHistoryKey = 'site-style-transfer-custom-history-v1';
const artworkSlotKeys = [
  'sectionBackground',
  'scrim',
  'divider',
  'accentGraphic',
] as const;
function getThemeColorMeta() {
  return document.querySelector('meta[name="theme-color"]');
}

function logStyleTransfer(message: string, payload?: unknown) {
  if (!isStyleTransferDebugEnabled()) {
    return;
  }

  if (typeof payload === 'undefined') {
    console.info(`[style-transfer] ${message}`);
    return;
  }

  console.info(`[style-transfer] ${message}`, payload);
}

function logStyleTransferDetail(message: string, payload: unknown) {
  if (!isStyleTransferDebugEnabled()) {
    return;
  }

  console.debug(`[style-transfer] ${message}`, payload);
}

function getStyleDebugSnapshot(root: HTMLElement) {
  const computed = window.getComputedStyle(root);

  return {
    colorAccent: computed.getPropertyValue('--color-accent').trim(),
    colorBackground: computed.getPropertyValue('--color-background').trim(),
    styleId: root.dataset.styleId ?? null,
    styleSource: root.dataset.styleSource ?? null,
  };
}

function sanitizeMode(value: string | null | undefined): StyleTransferMode {
  return value === 'dark' || value === 'light' ? value : 'auto';
}

function getQueryMode() {
  if (typeof window === 'undefined') {
    return null;
  }

  const value = new URL(window.location.href).searchParams.get(
    MODE_QUERY_PARAM_KEY,
  );

  return value === 'auto' || value === 'dark' || value === 'light'
    ? value
    : null;
}

function sanitizePresetId(value: string | null | undefined) {
  return typeof value === 'string' && value in styleTransferPresetApplications
    ? value
    : null;
}

function getQueryPresetId() {
  if (typeof window === 'undefined') {
    return null;
  }

  return sanitizePresetId(
    new URL(window.location.href).searchParams.get(STYLE_QUERY_PARAM_KEY),
  );
}

function isSameStyleTransferState(
  left: StyleTransferControllerState | null,
  right: StyleTransferControllerState,
) {
  if (!left) {
    return false;
  }

  return (
    left.id === right.id &&
    left.mode === right.mode &&
    left.name === right.name &&
    left.prompt === right.prompt &&
    left.source === right.source &&
    left.presetId === right.presetId
  );
}

function getStoredMode() {
  try {
    return sanitizeMode(window.localStorage.getItem(themeStorageKey));
  } catch {
    return 'auto';
  }
}

function getResolvedMode() {
  return getQueryMode() ?? getStoredMode();
}

function applyRootThemeMode({
  mediaQuery,
  mode,
  root,
  themeColorPair,
}: {
  mediaQuery: MediaQueryList;
  mode: StyleTransferMode;
  root: HTMLElement;
  themeColorPair: {
    dark: string;
    light: string;
  };
}) {
  const effectiveTheme = getEffectiveTheme(mode, mediaQuery);

  if (mode === 'auto') {
    root.removeAttribute('data-theme');
  } else {
    root.dataset.theme = mode;
  }

  root.dataset.themeMode = mode;

  const themeColorMeta = getThemeColorMeta();

  if (themeColorMeta) {
    themeColorMeta.setAttribute(
      'content',
      effectiveTheme === 'dark' ? themeColorPair.dark : themeColorPair.light,
    );
  }
}

function getStoredPresetId() {
  const queryPresetId = getQueryPresetId();

  if (queryPresetId) {
    return queryPresetId;
  }

  try {
    return sanitizePresetId(window.localStorage.getItem(styleStorageKey));
  } catch {
    return null;
  }
}

function setStoredPresetId(value: string | null) {
  try {
    if (value) {
      window.localStorage.setItem(styleStorageKey, value);
    } else {
      window.localStorage.removeItem(styleStorageKey);
    }
  } catch {
    // Ignore storage failures.
  }
}

function sanitizeCustomApplication(
  value: unknown,
): StoredStyleTransferApplication | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const application = value as Record<string, unknown>;

  if (
    typeof application.id !== 'string' ||
    typeof application.name !== 'string' ||
    typeof application.source !== 'string' ||
    !application.cssVars ||
    typeof application.cssVars !== 'object' ||
    !application.dataset ||
    typeof application.dataset !== 'object' ||
    !application.themeColor ||
    typeof application.themeColor !== 'object' ||
    typeof (application.themeColor as Record<string, unknown>).light !==
      'string' ||
    typeof (application.themeColor as Record<string, unknown>).dark !== 'string'
  ) {
    return null;
  }

  const cssVars: Record<string, string> = {};
  const dataset: Record<string, string> = {};
  let artwork = null;
  const rawCssVars = application.cssVars as Record<string, unknown>;
  const rawDataset = application.dataset as Record<string, unknown>;
  const rawThemeColor = application.themeColor as Record<string, string>;

  styleTransferCssVarKeys.forEach((key) => {
    if (typeof rawCssVars[key] === 'string') {
      cssVars[key] = rawCssVars[key] as string;
    }
  });

  styleTransferDatasetKeys.forEach((key) => {
    if (typeof rawDataset[key] === 'string') {
      dataset[key] = rawDataset[key] as string;
    }
  });

  if (
    application.artwork &&
    typeof application.artwork === 'object' &&
    typeof (application.artwork as Record<string, unknown>).slotKey ===
      'string' &&
    artworkSlotKeys.includes(
      (application.artwork as Record<string, unknown>)
        .slotKey as (typeof artworkSlotKeys)[number],
    ) &&
    typeof (application.artwork as Record<string, unknown>).source ===
      'string' &&
    ['preset', 'api', 'fallback'].includes(
      (application.artwork as Record<string, unknown>).source as string,
    ) &&
    (application.artwork as Record<string, unknown>).spec &&
    typeof (application.artwork as Record<string, unknown>).spec === 'object'
  ) {
    artwork = {
      slotKey: (application.artwork as Record<string, unknown>).slotKey,
      source: (application.artwork as Record<string, unknown>).source,
      spec: (application.artwork as Record<string, unknown>).spec,
    } as StoredStyleTransferApplication['artwork'];
  }

  return {
    artwork,
    id: application.id,
    name: application.name,
    prompt: typeof application.prompt === 'string' ? application.prompt : null,
    source:
      application.source === 'prompt'
        ? 'prompt'
        : (application.source as string),
    cssVars,
    dataset,
    themeColor: {
      light: rawThemeColor.light,
      dark: rawThemeColor.dark,
    },
  } as StoredStyleTransferApplication;
}

function sanitizeCustomHistory(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenIds = new Set<string>();
  const history: StoredStyleTransferApplication[] = [];

  value.forEach((entry) => {
    const application = sanitizeCustomApplication(entry);

    if (!application || seenIds.has(application.id)) {
      return;
    }

    seenIds.add(application.id);
    history.push(application);
  });

  return history.slice(0, 5);
}

function getStoredCustomHistory() {
  try {
    const raw = window.localStorage.getItem(customStyleHistoryKey);

    if (!raw) {
      return [];
    }

    return sanitizeCustomHistory(JSON.parse(raw));
  } catch {
    return [];
  }
}

function clearStoredCustomApplication() {
  try {
    window.localStorage.removeItem(customStyleStorageKey);
  } catch {
    // Ignore storage failures.
  }
}

function setStoredCustomHistory(value: StoredStyleTransferApplication[]) {
  try {
    const history = sanitizeCustomHistory(value);

    if (history.length > 0) {
      window.localStorage.setItem(
        customStyleHistoryKey,
        JSON.stringify(history),
      );
    } else {
      window.localStorage.removeItem(customStyleHistoryKey);
    }
  } catch {
    // Ignore storage failures.
  }
}

function pushStoredCustomHistory(application: StoredStyleTransferApplication) {
  const nextHistory = [
    application,
    ...getStoredCustomHistory().filter((entry) => entry.id !== application.id),
  ];

  setStoredCustomHistory(nextHistory);
}

function getEffectiveTheme(
  mode: StyleTransferMode,
  mediaQuery: MediaQueryList,
) {
  return mode === 'auto' ? (mediaQuery.matches ? 'dark' : 'light') : mode;
}

function withStyleTransition(callback: () => void, enabled = true) {
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;
  const isStyleTransferPanelOpen =
    document.documentElement.dataset[STYLE_TRANSFER_PANEL_OPEN_DATASET_KEY] ===
    'true';

  if (
    !enabled ||
    isStyleTransferPanelOpen ||
    prefersReducedMotion ||
    typeof document.startViewTransition !== 'function'
  ) {
    callback();
    return;
  }

  document.startViewTransition(() => {
    callback();
  });
}

export function initializeSiteThemeController() {
  const themeWindow = window;
  const root = document.documentElement;
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const supportStatus = getStyleTransferSupportStatus();

  root.dataset.styleTransferSupported = supportStatus.supported
    ? 'true'
    : 'false';

  if (!supportStatus.supported) {
    const currentMode = getResolvedMode();

    applyRootThemeMode({
      mediaQuery,
      mode: currentMode,
      root,
      themeColorPair: siteMeta.themeColor,
    });

    delete root.dataset[STYLE_TRANSFER_PANEL_OPEN_DATASET_KEY];
    delete themeWindow.__siteStyleTransfer;
    delete themeWindow.__syncSiteStyleTransfer;
    delete themeWindow.__syncSiteTheme;
    delete themeWindow.__syncThemeQueryLinks;
    delete themeWindow.__siteThemeControllerInitialized;

    return;
  }

  if (themeWindow.__siteThemeControllerInitialized) {
    themeWindow.__syncSiteStyleTransfer?.();
    themeWindow.__syncSiteTheme?.();
    return;
  }
  let currentStyleApplication: StoredStyleTransferApplication | null = null;
  let currentMode: StyleTransferMode = getResolvedMode();
  let lastEmittedStyleState: StyleTransferControllerState | null = null;

  const commitStyleApplication = (
    application: StoredStyleTransferApplication,
  ) => {
    currentStyleApplication = application;
    logStyleTransfer('commit application', {
      dataset: application.dataset,
      id: application.id,
      name: application.name,
      source: application.source,
    });

    styleTransferCssVarKeys.forEach((key) => {
      const value = application.cssVars[key];

      if (value) {
        root.style.setProperty(key, value);
        logStyleTransferDetail('set css var', {
          key,
          value,
        });
      } else {
        root.style.removeProperty(key);
        logStyleTransferDetail('remove css var', {
          key,
        });
      }
    });

    styleTransferDatasetKeys.forEach((key) => {
      root.dataset[key] = application.dataset[key] ?? '';
      logStyleTransferDetail('set dataset key', {
        key,
        value: root.dataset[key],
      });
    });

    logStyleTransfer('post-commit snapshot', getStyleDebugSnapshot(root));
  };

  const commitStyleReset = () => {
    currentStyleApplication = null;
    logStyleTransfer('commit reset');

    styleTransferCssVarKeys.forEach((key) => {
      root.style.removeProperty(key);
      logStyleTransferDetail('remove css var', {
        key,
      });
    });

    styleTransferDatasetKeys.forEach((key) => {
      delete root.dataset[key];
      logStyleTransferDetail('delete dataset key', {
        key,
      });
    });

    logStyleTransfer('post-reset snapshot', getStyleDebugSnapshot(root));
  };

  const getStyleState = (): StyleTransferControllerState => {
    if (!currentStyleApplication) {
      return {
        id: null,
        name: 'Original Canvas',
        mode: currentMode,
        prompt: null,
        source: 'default',
        presetId: null,
      };
    }

    const presetId =
      currentStyleApplication.source === 'preset' &&
      currentStyleApplication.id in styleTransferPresetApplications
        ? currentStyleApplication.id
        : null;

    return {
      id: currentStyleApplication.id,
      name: currentStyleApplication.name,
      mode: currentMode,
      prompt: currentStyleApplication.prompt ?? null,
      source: currentStyleApplication.source,
      presetId,
    };
  };

  const getThemeColorPair = () =>
    currentStyleApplication?.themeColor ?? siteMeta.themeColor;

  const syncThemeQueryState = (state: StyleTransferControllerState) => {
    const nextUrl = new URL(window.location.href);

    if (state.source === 'preset' && state.presetId) {
      nextUrl.searchParams.set(STYLE_QUERY_PARAM_KEY, state.presetId);
    } else {
      nextUrl.searchParams.delete(STYLE_QUERY_PARAM_KEY);
    }

    if (state.mode === 'auto') {
      nextUrl.searchParams.delete(MODE_QUERY_PARAM_KEY);
    } else {
      nextUrl.searchParams.set(MODE_QUERY_PARAM_KEY, state.mode);
    }

    const nextHref = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
    const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (nextHref !== currentHref) {
      window.history.replaceState(window.history.state, '', nextHref);
    }

    syncThemeQueryLinks(document);
  };

  const emitStyleTransferChange = () => {
    const nextState = getStyleState();

    syncThemeQueryState(nextState);

    if (isSameStyleTransferState(lastEmittedStyleState, nextState)) {
      return;
    }

    lastEmittedStyleState = { ...nextState };
    window.dispatchEvent(
      new CustomEvent(STYLE_TRANSFER_EVENT, {
        detail: nextState,
      }),
    );
  };

  const applyMode = (mode: StyleTransferMode) => {
    applyRootThemeMode({
      mediaQuery,
      mode,
      root,
      themeColorPair: getThemeColorPair(),
    });
  };

  const setModePreference = (
    mode: StyleTransferMode,
    {
      transition = true,
      emit = true,
      persist = true,
    }: {
      transition?: boolean;
      emit?: boolean;
      persist?: boolean;
    } = {},
  ) => {
    const sanitizedMode = sanitizeMode(mode);
    currentMode = sanitizedMode;

    if (persist) {
      try {
        if (sanitizedMode === 'auto') {
          window.localStorage.removeItem(themeStorageKey);
        } else {
          window.localStorage.setItem(themeStorageKey, sanitizedMode);
        }
      } catch {
        // Ignore storage failures and still apply the current session override.
      }
    }

    withStyleTransition(() => {
      applyMode(sanitizedMode);

      if (emit) {
        emitStyleTransferChange();
      }
    }, transition);

    return sanitizedMode;
  };

  const syncTheme = () => {
    currentMode = getResolvedMode();
    applyMode(currentMode);
    emitStyleTransferChange();
  };

  const applyPresetById = (
    presetId: string | null,
    {
      transition = true,
      persist = true,
    }: {
      transition?: boolean;
      persist?: boolean;
    } = {},
  ) => {
    if (!presetId) {
      return false;
    }

    const application = styleTransferPresetApplications[presetId];

    if (!application) {
      return false;
    }

    withStyleTransition(() => {
      commitStyleApplication(application);
      applyMode(currentMode);
      emitStyleTransferChange();
    }, transition);

    if (persist) {
      setStoredPresetId(presetId);
      clearStoredCustomApplication();
    }

    return true;
  };

  const applyCustomApplication = (
    application: StoredStyleTransferApplication,
    {
      transition = true,
      persist = true,
    }: {
      transition?: boolean;
      persist?: boolean;
    } = {},
  ) => {
    withStyleTransition(() => {
      commitStyleApplication(application);
      applyMode(currentMode);

      setStoredPresetId(null);
      clearStoredCustomApplication();

      if (persist) {
        pushStoredCustomHistory(application);
      }

      emitStyleTransferChange();
    }, transition);
  };

  const resetStyleTransfer = ({
    transition = true,
    clearPersistence = true,
    emit = true,
  }: {
    transition?: boolean;
    clearPersistence?: boolean;
    emit?: boolean;
  } = {}) => {
    withStyleTransition(() => {
      commitStyleReset();
      applyMode(currentMode);

      if (emit) {
        emitStyleTransferChange();
      }
    }, transition);

    if (clearPersistence) {
      setStoredPresetId(null);
      clearStoredCustomApplication();
    }
  };

  const syncStyleTransfer = () => {
    currentMode = getResolvedMode();
    const storedPresetId = getStoredPresetId();

    if (storedPresetId) {
      applyPresetById(storedPresetId, {
        transition: false,
        persist: false,
      });
      return;
    }

    if (currentStyleApplication) {
      commitStyleApplication(currentStyleApplication);
      applyMode(currentMode);
      emitStyleTransferChange();
      return;
    }

    resetStyleTransfer({
      transition: false,
      clearPersistence: false,
      emit: false,
    });
  };

  const handlePreferenceChange = () => {
    if (getResolvedMode() === 'auto') {
      syncTheme();
    }
  };

  mediaQuery.addEventListener('change', handlePreferenceChange);

  themeWindow.__siteStyleTransfer = {
    getCurrentApplication: () => currentStyleApplication,
    getState: getStyleState,
    getMode: () => currentMode,
    getPresets: () => styleTransferPresetSummaries,
    getGeneratedThemes: () =>
      getStoredCustomHistory().map((application) => ({
        application,
        id: application.id,
        name: application.name,
        prompt: application.prompt ?? null,
        artwork: application.artwork ?? null,
      })),
    setMode: (mode) => {
      setModePreference(mode);
      return true;
    },
    applyPreset: (presetId) => applyPresetById(sanitizePresetId(presetId)),
    applyGeneratedTheme: (themeId) => {
      const application = getStoredCustomHistory().find(
        (entry) => entry.id === themeId,
      );

      if (!application) {
        return false;
      }

      // Keep generated theme history stable when revisiting an existing remix.
      applyCustomApplication(application, {
        persist: false,
      });
      return true;
    },
    applyApplication: (application, options = {}) => {
      applyCustomApplication({
        ...application,
        artwork: options.artwork ?? null,
      });
    },
    reset: () => {
      resetStyleTransfer({
        transition: true,
        clearPersistence: true,
        emit: true,
      });
    },
    sync: syncStyleTransfer,
  } satisfies StyleTransferController;
  themeWindow.__syncSiteStyleTransfer = syncStyleTransfer;
  themeWindow.__syncSiteTheme = syncTheme;
  themeWindow.__syncThemeQueryLinks = () => {
    syncThemeQueryLinks(document);
  };
  themeWindow.__siteThemeControllerInitialized = true;

  clearStoredCustomApplication();
  syncStyleTransfer();
}
