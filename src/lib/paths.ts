export function withBase(path: string, base: string) {
  if (!path.startsWith('/')) {
    return path;
  }

  const origin = 'https://example.com';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const baseUrl = new URL(normalizedBase, origin);

  if (path === '/') {
    return baseUrl.pathname;
  }

  return new URL(path.slice(1), baseUrl).pathname;
}
