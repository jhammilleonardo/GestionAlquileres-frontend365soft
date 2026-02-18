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
 * Adds JWT token to all outgoing HTTP requests
 * Handles both admin and tenant tokens
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  const tenantAuthService = inject(TenantAuthService);

  // Try to get admin token first, then tenant token
  const token = authService.getToken() || tenantAuthService.getToken();

  // Clone the request and add the Authorization header if token exists
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
