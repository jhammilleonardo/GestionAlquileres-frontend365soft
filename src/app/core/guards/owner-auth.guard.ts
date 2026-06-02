import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { OwnerAuthService } from '../services/owner/owner-auth.service';
import { SlugService } from '../services/slug.service';

export const ownerAuthGuard: CanActivateFn = (route) => {
  const ownerAuth = inject(OwnerAuthService);
  const router = inject(Router);
  const slugService = inject(SlugService);
  const slug = route.paramMap.get('slug') ?? slugService.getSlug();

  if (slug) {
    slugService.setSlug(slug);
  }

  if (ownerAuth.hasSessionForSlug(slug)) {
    return true;
  }

  return router.createUrlTree(slug ? ['/', slug, 'owner', 'login'] : ['/login']);
};

export const ownerLoginGuard: CanActivateFn = (route) => {
  const ownerAuth = inject(OwnerAuthService);
  const router = inject(Router);
  const slugService = inject(SlugService);
  const slug = route.paramMap.get('slug') ?? slugService.getSlug();

  if (slug) {
    slugService.setSlug(slug);
  }

  if (!ownerAuth.hasSessionForSlug(slug)) {
    return true;
  }

  return router.createUrlTree(slug ? ['/', slug, 'owner'] : ['/']);
};
