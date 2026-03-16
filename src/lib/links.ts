import { withBase } from './paths';

type LinkLike = {
  href: string;
  external?: boolean;
};

export function isHttpHref(href: string) {
  return /^https?:\/\//.test(href);
}

export function isOutboundHref(href: string) {
  return isHttpHref(href) || href.startsWith('mailto:');
}

export function resolveHref(link: LinkLike, base: string) {
  return link.external ? link.href : withBase(link.href, base);
}

export function getExternalLinkProps(href: string) {
  return isHttpHref(href)
    ? {
        target: '_blank' as const,
        rel: 'noreferrer' as const,
      }
    : {};
}
