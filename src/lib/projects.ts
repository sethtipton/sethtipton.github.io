import { getCollection, type CollectionEntry } from 'astro:content';

import { withBase } from './paths';

export type ProjectEntry = CollectionEntry<'projects'>;

export async function getProjects() {
  const projects = await getCollection('projects');
  return projects.sort((left, right) => left.data.order - right.data.order);
}

export async function getFeaturedProjects(limit = 4) {
  const projects = await getProjects();
  return projects.filter(({ data }) => data.featured).slice(0, limit);
}

export function getProjectPermalink(slug: string, base: string) {
  return withBase(`/work/${slug}/`, base);
}

export function getProjectLinks(project: ProjectEntry, base: string) {
  const writeup = project.data.links.writeup;

  return {
    live: project.data.links.live,
    repo: project.data.links.repo,
    writeup: writeup
      ? writeup.startsWith('/')
        ? withBase(writeup, base)
        : writeup
      : getProjectPermalink(project.id, base),
  };
}

export function getProjectTransitionNames(slug: string) {
  return {
    visual: `case-study-visual-${slug}`,
    heading: `case-study-heading-${slug}`,
    summary: `case-study-summary-${slug}`,
    problem: `case-study-problem-${slug}`,
  };
}
