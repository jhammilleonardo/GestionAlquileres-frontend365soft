import { environment } from '../../../environments/environment';

export type AuthRouteContext = 'admin' | 'tenant' | 'owner' | 'vendor';

export function requestPath(url: string): string {
  try {
    const base = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
    const parsed = new URL(url, base);
    return stripApiBasePath(parsed, base);
  } catch {
    return url.split(/[?#]/, 1)[0];
  }
}

export function authContextForRequest(url: string): AuthRouteContext | null {
  const path = requestPath(url);

  if (path === '/auth/login-admin' || path === '/auth/login-admin/mfa') return 'admin';
  if (/^\/auth\/[^/]+\/(?:login|register)$/.test(path)) return 'tenant';
  if (/^\/auth\/[^/]+\/owner\/login$/.test(path)) return 'owner';
  if (/^\/auth\/[^/]+\/vendor\/login$/.test(path)) return 'vendor';

  if (/^\/[^/]+\/(?:admin|tecnico)(?:\/|$)/.test(path)) return 'admin';
  if (/^\/[^/]+\/tenant(?:\/|$)/.test(path)) return 'tenant';
  if (/^\/[^/]+\/owner(?:\/|$)/.test(path)) return 'owner';
  if (/^\/[^/]+\/vendor(?:\/|$)/.test(path)) return 'vendor';

  return null;
}

function stripApiBasePath(url: URL, base: string): string {
  try {
    const apiUrl = new URL(environment.apiUrl, base);
    const apiPath = apiUrl.pathname.replace(/\/+$/, '');

    if (
      apiPath &&
      url.origin === apiUrl.origin &&
      (url.pathname === apiPath || url.pathname.startsWith(`${apiPath}/`))
    ) {
      return url.pathname.slice(apiPath.length) || '/';
    }
  } catch {
    // Si environment.apiUrl esta mal formado, conservar el path original.
  }

  return url.pathname;
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
