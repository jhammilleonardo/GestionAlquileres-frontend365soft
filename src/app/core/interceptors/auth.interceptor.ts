import { inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpInterceptorFn
} from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { TenantAuthService } from '../services/tenant-auth.service';

/**
 * Authentication Interceptor
 * Adds JWT token to all outgoing HTTP requests.
 *
 * Priority rules:
 * 1. If the request already has an Authorization header (set explicitly by a service), respect it.
 * 2. If the URL contains "/tenant/", use the tenant token.
 * 3. Otherwise (admin routes, public), use the admin token.
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  // If the service already set an Authorization header explicitly, don't overwrite it
  if (req.headers.has('Authorization')) {
    return next(req);
  }

  const authService = inject(AuthService);
  const tenantAuthService = inject(TenantAuthService);

  // Seleccionar el token según el tipo de ruta, sin fallback entre roles.
  // Un token de admin nunca debe usarse en rutas de tenant y viceversa.
  const isTenantRoute = req.url.includes('/tenant/');
  const token = isTenantRoute
    ? tenantAuthService.getToken()
    : authService.getToken();

  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }

  return next(req);
};
