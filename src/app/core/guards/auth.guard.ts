import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated and has a valid token
  const isAuthenticated = authService.isAuth();
  const hasToken = authService.getToken();

  if (isAuthenticated && hasToken) {
    return true;
  }

  // Clear any invalid session
  if (!hasToken && isAuthenticated) {
    authService.logout();
  }

  // Redirect to login with return url
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};
