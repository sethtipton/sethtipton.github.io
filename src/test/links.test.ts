import { describe, expect, it } from 'vitest';

import { getExternalLinkProps } from '../lib/links';

describe('getExternalLinkProps', () => {
  it('adds explicit noopener and noreferrer to HTTP links', () => {
    expect(getExternalLinkProps('https://example.com')).toEqual({
      rel: 'noopener noreferrer',
      target: '_blank',
    });
  });

  it('does not force new-tab behavior for mailto links', () => {
    expect(getExternalLinkProps('mailto:sethtipton@gmail.com')).toEqual({});
  });
});
