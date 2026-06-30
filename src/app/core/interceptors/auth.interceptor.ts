import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpHeaders,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import {
  Observable,
  catchError,
  filter,
  finalize,
  map,
  shareReplay,
  switchMap,
  take,
  throwError,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionTokenService } from '../services/session-token.service';
import { SessionExpirationService } from '../services/session-expiration.service';
import { readCookie } from './credentials-csrf.interceptor';
import {
  authContextForRequest,
  isPublicApiPath,
  requestPath,
  type AuthRouteContext,
} from '../utils/auth-route.util';

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'X-CSRF-Token';
const AUTH_CONTEXT_HEADER = 'X-Auth-Context';
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const refreshInFlight: Partial<Record<AuthRouteContext | 'default', Observable<void>>> = {};

/**
 * Authentication Interceptor
 * Adds JWT token to all outgoing HTTP requests.
 *
 * Priority rules:
 * 1. If the request already has an Authorization header (set explicitly by a service), respect it.
 * 2. Select token by API route context: admin, tenant or owner.
 * 3. Public routes continue without Authorization.
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const sessionExpiration = inject(SessionExpirationService);
  const context = authContextForRequest(req.url);

  // If the service already set an Authorization header explicitly, don't overwrite it
  if (req.headers.has('Authorization')) {
    return handleWithRefresh(withAuthContext(req, context), next, sessionExpiration);
  }

  const sessionToken = inject(SessionTokenService);
  const token = sessionToken.getTokenForRequest(req.url);

  if (token) {
    const authReq = withAuthContext(req, context).clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleWithRefresh(authReq, next, sessionExpiration);
  }

  return handleWithRefresh(withAuthContext(req, context), next, sessionExpiration);
};

function handleWithRefresh(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  sessionExpiration: SessionExpirationService,
): Observable<HttpEvent<unknown>> {
  return next(req).pipe(
    catchError((error: unknown) => {
      if (!shouldRefresh(req, error, sessionExpiration)) {
        return throwError(() => error);
      }

      return refreshSession(next, authContextForRequest(req.url)).pipe(
        switchMap(() => next(withCurrentCsrf(req))),
        catchError((refreshError: unknown) => {
          sessionExpiration.expire(authContextForRequest(req.url));
          return throwError(() => refreshError);
        }),
      );
    }),
  );
}

function refreshSession(next: HttpHandlerFn, context: AuthRouteContext | null): Observable<void> {
  const refreshKey = context ?? 'default';
  if (!refreshInFlight[refreshKey]) {
    const csrf = readCookie(CSRF_COOKIE);
    let headers = new HttpHeaders();
    if (csrf) headers = headers.set(CSRF_HEADER, csrf);
    if (context) headers = headers.set(AUTH_CONTEXT_HEADER, context);

    const refreshRequest = new HttpRequest(
      'POST',
      `${environment.apiUrl}auth/refresh`,
      {},
      { headers, withCredentials: true },
    );

    refreshInFlight[refreshKey] = next(refreshRequest).pipe(
      filter((event): event is HttpResponse<unknown> => event instanceof HttpResponse),
      take(1),
      map(() => undefined),
      finalize(() => {
        delete refreshInFlight[refreshKey];
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
  }

  return refreshInFlight[refreshKey];
}

function withAuthContext(
  req: HttpRequest<unknown>,
  context: AuthRouteContext | null,
): HttpRequest<unknown> {
  if (!context || req.headers.has(AUTH_CONTEXT_HEADER)) return req;
  return req.clone({ setHeaders: { [AUTH_CONTEXT_HEADER]: context } });
}

function shouldRefresh(
  req: HttpRequest<unknown>,
  error: unknown,
  sessionExpiration: SessionExpirationService,
): boolean {
  if (!(error instanceof HttpErrorResponse) || error.status !== 401) return false;
  const context = authContextForRequest(req.url);
  if (!req.url.startsWith(environment.apiUrl) || !sessionExpiration.hasClientSession(context)) {
    return false;
  }

  const path = requestPath(req.url);
  if (isPublicApiPath(path)) return false;
  if (path === '/auth/me') return true;

  return !(
    path === '/auth/refresh' ||
    path === '/auth/logout' ||
    path === '/auth/login-admin' ||
    path === '/auth/login-admin/mfa' ||
    path === '/auth/register-admin' ||
    path === '/auth/forgot-password' ||
    path === '/auth/reset-password' ||
    /^\/auth\/[^/]+\/(?:login|register)$/.test(path) ||
    /^\/auth\/[^/]+\/(?:owner|vendor)\/login$/.test(path)
  );
}

function withCurrentCsrf(req: HttpRequest<unknown>): HttpRequest<unknown> {
  if (!MUTATING_METHODS.has(req.method.toUpperCase())) return req;
  const csrf = readCookie(CSRF_COOKIE);
  return csrf ? req.clone({ setHeaders: { [CSRF_HEADER]: csrf } }) : req;
}
