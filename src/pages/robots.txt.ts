import type { APIRoute } from 'astro';

import { siteMeta } from '../data/site';
import { withBase } from '../lib/paths';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL;
  const resolvedSite = site ?? new URL(siteMeta.url);
  const sitemapUrl = new URL(withBase('/sitemap.xml', base), resolvedSite);

  const body = [
    'User-agent: *',
    `Allow: ${withBase('/', base)}`,
    `Disallow: ${withBase('/resume/print/', base)}`,
    `Sitemap: ${sitemapUrl.toString()}`,
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
