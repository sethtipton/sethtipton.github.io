import { beforeEach, describe, expect, it } from 'vitest';

import {
  applyThemeQueryParams,
  syncThemeQueryLinks,
} from '../lib/style-transfer/themeQuery';

describe('theme query helpers', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    window.history.replaceState(
      {},
      '',
      '/?style=toasted-marshmallow&mode=light',
    );
  });

  it('applies the current style and mode params to a target URL', () => {
    const targetUrl = new URL('/work/', window.location.href);
    const currentUrl = new URL(window.location.href);

    expect(applyThemeQueryParams(targetUrl, currentUrl).toString()).toBe(
      'http://localhost:3000/work/?style=toasted-marshmallow&mode=light',
    );
  });

  it('only syncs links that explicitly opt in to theme-query preservation', () => {
    document.body.innerHTML = `
      <a id="theme-link" href="/work/" data-theme-query-link>Work</a>
      <a id="plain-link" href="/resume/">Resume</a>
    `;

    syncThemeQueryLinks(document);

    expect(document.getElementById('theme-link')?.getAttribute('href')).toBe(
      '/work/?style=toasted-marshmallow&mode=light',
    );
    expect(document.getElementById('plain-link')?.getAttribute('href')).toBe(
      '/resume/',
    );
  });
});
