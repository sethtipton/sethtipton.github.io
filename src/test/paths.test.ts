import { describe, expect, it } from 'vitest';

import { withBase } from '../lib/paths';

describe('withBase', () => {
  it('keeps root-based paths unchanged when the base path is root', () => {
    expect(withBase('/', '/')).toBe('/');
    expect(withBase('/work/', '/')).toBe('/work/');
    expect(withBase('/resume/print/', '/')).toBe('/resume/print/');
  });

  it('prefixes project-site bases and normalizes missing trailing slashes', () => {
    expect(withBase('/', '/portfolio')).toBe('/portfolio/');
    expect(withBase('/work/', '/portfolio')).toBe('/portfolio/work/');
    expect(withBase('/resume/print/', '/portfolio/')).toBe(
      '/portfolio/resume/print/',
    );
  });

  it('returns already-normalized non-root paths unchanged', () => {
    expect(withBase('mailto:seth@example.com', '/portfolio/')).toBe(
      'mailto:seth@example.com',
    );
    expect(withBase('https://example.com/work/', '/portfolio/')).toBe(
      'https://example.com/work/',
    );
  });

  it('falls back to the root base when no base path is available', () => {
    expect(withBase('/', undefined)).toBe('/');
    expect(withBase('/work/', undefined)).toBe('/work/');
  });
});
