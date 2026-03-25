import type { APIRoute } from 'astro';

import { siteMeta } from '../data/site';
import { withBase } from '../lib/paths';
import { getProjectPermalink, getProjects } from '../lib/projects';

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
  const base = import.meta.env.BASE_URL;
  const resolvedSite = site ?? new URL(siteMeta.url);
  const projects = await getProjects();
  const routes = [
    withBase('/', base),
    withBase('/work/', base),
    withBase('/resume/', base),
    ...projects.map((project) => getProjectPermalink(project.id, base)),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes
    .map(
      (route) =>
        `  <url><loc>${new URL(route, resolvedSite).toString()}</loc></url>`,
    )
    .join('\n')}\n</urlset>\n`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
