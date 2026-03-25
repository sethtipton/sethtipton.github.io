export function withBase(path: string, base = '/') {
  if (!path.startsWith('/')) {
    return path;
  }

  const origin = 'https://example.com';
  const safeBase = base || '/';
  const normalizedBase = safeBase.endsWith('/') ? safeBase : `${safeBase}/`;
  const baseUrl = new URL(normalizedBase, origin);

  if (path === '/') {
    return baseUrl.pathname;
  }

  return new URL(path.slice(1), baseUrl).pathname;
}
