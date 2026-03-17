import { getEntry, type CollectionEntry } from 'astro:content';

import { resolveHref } from './links';
import { withBase } from './paths';

export const RESUME_ENTRY_ID = 'seth-tipton';
export const RESUME_PDF_FILE_NAME = 'seth_tipton_resume.pdf';

export type ResumeEntry = CollectionEntry<'resume'>;
export type ResumeContact = ResumeEntry['data']['contacts'][number];
export type ResumeExperienceItem = ResumeEntry['data']['experience'][number];
export type ResumeSkillGroup = ResumeEntry['data']['skills'][number];
export type ResumeEducationItem = ResumeEntry['data']['education'][number];

export async function getResume() {
  const resume = await getEntry('resume', RESUME_ENTRY_ID);

  if (!resume) {
    throw new Error(`Resume entry "${RESUME_ENTRY_ID}" was not found.`);
  }

  return resume;
}

export function getResumePdfHref(base: string) {
  return withBase(`/${RESUME_PDF_FILE_NAME}`, base);
}

export function getResumePrintHref(base: string) {
  return withBase('/resume/print/', base);
}

export function getResumeLink(item: ResumeContact, base: string) {
  return resolveHref(item, base);
}
