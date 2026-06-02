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
    void router.navigate(['/login'], {
      queryParams: { returnUrl: state.url },
      replaceUrl: true,
    });
    return false;
  }

  // Check if user is authenticated and has a valid token
  const isAuthenticated = authService.isAuth();
  const hasToken = authService.getToken();

  if (isAuthenticated && hasToken) {
    // Validate URL slug matches the authenticated user's tenant slug
    const userSlug = authService.currentUser()?.tenant_slug ?? null;

    if (userSlug && slug !== userSlug) {
      // URL slug doesn't match user's tenant — redirect to correct URL
      const correctUrl = state.url.replace(`/${slug}/`, `/${userSlug}/`);
      void router.navigate([correctUrl], { replaceUrl: true });
      return false;
    }

    // Set slug in SlugService only with verified slug
    slugService.setSlug(userSlug || slug);
    return true;
  }

  // Set slug from URL as fallback (for unauthenticated redirects)
  slugService.setSlug(slug);

  // Clear any invalid session
  if (!hasToken && isAuthenticated) {
    authService.logout();
  }

  // Redirect to ADMIN login (sin slug) con return url
  // Usar replaceUrl para que la redirección no quede en el historial
  void router.navigate(['/login'], {
    queryParams: { returnUrl: state.url },
    replaceUrl: true,
  });
  return false;
};

/**
 * Guard para prevenir que usuarios autenticados accedan a la página de login
 * Similar al tenantLoginGuard pero para admin
 */
export const adminLoginGuard: CanActivateFn = (_route, _state) => {
  const authService = inject(AuthService);
  const slugService = inject(SlugService);
  const router = inject(Router);

  // Si ya está autenticado, redirigir al dashboard
  if (authService.isAuth()) {
    // Try to get the slug from the stored user first, then fall back to SlugService
    let userSlug = authService.currentUser()?.tenant_slug ?? null;

    // Fallback to SlugService when the user state is still being restored.
    if (!userSlug) {
      userSlug = slugService.getSlug();
    }

    if (userSlug) {
      void router.navigate(['/', userSlug, 'dashboard'], { replaceUrl: true });
      return false;
    }
  }

  return true;
};
