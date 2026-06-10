import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { VendorAuthService } from '../services/vendor/vendor-auth.service';
import { SlugService } from '../services/slug.service';

export const vendorAuthGuard: CanActivateFn = (route) => {
  const vendorAuth = inject(VendorAuthService);
  const router = inject(Router);
  const slugService = inject(SlugService);
  const slug = route.paramMap.get('slug') ?? slugService.getSlug();

  if (slug) {
    slugService.setSlug(slug);
  }

  if (vendorAuth.hasSessionForSlug(slug)) {
    return true;
  }

  return router.createUrlTree(slug ? ['/', slug, 'vendor', 'login'] : ['/login']);
};

export const vendorLoginGuard: CanActivateFn = (route) => {
  const vendorAuth = inject(VendorAuthService);
  const router = inject(Router);
  const slugService = inject(SlugService);
  const slug = route.paramMap.get('slug') ?? slugService.getSlug();

  if (slug) {
    slugService.setSlug(slug);
  }

  if (!vendorAuth.hasSessionForSlug(slug)) {
    return true;
  }

  return router.createUrlTree(slug ? ['/', slug, 'vendor'] : ['/']);
};
