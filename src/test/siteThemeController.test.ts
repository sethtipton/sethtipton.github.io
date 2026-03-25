import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { STYLE_TRANSFER_EVENT } from '../lib/style-transfer/controller';
import { deriveStyleTransferApplication } from '../lib/style-transfer/deriveTheme';
import { styleTransferPresetApplications } from '../lib/style-transfer/presets';
import { createCustomStyleTransferThemeRecord } from '../lib/style-transfer/schema';
import { initializeSiteThemeController } from '../lib/style-transfer/siteThemeController';

type ThemeWindow = typeof window & {
  __siteStyleTransfer?: {
    applyApplication: (
      application: ReturnType<typeof deriveStyleTransferApplication>,
    ) => void;
    applyGeneratedTheme: (themeId: string) => boolean;
    applyPreset: (presetId: string) => boolean;
    setMode: (mode: 'auto' | 'light' | 'dark') => boolean;
    getGeneratedThemes: () => Array<{
      id: string;
      name: string;
      prompt: string | null;
    }>;
    getState: () => {
      id: string | null;
      name: string;
      prompt: string | null;
      source: 'default' | 'preset' | 'prompt';
    };
    reset: () => void;
  };
  __siteThemeControllerInitialized?: boolean;
  __syncSiteStyleTransfer?: () => void;
  __syncSiteTheme?: () => void;
};

