import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpHeaders,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { Observable, catchError, finalize, map, shareReplay, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionTokenService } from '../services/session-token.service';
import { SessionExpirationService } from '../services/session-expiration.service';
import { readCookie } from './credentials-csrf.interceptor';
import { isPublicApiPath, requestPath } from '../utils/auth-route.util';

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'X-CSRF-Token';
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
let refreshInFlight$: Observable<void> | null = null;

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

  // If the service already set an Authorization header explicitly, don't overwrite it
  if (req.headers.has('Authorization')) {
    return next(req);
  }

  const sessionToken = inject(SessionTokenService);
  const token = sessionToken.getTokenForRequest(req.url);

  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleWithRefresh(authReq, next, sessionExpiration);
  }

  return handleWithRefresh(req, next, sessionExpiration);
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

      return refreshSession(next).pipe(
        switchMap(() => next(withCurrentCsrf(req))),
        catchError((refreshError: unknown) => {
          sessionExpiration.expire();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
}

function refreshSession(next: HttpHandlerFn): Observable<void> {
  if (!refreshInFlight$) {
    const csrf = readCookie(CSRF_COOKIE);
    let headers = new HttpHeaders();
    if (csrf) headers = headers.set(CSRF_HEADER, csrf);

    const refreshRequest = new HttpRequest(
      'POST',
      `${environment.apiUrl}auth/refresh`,
      {},
      { headers, withCredentials: true },
    );

    refreshInFlight$ = next(refreshRequest).pipe(
      map(() => undefined),
      finalize(() => {
        refreshInFlight$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
  }

  return refreshInFlight$;
}

function shouldRefresh(
  req: HttpRequest<unknown>,
  error: unknown,
  sessionExpiration: SessionExpirationService,
): boolean {
  if (!(error instanceof HttpErrorResponse) || error.status !== 401) return false;
  if (!req.url.startsWith(environment.apiUrl) || !sessionExpiration.hasClientSession()) {
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
