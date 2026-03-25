// @vitest-environment node

import { describe, expect, it } from 'vitest';

import { getExternalLinkProps, resolveHref } from '../lib/links';
import {
  getProjectLinks,
  getProjectPermalink,
  type ProjectEntry,
} from '../lib/projects';

function createProject(
  overrides?: Partial<{
    id: string;
    links: {
      live?: string;
      repo?: string;
      writeup?: string;
    };
  }>,
) {
  return {
    id: overrides?.id ?? 'portfolio-site-and-resume-platform',
    data: {
      links: {
        live: 'https://sethtipton.github.io',
        repo: 'https://github.com/sethtipton/sethtipton.github.io',
        writeup: undefined,
        ...overrides?.links,
      },
    },
  } as ProjectEntry;
}

describe('link helpers', () => {
  it('resolves internal and external hrefs correctly', () => {
    const internalLink = {
      href: '/work/',
    };
    const externalLink = {
      href: 'https://github.com/sethtipton',
      external: true,
    };

    expect(resolveHref(internalLink, '/portfolio/')).toBe('/portfolio/work/');
    expect(resolveHref(externalLink, '/portfolio/')).toBe(
      'https://github.com/sethtipton',
    );
  });

  it('only adds external link props for http hrefs', () => {
    expect(getExternalLinkProps('https://github.com/sethtipton')).toEqual({
      rel: 'noopener noreferrer',
      target: '_blank',
    });
    expect(getExternalLinkProps('mailto:sethtipton@gmail.com')).toEqual({});
  });
});

describe('project link helpers', () => {
  it('falls back to the project permalink when a custom writeup is missing', () => {
    const project = createProject();

    expect(getProjectPermalink(project.id, '/portfolio/')).toBe(
      '/portfolio/work/portfolio-site-and-resume-platform/',
    );
    expect(getProjectLinks(project, '/portfolio/')).toEqual({
      live: 'https://sethtipton.github.io',
      repo: 'https://github.com/sethtipton/sethtipton.github.io',
      writeup: '/portfolio/work/portfolio-site-and-resume-platform/',
    });
  });

  it('bases internal writeup overrides', () => {
    const project = createProject({
      links: {
        writeup: '/resume/',
      },
    });

    expect(getProjectLinks(project, '/portfolio/').writeup).toBe(
      '/portfolio/resume/',
    );
  });

  it('keeps external writeup overrides unchanged', () => {
    const project = createProject({
      links: {
        writeup: 'https://example.com/case-study',
      },
    });

    expect(getProjectLinks(project, '/portfolio/').writeup).toBe(
      'https://example.com/case-study',
    );
  });
});