function createStorageMock() {
  const store = new Map<string, string>();

  return {
    clear: () => {
      store.clear();
    },
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => [...store.keys()][index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    get length() {
      return store.size;
    },
  } satisfies Storage;
}

function createMatchMediaStub(prefersDark = false) {
  return vi.fn().mockImplementation((query: string) => ({
    matches:
      query === '(prefers-color-scheme: dark)'
        ? prefersDark
        : query === '(prefers-reduced-motion: reduce)'
          ? false
          : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => true,
  }));
}

function createGeneratedApplication(
  prompt: string,
  options: {
    accentDark: string;
    accentLight: string;
    backgroundDark: string;
    backgroundLight: string;
    name: string;
    surfaceDark: string;
    surfaceLight: string;
  },
) {
  const record = createCustomStyleTransferThemeRecord(prompt, {
    styleName: options.name,
    palette: {
      background: {
        light: options.backgroundLight,
        dark: options.backgroundDark,
      },
      backgroundAlt: { light: '#eef2f6', dark: '#18212b' },
      surface: { light: options.surfaceLight, dark: options.surfaceDark },
      surfaceStrong: { light: '#d7dee6', dark: '#243341' },
      surfaceTint: { light: '#f6f8fb', dark: '#1b2631' },
      surfacePaper: { light: '#ffffff', dark: '#121821' },
      text: { light: '#111827', dark: '#f8fafc' },
      muted: { light: '#4b5563', dark: '#cbd5e1' },
      accent: {
        light: options.accentLight,
        dark: options.accentDark,
      },
      accentStrong: {
        light: options.accentLight,
        dark: options.accentDark,
      },
      focus: { light: '#2563eb', dark: '#fde68a' },
    },
    fonts: {
      sans: 'neo-grotesk',
      serif: 'editorial',
    },
    density: 'airy',
    surfaceStyle: 'glass',
    buttonStyle: 'outline',
    pattern: 'grid',
    motion: 'calm',
  });

  return deriveStyleTransferApplication(record);
}

function resetThemeEnvironment() {
  const themeWindow = window as ThemeWindow;

  themeWindow.localStorage?.clear?.();
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('style');

  Object.keys(document.documentElement.dataset).forEach((key) => {
    delete document.documentElement.dataset[key];
  });

  delete themeWindow.__siteStyleTransfer;
  delete themeWindow.__siteThemeControllerInitialized;
  delete themeWindow.__syncSiteStyleTransfer;
  delete themeWindow.__syncSiteTheme;

  window.history.replaceState({}, '', '/');
}

describe('initializeSiteThemeController', () => {
  beforeEach(() => {
    resetThemeEnvironment();
    vi.stubGlobal('matchMedia', createMatchMediaStub());
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: createStorageMock(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetThemeEnvironment();
  });

  it('applies stored mode and preset state to dataset, css vars, and meta theme-color', () => {
    const application = styleTransferPresetApplications['toasted-marshmallow'];

    document.head.innerHTML = '<meta name="theme-color" content="#000000" />';
    window.localStorage.setItem('theme-preference', 'light');
    window.localStorage.setItem(
      'site-style-transfer-v1',
      'toasted-marshmallow',
    );

    initializeSiteThemeController();

    expect(document.documentElement.dataset.styleId).toBe(
      'toasted-marshmallow',
    );
    expect(document.documentElement.dataset.styleSource).toBe('preset');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.dataset.themeMode).toBe('light');
    expect(
      document.documentElement.style.getPropertyValue('--color-background'),
    ).toBe(application.cssVars['--color-background']);
    expect(
      document
        .querySelector('meta[name="theme-color"]')
        ?.getAttribute('content'),
    ).toBe(application.themeColor.light);
  });

  it('keeps mode preference while reset clears the stored preset state', () => {
    document.head.innerHTML = '<meta name="theme-color" content="#000000" />';
    window.localStorage.setItem('theme-preference', 'light');
    window.localStorage.setItem(
      'site-style-transfer-v1',
      'toasted-marshmallow',
    );

    initializeSiteThemeController();

    const themeWindow = window as ThemeWindow;
    const controller = themeWindow.__siteStyleTransfer;

    expect(controller).toBeTruthy();

    controller?.reset();

    expect(document.documentElement.dataset.styleId).toBeUndefined();
    expect(window.localStorage.getItem('theme-preference')).toBe('light');
    expect(window.localStorage.getItem('site-style-transfer-v1')).toBeNull();

    expect(controller?.applyPreset('chromatic-minimal')).toBe(true);
    expect(document.documentElement.dataset.styleId).toBe('chromatic-minimal');
    expect(window.localStorage.getItem('site-style-transfer-v1')).toBe(
      'chromatic-minimal',
    );
  });

  it('keeps generated theme order stable when switching between existing remixes', () => {
    initializeSiteThemeController();

    const controller = (window as ThemeWindow).__siteStyleTransfer;

    expect(controller).toBeTruthy();

    const sunsetApplication = createGeneratedApplication(
      'sunset ocean teal glassmorphism',
      {
        accentDark: '#d85947',
        accentLight: '#ff6f61',
        backgroundDark: '#16232d',
        backgroundLight: '#f7fbff',
        name: 'Sunset Ocean Teal',
        surfaceDark: '#2c4a54',
        surfaceLight: '#ffffff',
      },
    );
    const monochromeApplication = createGeneratedApplication(
      'monochrome black and white with neon lime',
      {
        accentDark: '#afff00',
        accentLight: '#afff00',
        backgroundDark: '#050505',
        backgroundLight: '#f5f5f5',
        name: 'Monochrome with Neon Lime',
        surfaceDark: '#000000',
        surfaceLight: '#ffffff',
      },
    );

    controller?.applyApplication(sunsetApplication);
    controller?.applyApplication(monochromeApplication);

    expect(controller?.getGeneratedThemes().map((theme) => theme.id)).toEqual([
      monochromeApplication.id,
      sunsetApplication.id,
    ]);

    expect(controller?.applyGeneratedTheme(sunsetApplication.id)).toBe(true);
    expect(controller?.getState().id).toBe(sunsetApplication.id);
    expect(controller?.getGeneratedThemes().map((theme) => theme.id)).toEqual([
      monochromeApplication.id,
      sunsetApplication.id,
    ]);

    expect(controller?.applyGeneratedTheme(monochromeApplication.id)).toBe(
      true,
    );
    expect(controller?.getState().id).toBe(monochromeApplication.id);
    expect(controller?.getGeneratedThemes().map((theme) => theme.id)).toEqual([
      monochromeApplication.id,
      sunsetApplication.id,
    ]);
  });

  it('does not emit duplicate style-transfer events when sync keeps the same theme state', () => {
    document.head.innerHTML = '<meta name="theme-color" content="#000000" />';
    window.localStorage.setItem('theme-preference', 'light');
    window.localStorage.setItem(
      'site-style-transfer-v1',
      'toasted-marshmallow',
    );

    initializeSiteThemeController();
    const themeWindow = window as ThemeWindow;

    const listener = vi.fn();
    window.addEventListener(STYLE_TRANSFER_EVENT, listener);

    try {
      themeWindow.__syncSiteStyleTransfer?.();
      themeWindow.__syncSiteTheme?.();
      expect(listener).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener(STYLE_TRANSFER_EVENT, listener);
    }
  });

  it('updates mode state and query params across repeated explicit mode changes', () => {
    initializeSiteThemeController();

    const controller = (window as ThemeWindow).__siteStyleTransfer;

    expect(controller).toBeTruthy();
    expect(controller?.getState().mode).toBe('auto');
    expect(window.location.search).toBe('');

    expect(controller?.setMode('light')).toBe(true);
    expect(controller?.getState().mode).toBe('light');
    expect(document.documentElement.dataset.themeMode).toBe('light');
    expect(window.location.search).toBe('?mode=light');

    expect(controller?.setMode('dark')).toBe(true);
    expect(controller?.getState().mode).toBe('dark');
    expect(document.documentElement.dataset.themeMode).toBe('dark');
    expect(window.location.search).toBe('?mode=dark');
  });

  it('falls back to mode-only behavior when required CSS color features are unsupported', () => {
    vi.stubGlobal('CSS', {
      supports: vi.fn(() => false),
    });

    document.head.innerHTML = '<meta name="theme-color" content="#000000" />';
    window.localStorage.setItem('theme-preference', 'dark');
    window.localStorage.setItem(
      'site-style-transfer-v1',
      'toasted-marshmallow',
    );

    initializeSiteThemeController();

    const themeWindow = window as ThemeWindow;

    expect(themeWindow.__siteStyleTransfer).toBeUndefined();
    expect(document.documentElement.dataset.styleTransferSupported).toBe(
      'false',
    );
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.dataset.themeMode).toBe('dark');
    expect(document.documentElement.dataset.styleId).toBeUndefined();
    expect(
      document
        .querySelector('meta[name="theme-color"]')
        ?.getAttribute('content'),
    ).toBe('#0e1419');
  });
});
