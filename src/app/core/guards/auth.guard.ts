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
      queryParams: { returnUrl: state.url }
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

  // Redirect to login with slug and return url
  router.navigate(['/', slug, 'login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};
