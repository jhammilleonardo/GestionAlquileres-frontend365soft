import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { TenantConfigService } from '../services/admin/tenant-config.service';

/**
 * Guard for admin panel routes that require setup to be completed.
 * If setup_completed = false, redirects to the setup wizard.
 */
export const setupCompleteGuard: CanActivateFn = (route, _state) => {
  const configService = inject(TenantConfigService);
  const router = inject(Router);

  // On the '' (empty-path) child of :slug, Angular's emptyOnly inheritance
  // makes the slug available in route.paramMap directly.
  const slug = route.paramMap.get('slug');

  if (!slug) {
    return true;
  }

  return configService.getConfig(slug).pipe(
    map((config) => {
      if (config.setup_completed) {
        return true;
      }
      router.navigate(['/', slug, 'configuracion', 'inicio'], { replaceUrl: true });
      return false;
    }),
    catchError(() => {
      // If config fetch fails, allow navigation — don't block the user
      return of(true);
    }),
  );
};

/**
 * Guard for the setup wizard itself: if setup is already done, redirect to dashboard.
 * Applied on the 'configuracion/inicio' route (non-empty path), so slug is on route.parent.
 */
export const wizardGuard: CanActivateFn = (route, _state) => {
  const configService = inject(TenantConfigService);
  const router = inject(Router);

  // 'configuracion/inicio' is a non-empty child of :slug — must traverse to parent
  const slug = route.parent?.paramMap.get('slug');

  if (!slug) {
    return true;
  }

  return configService.getConfig(slug).pipe(
    map((config) => {
      if (!config.setup_completed) {
        return true;
      }
      router.navigate(['/', slug, 'dashboard'], { replaceUrl: true });
      return false;
    }),
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        router.navigate(['/login'], { replaceUrl: true });
        return of(false);
      }
      return of(true);
    }),
  );
};
