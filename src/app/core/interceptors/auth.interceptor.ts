import { inject } from '@angular/core';
import { HttpRequest, HttpHandlerFn, HttpInterceptorFn } from '@angular/common/http';
import { SessionTokenService } from '../services/session-token.service';

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
    return next(authReq);
  }

  return next(req);
};
