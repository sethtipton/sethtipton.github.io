import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { access, copyFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';

import { chromium } from 'playwright';

const distDir = path.resolve('dist');
const base = normalizeBase(process.env.BASE_PATH ?? '/');
const printPath = joinUrl(base, 'resume/print/');
const pdfFileName = 'seth_tipton_resume.pdf';
const rootPdfPath = path.join(distDir, pdfFileName);
const basePdfPath =
  base === '/'
    ? null
    : path.join(distDir, base.replace(/^\/|\/$/g, ''), pdfFileName);

const mimeTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.gif', 'image/gif'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.xml', 'application/xml; charset=utf-8'],
]);

await ensureBuildOutput();

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
    const filePath = await resolveFilePath(requestUrl.pathname);

    if (!filePath) {
      response.statusCode = 404;
      response.end('Not found');
      return;
    }

    response.setHeader(
      'Content-Type',
      mimeTypes.get(path.extname(filePath)) ?? 'application/octet-stream',
    );
    createReadStream(filePath).pipe(response);
  } catch (error) {
    response.statusCode = 500;
    response.end('Internal server error');
    console.error(error);
  }
});

let browser;

try {
  const serverAddress = await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();

      if (!address || typeof address === 'string') {
        reject(
          new Error('Unable to determine the local preview server address.'),
        );
        return;
      }

      resolve(address);
    });
  });

  const previewUrl = `http://127.0.0.1:${serverAddress.port}${printPath}`;

  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(previewUrl, { waitUntil: 'networkidle' });
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(async () => {
    if (document.fonts) {
      await document.fonts.ready;
    }
  });
  await page.pdf({
    path: rootPdfPath,
    format: 'Letter',
    preferCSSPageSize: true,
    printBackground: true,
    tagged: true,
  });

  if (basePdfPath) {
    await mkdir(path.dirname(basePdfPath), { recursive: true });
    await copyFile(rootPdfPath, basePdfPath);
  }

  console.log(
    `Generated ${path.relative(process.cwd(), rootPdfPath)} from ${previewUrl}`,
  );
  if (basePdfPath) {
    console.log(
      `Copied ${path.relative(process.cwd(), basePdfPath)} for base-aware deployment`,
    );
  }
} catch (error) {
  if (
    error instanceof Error &&
    error.message.includes("Executable doesn't exist")
  ) {
    throw new Error(
      `${error.message}\nRun "npx playwright install chromium" before generating the resume PDF.`,
    );
  }

  throw error;
} finally {
  if (browser) {
    await browser.close();
  }

  if (server.listening) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(undefined);
      });
    });
  }
}

async function ensureBuildOutput() {
  try {
    const outputStats = await stat(distDir);

    if (!outputStats.isDirectory()) {
      throw new Error('dist exists but is not a directory.');
    }
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      throw new Error(
        'dist/ was not found. Run "astro build" before generating the resume PDF.',
      );
    }

    throw error;
  }
}

async function resolveFilePath(urlPath) {
  const pathname = decodeURIComponent(urlPath);
  const trimmedPath = pathname.replace(/^\/+/, '');
  const directFile = path.join(distDir, trimmedPath);
  const candidates = [];

  if (pathname.endsWith('/')) {
    candidates.push(path.join(directFile, 'index.html'));
  } else {
    candidates.push(directFile);
    candidates.push(path.join(directFile, 'index.html'));
  }

  for (const candidate of candidates) {
    try {
      await access(candidate);
      const candidateStats = await stat(candidate);

      if (candidateStats.isFile()) {
        return candidate;
      }
    } catch {
      // Continue trying the next candidate.
    }
  }

  return null;
}

function normalizeBase(basePath) {
  const normalized = `/${basePath}`.replace(/\/+/g, '/');

  if (normalized === '/') {
    return normalized;
  }

  return normalized.replace(/\/?$/, '/').replace(/^\/?/, '/');
}

function joinUrl(basePath, relativePath) {
  return `${basePath}${relativePath.replace(/^\/+/, '')}`;
}
