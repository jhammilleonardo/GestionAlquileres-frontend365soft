export function requestPath(url: string): string {
  try {
    const base = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
    return new URL(url, base).pathname;
  } catch {
    return url.split(/[?#]/, 1)[0];
  }
}

export function isPublicApiPath(path: string): boolean {
  return (
    /^\/[^/]+\/catalog(?:\/|$)/.test(path) ||
    /^\/[^/]+\/publico(?:\/|$)/.test(path) ||
    /^\/public(?:\/|$)/.test(path)
  );
}

export function isPublicPageUrl(url: string): boolean {
  const path = requestPath(url);
  return (
    path === '/' ||
    path === '/login' ||
    path === '/register' ||
    path === '/forgot-password' ||
    path === '/reset-password' ||
    /^\/[^/]+\/publico(?:\/|$)/.test(path) ||
    /^\/[^/]+\/(?:login|register)$/.test(path) ||
    /^\/[^/]+\/(?:owner|vendor)\/login$/.test(path)
  );
}
