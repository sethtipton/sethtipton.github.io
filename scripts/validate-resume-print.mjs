import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile, stat } from 'node:fs/promises';

import { JSDOM } from 'jsdom';

const distDir = path.resolve('dist');
const resumeSourcePath = path.resolve('src/content/resume/seth-tipton.md');
const base = normalizeBase(process.env.BASE_PATH ?? '/');
const pdfFileName = 'seth_tipton_resume.pdf';
const printHtmlPath =
  base === '/'
    ? path.join(distDir, 'resume', 'print', 'index.html')
    : path.join(
        distDir,
        base.replace(/^\/|\/$/g, ''),
        'resume',
        'print',
        'index.html',
      );
const pdfPath = path.join(distDir, pdfFileName);

const [html, pdfStats, pdfBuffer, resumeSource] = await Promise.all([
  readFile(printHtmlPath, 'utf8'),
  stat(pdfPath),
  readFile(pdfPath),
  readFile(resumeSourcePath, 'utf8'),
]);

const expectedName = getFrontmatterValue(resumeSource, 'name');
const expectedRole = getFrontmatterValue(resumeSource, 'role');
const expectedLocation = getFrontmatterValue(resumeSource, 'location');

assert(expectedName, 'Expected a name field in the resume source frontmatter.');
assert(expectedRole, 'Expected a role field in the resume source frontmatter.');
assert(
  expectedLocation,
  'Expected a location field in the resume source frontmatter.',
);

assert(pdfStats.size > 0, `dist/${pdfFileName} is empty.`);

const dom = new JSDOM(html);
const { document } = dom.window;
const normalizedText = normalizeText(
  document.querySelector('main')?.textContent ?? '',
);
const h1Nodes = [...document.querySelectorAll('h1')];
const h2Texts = [...document.querySelectorAll('h2')].map((node) =>
  normalizeText(node.textContent ?? ''),
);

assert.equal(h1Nodes.length, 1, 'Expected exactly one h1 in the print HTML.');
assert.equal(
  normalizeText(h1Nodes[0]?.textContent ?? ''),
  normalizeText(expectedName),
  'Unexpected resume h1 text.',
);
assert.equal(
  normalizeText(
    document.querySelector('.resume-document__role')?.textContent ?? '',
  ),
  normalizeText(expectedRole),
  'Unexpected resume role text.',
);
assert.deepEqual(
  h2Texts.slice(0, 4),
  ['Profile', 'Experience', 'Skills', 'Education'],
  'Expected standard resume section headings in order.',
);
assert.equal(
  document.querySelectorAll('table').length,
  0,
  'Print HTML must not use tables.',
);
assert.equal(
  document.querySelectorAll('aside').length,
  0,
  'Print HTML must not use aside/sidebar layout.',
);

assertInOrder(normalizedText, [
  expectedName,
  expectedRole,
  expectedLocation,
  'Email',
  'sethtipton@gmail.com',
  'LinkedIn',
  'linkedin.com/in/sethtipton',
  'Profile',
  'Experience',
  'Skills',
  'Education',
]);

const pdfText = pdfBuffer.toString('latin1');
assert(
  pdfText.includes('/StructTreeRoot'),
  'Generated PDF is missing tagged PDF structure markers.',
);

console.log(
  `Validated print HTML semantics and tagged PDF output (${path.relative(process.cwd(), pdfPath)}).`,
);

function assertInOrder(haystack, needles) {
  let previousIndex = -1;

  for (const needle of needles) {
    const index = haystack.indexOf(normalizeText(needle), previousIndex + 1);
    assert(
      index >= 0,
      `Expected to find "${needle}" in the print reading order.`,
    );
    assert(
      index >= previousIndex,
      `"${needle}" appeared out of order in the print reading order.`,
    );
    previousIndex = index;
  }
}

function normalizeText(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeBase(basePath) {
  const normalized = `/${basePath}`.replace(/\/+/g, '/');

  if (normalized === '/') {
    return normalized;
  }

  return normalized.replace(/\/?$/, '/').replace(/^\/?/, '/');
}

function getFrontmatterValue(source, key) {
  const frontmatterMatch = source.match(/^---\s*\n([\s\S]*?)\n---/);

  if (!frontmatterMatch) {
    return null;
  }

  const fieldMatch = frontmatterMatch[1].match(
    new RegExp(`^${escapeRegExp(key)}:\\s*(.+)$`, 'm'),
  );

  return fieldMatch?.[1].trim().replace(/^['"]|['"]$/g, '') ?? null;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
