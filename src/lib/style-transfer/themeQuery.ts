export const STYLE_QUERY_PARAM_KEY = 'style';
export const MODE_QUERY_PARAM_KEY = 'mode';
export const THEME_QUERY_LINK_SELECTOR = '[data-theme-query-link]';

export function applyThemeQueryParams(targetUrl: URL, currentUrl: URL) {
  const styleParam = currentUrl.searchParams.get(STYLE_QUERY_PARAM_KEY);
  const modeParam = currentUrl.searchParams.get(MODE_QUERY_PARAM_KEY);

  if (styleParam) {
    targetUrl.searchParams.set(STYLE_QUERY_PARAM_KEY, styleParam);
  } else {
    targetUrl.searchParams.delete(STYLE_QUERY_PARAM_KEY);
  }

  if (modeParam) {
    targetUrl.searchParams.set(MODE_QUERY_PARAM_KEY, modeParam);
  } else {
    targetUrl.searchParams.delete(MODE_QUERY_PARAM_KEY);
  }

  return targetUrl;
}

export function syncThemeQueryLinks(root: ParentNode = document) {
  const currentUrl = new URL(window.location.href);

  root.querySelectorAll(THEME_QUERY_LINK_SELECTOR).forEach((node) => {
    if (!(node instanceof HTMLAnchorElement)) {
      return;
    }

    const rawHref = node.getAttribute('href');

    if (
      !rawHref ||
      rawHref.startsWith('#') ||
      (node.target && node.target !== '_self') ||
      node.hasAttribute('download')
    ) {
      return;
    }

    const nextUrl = new URL(node.href, window.location.href);

    if (nextUrl.origin !== window.location.origin) {
      return;
    }

    applyThemeQueryParams(nextUrl, currentUrl);

    const nextHref = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;

    if (rawHref !== nextHref) {
      node.setAttribute('href', nextHref);
    }
  });
}
