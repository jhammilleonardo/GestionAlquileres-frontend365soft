import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SlugService } from '../services/slug.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const slugService = inject(SlugService);
  const router = inject(Router);

  // Get slug from URL
  const slug = route.paramMap.get('slug');

  // Check if slug exists in URL
  if (!slug) {
    // No slug in URL, redirect to login
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url },
      replaceUrl: true
    });
    return false;
  }

  // Set slug in SlugService
  slugService.setSlug(slug);

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

  // Redirect to ADMIN login (sin slug) con return url
  // Usar replaceUrl para que la redirección no quede en el historial
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url },
    replaceUrl: true
  });
  return false;
};

/**
 * Guard para prevenir que usuarios autenticados accedan a la página de login
 * Similar al tenantLoginGuard pero para admin
 */
export const adminLoginGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const slugService = inject(SlugService);
  const router = inject(Router);

  // Si ya está autenticado, redirigir al dashboard
  if (authService.isAuth()) {
    // Try to get the slug from the stored user first, then fall back to SlugService
    let userSlug: string | null = null;

    const userJson = localStorage.getItem('admin_user');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        userSlug = user.tenant_slug || null;
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }

    // Fallback to SlugService (loaded from localStorage)
    if (!userSlug) {
      userSlug = slugService.getSlug();
    }

    if (userSlug) {
      router.navigate(['/', userSlug, 'dashboard'], { replaceUrl: true });
      return false;
    }
  }

  return true;
};
