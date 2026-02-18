import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { TenantAuthService } from '../services/tenant-auth.service';
import { SlugService } from '../services/slug.service';

export const tenantAuthGuard: CanActivateFn = (route, state) => {
    const authService = inject(TenantAuthService);
    const slugService = inject(SlugService);
    const router = inject(Router);

    // Get slug from URL
    const slug = route.paramMap.get('slug');

    // Check if slug exists in URL
    if (!slug) {
        // No slug in URL, redirect to main login
        router.navigate(['/login'], {
            queryParams: { returnUrl: state.url }
        });
        return false;
    }

    // Set slug in SlugService
    slugService.setSlug(slug);

    if (authService.isAuthenticated()) {
        return true;
    }

    // Redirect to tenant login with slug
    // Usar replaceUrl para que la redirección no quede en el historial
    router.navigate(['/', slug, 'login'], {
        queryParams: { returnUrl: state.url },
        replaceUrl: true
    });
    return false;
};

export const tenantLoginGuard: CanActivateFn = (route, state) => {
    const authService = inject(TenantAuthService);
    const slugService = inject(SlugService);
    const router = inject(Router);

    // Get slug from URL
    const slug = route.paramMap.get('slug');

    // Check if slug exists in URL
    if (slug) {
        // Set slug in SlugService
        slugService.setSlug(slug);
    }

    // If already logged in, redirect to dashboard with slug
    // Usar replaceUrl para que el login no quede en el historial
    if (authService.isAuthenticated()) {
        if (slug) {
            router.navigate(['/', slug, 'portal', 'dashboard'], { replaceUrl: true });
        } else {
            router.navigate(['/portal/dashboard'], { replaceUrl: true });
        }
        return false;
    }

    return true;
};
