import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      problem: z.string(),
      role: z.string(),
      impact: z.array(z.string()).min(2).max(4),
      stack: z.array(z.string()).min(1),
      links: z.object({
        live: z.string().url().optional(),
        repo: z.string().url().optional(),
        writeup: z.string().optional(),
      }),
      featured: z.boolean().default(false),
      order: z.number(),
      thumbnail: image().optional(),
      status: z.string().optional(),
      note: z.string().optional(),
      futureApi: z
        .object({
          projectKey: z.string().optional(),
          endpointHint: z.string().optional(),
        })
        .optional(),
    }),
});

const resume = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/resume' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    location: z.string(),
    description: z.string(),
    profile: z.string(),
    contacts: z
      .array(
        z.object({
          label: z.string(),
          href: z.string(),
          text: z.string(),
          external: z.boolean().optional(),
        }),
      )
      .min(1),
    experience: z
      .array(
        z.object({
          company: z.string(),
          title: z.string(),
          location: z.string().optional(),
          years: z.string(),
          bullets: z.array(z.string()).min(1),
        }),
      )
      .min(1),
    skills: z
      .array(
        z.object({
          category: z.string(),
          items: z.array(z.string()).min(1),
        }),
      )
      .min(1),
    education: z
      .array(
        z.object({
          school: z.string(),
          degree: z.string(),
        }),
      )
      .min(1),
  }),
});

export const collections = { projects, resume };
