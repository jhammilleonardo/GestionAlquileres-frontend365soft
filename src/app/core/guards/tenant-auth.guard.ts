import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { TenantAuthService } from '../services/tenant-auth.service';

export const tenantAuthGuard: CanActivateFn = (route, state) => {
    const authService = inject(TenantAuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        return true;
    }

    // Redirect to tenant login
    router.navigate(['/portal/login'], {
        queryParams: { returnUrl: state.url }
    });
    return false;
};

export const tenantLoginGuard: CanActivateFn = (route, state) => {
    const authService = inject(TenantAuthService);
    const router = inject(Router);

    // If already logged in, redirect to dashboard
    if (authService.isAuthenticated()) {
        router.navigate(['/portal/dashboard']);
        return false;
    }

    return true;
};
