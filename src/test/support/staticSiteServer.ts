import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import path from 'node:path';

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

async function resolveFilePath(rootDir: string, urlPath: string) {
  const pathname = decodeURIComponent(urlPath);
  const trimmedPath = pathname.replace(/^\/+/, '');
  const directFile = path.join(rootDir, trimmedPath);
  const candidates = pathname.endsWith('/')
    ? [path.join(directFile, 'index.html')]
    : [directFile, path.join(directFile, 'index.html')];

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

export async function startStaticSiteServer(rootDir: string) {
  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
      const filePath = await resolveFilePath(rootDir, requestUrl.pathname);

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
    } catch {
      response.statusCode = 500;
      response.end('Internal server error');
    }
  });

  const address = await new Promise<{
    port: number;
  }>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const nextAddress = server.address();

      if (!nextAddress || typeof nextAddress === 'string') {
        reject(
          new Error('Unable to determine the static test server address.'),
        );
        return;
      }

      resolve(nextAddress);
    });
  });

  return {
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    },
    url: `http://127.0.0.1:${address.port}`,
  };
}
