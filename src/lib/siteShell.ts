import { initializeSiteThemeController } from './style-transfer/siteThemeController';

const DEBUG_SIGNATURE_BREAKPOINTS_QUERY_PARAM = 'debug';

type SiteShellWindow = typeof window & {
  __siteShellReadyBound?: boolean;
  __siteShellPageLoadBound?: boolean;
};

function syncDebugFlags() {
  const params = new URL(window.location.href).searchParams;
  const value = params.get(DEBUG_SIGNATURE_BREAKPOINTS_QUERY_PARAM);
  const enabled =
    value !== null &&
    (value === '' ||
      value.toLowerCase() === '1' ||
      value.toLowerCase() === 'true' ||
      value.toLowerCase() === 'on');

  if (enabled) {
    document.documentElement.dataset.debugSignatureBreakpoints = 'true';
    return;
  }

  delete document.documentElement.dataset.debugSignatureBreakpoints;
}

function syncSiteShellState() {
  syncDebugFlags();
  initializeSiteThemeController();
}

export function initializeSiteShell() {
  const siteShellWindow = window as SiteShellWindow;

  if (document.readyState === 'loading') {
    if (!siteShellWindow.__siteShellReadyBound) {
      document.addEventListener('DOMContentLoaded', syncSiteShellState, {
        once: true,
      });
      siteShellWindow.__siteShellReadyBound = true;
    }
  } else {
    syncSiteShellState();
  }

  if (!siteShellWindow.__siteShellPageLoadBound) {
    document.addEventListener('astro:page-load', syncSiteShellState);
    siteShellWindow.__siteShellPageLoadBound = true;
  }
}
