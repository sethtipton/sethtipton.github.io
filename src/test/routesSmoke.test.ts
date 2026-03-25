import { access } from 'node:fs/promises';
import path from 'node:path';

import { chromium, type Browser, type Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { startStaticSiteServer } from './support/staticSiteServer';

const smokeTimeout = 90_000;
const repoRoot = process.cwd();
const builtIndexPath = path.resolve(repoRoot, 'dist', 'index.html');

let browser: Browser;
let baseUrl = '';
let staticSiteServer: Awaited<ReturnType<typeof startStaticSiteServer>>;

async function newPage() {
  return browser.newPage({
    viewport: {
      width: 1440,
      height: 1200,
    },
  });
}

async function gotoRoute(page: Page, routePath: string) {
  await page.goto(`${baseUrl}${routePath}`, {
    waitUntil: 'load',
  });
}

async function fetchRoute(routePath: string) {
  return fetch(`${baseUrl}${routePath}`);
}

async function ensureBuiltSite() {
  try {
    await access(builtIndexPath);
  } catch {
    throw new Error(
      'Route smoke tests require an existing static build in dist/. Run "npm run build:site" or "npm run test:smoke" first.',
    );
  }
}

beforeAll(async () => {
  await ensureBuiltSite();
  staticSiteServer = await startStaticSiteServer(
    path.resolve(repoRoot, 'dist'),
  );
  baseUrl = staticSiteServer.url;
  browser = await chromium.launch({
    headless: true,
  });
}, smokeTimeout);

afterAll(async () => {
  if (browser) {
    await browser.close();
  }

  if (staticSiteServer) {
    await staticSiteServer.close();
  }
}, smokeTimeout);

describe('route smoke tests', () => {
  it(
    'smoke tests the home route',
    async () => {
      const page = await newPage();

      try {
        await gotoRoute(page, '/');
        await page.waitForSelector('h1');

        expect(
          (await page.locator('h1').textContent())?.trim().length,
        ).toBeGreaterThan(0);
        expect(
          await page.locator('nav a[aria-current="page"]').textContent(),
        ).toContain('Home');
        expect(await page.locator('.button-row a[href="/work/"]').count()).toBe(
          1,
        );
        expect(await page.locator('.case-study-card').count()).toBeGreaterThan(
          0,
        );
      } finally {
        await page.close();
      }
    },
    smokeTimeout,
  );

  it(
    'smoke tests the work route',
    async () => {
      const page = await newPage();

      try {
        await gotoRoute(page, '/work/');
        await page.waitForSelector('h1');

        expect(await page.locator('h1').textContent()).toContain(
          'Selected case studies.',
        );
        expect(await page.locator('.case-study-card').count()).toBeGreaterThan(
          0,
        );
      } finally {
        await page.close();
      }
    },
    smokeTimeout,
  );

  it(
    'smoke tests a repo-backed case study route',
    async () => {
      const page = await newPage();

      try {
        await gotoRoute(page, '/work/portfolio-site-and-resume-platform/');
        await page.waitForSelector('h1');

        expect(await page.locator('h1').textContent()).toContain(
          'My Portfolio',
        );
        expect(
          await page.locator('a:has-text("Repository")').count(),
        ).toBeGreaterThan(0);
      } finally {
        await page.close();
      }
    },
    smokeTimeout,
  );

  it(
    'smoke tests a non-repo case study route',
    async () => {
      const page = await newPage();

      try {
        await gotoRoute(page, '/work/oracle-global-navigation-platform/');
        await page.waitForSelector('h1');

        expect(await page.locator('h1').textContent()).toContain(
          'Oracle Global Navigation',
        );
        expect(await page.locator('a:has-text("Repository")').count()).toBe(0);
      } finally {
        await page.close();
      }
    },
    smokeTimeout,
  );

  it(
    'smoke tests the resume route',
    async () => {
      const page = await newPage();

      try {
        await gotoRoute(page, '/resume/');
        await page.waitForSelector('h1');

        expect(await page.locator('h1').textContent()).toContain('Seth Tipton');
        expect(
          await page.locator('.resume-document__actions a').count(),
        ).toBeGreaterThan(0);
        expect(
          await page
            .locator('.resume-document__actions a')
            .evaluateAll((nodes) =>
              nodes.map((node) => node.textContent?.trim() ?? ''),
            ),
        ).toContain('Print-friendly view');
      } finally {
        await page.close();
      }
    },
    smokeTimeout,
  );

  it(
    'smoke tests the resume print route',
    async () => {
      const page = await newPage();

      try {
        await gotoRoute(page, '/resume/print/');
        await page.waitForSelector('h1');

        expect(await page.locator('h1').textContent()).toContain('Seth Tipton');
        expect(
          await page
            .locator('h2')
            .evaluateAll((nodes) =>
              nodes.map((node) => node.textContent?.trim()),
            ),
        ).toEqual(['Profile', 'Experience', 'Skills', 'Education']);
      } finally {
        await page.close();
      }
    },
    smokeTimeout,
  );

  it(
    'emits a branded 404 artifact',
    async () => {
      const response = await fetchRoute('/404.html');
      const body = await response.text();

      expect(response.ok).toBe(true);
      expect(body).toContain('Page not found.');
      expect(body).toContain('href="/work/"');
      expect(body).toContain('href="/resume/"');
    },
    smokeTimeout,
  );

  it(
    'emits robots.txt and sitemap.xml',
    async () => {
      const robotsResponse = await fetchRoute('/robots.txt');
      const robotsBody = await robotsResponse.text();
      const sitemapResponse = await fetchRoute('/sitemap.xml');
      const sitemapBody = await sitemapResponse.text();

      expect(robotsResponse.ok).toBe(true);
      expect(robotsBody).toContain('User-agent: *');
      expect(robotsBody).toContain('Sitemap:');
      expect(sitemapResponse.ok).toBe(true);
      expect(sitemapBody).toContain('<urlset');
      expect(sitemapBody).toContain(
        '/work/portfolio-site-and-resume-platform/',
      );
    },
    smokeTimeout,
  );
});
