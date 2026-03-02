import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { TenantAuthService } from '../services/tenant-auth.service';
import { SlugService } from '../services/slug.service';
import { ContractService } from '../services/contract.service';

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
    console.log('[tenantLoginGuard] ===== START =====');
    console.log('[tenantLoginGuard] Slug:', slug);
    console.log('[tenantLoginGuard] State URL:', state.url);

    // Check if slug exists in URL
    if (slug) {
        // Set slug in SlugService
        slugService.setSlug(slug);
    }

    // If already logged in, check for contract and redirect accordingly
    // Usar replaceUrl para que el login no quede en el historial
    if (authService.isAuthenticated()) {
        const currentUser = authService.currentUser();
        console.log('[tenantLoginGuard] User is authenticated');
        console.log('[tenantLoginGuard] Current user:', currentUser);
        console.log('[tenantLoginGuard] Has contract in user object?', !!currentUser?.contract);

        if (currentUser && slug) {
            // Check if user has contract in the current user object (fast path)
            if (currentUser.contract) {
                console.log('[tenantLoginGuard] User has contract, redirecting to dashboard');
                router.navigate(['/', slug, 'portal', 'dashboard'], { replaceUrl: true });
                return false;
            }

            // No contract in user object, default to home pre-contract
            // The tenant-layout component will do a more thorough check via ContractService
            // and redirect if contracts are found
            console.log('[tenantLoginGuard] No contract in user object, redirecting to home');
            router.navigate(['/', slug, 'portal', 'home'], { replaceUrl: true });
            return false;
        } else if (!slug) {
            console.log('[tenantLoginGuard] No slug, redirecting to default dashboard');
            router.navigate(['/portal/dashboard'], { replaceUrl: true });
            return false;
        }
    }

    console.log('[tenantLoginGuard] User not authenticated, allowing access to login');
    console.log('[tenantLoginGuard] ===== END =====');
    return true;
};

/**
 * Guard para rutas de inquilinos PRE-CONTRATO
 * Solo permite acceso si el usuario NO tiene contratos (ni BORRADOR ni ACTIVO)
 */
export const tenantPreContractGuard: CanActivateFn = (route, state) => {
    const authService = inject(TenantAuthService);
    const contractService = inject(ContractService);
    const router = inject(Router);
    const slugService = inject(SlugService);

    const currentUser = authService.currentUser();
    const slug = route.paramMap.get('slug');

    // Si no está autenticado, redirigir al login
    if (!currentUser) {
        if (slug) {
            router.navigate(['/', slug, 'portal', 'login'], {
                queryParams: { returnUrl: state.url }
            });
        }
        return false;
    }

    // Fast path: ya tiene contrato ACTIVO en el JWT
    if (currentUser.contract) {
        slugService.navigateTo(['portal', 'dashboard']);
        return false;
    }

    // Verificar vía API (puede haber contratos BORRADOR no incluidos en el JWT)
    return contractService.hasAnyContracts().pipe(
        map((contracts) => {
            if (contracts && contracts.length > 0) {
                const hasActive = contracts.some(c => c.status === 'ACTIVO');
                if (hasActive) {
                    slugService.navigateTo(['portal', 'dashboard']);
                } else {
                    // Tiene contrato BORRADOR pendiente de firma
                    slugService.navigateTo(['portal', 'documentos', 'contratos']);
                }
                return false;
            }
            return true;
        }),
        catchError(() => of(true))
    );
};

/**
 * Guard para rutas de inquilinos CON CONTRATO
 * Solo permite acceso si el usuario TIENE un contrato activo
 */
export const tenantWithContractGuard: CanActivateFn = (route, state) => {
    const authService = inject(TenantAuthService);
    const router = inject(Router);
    const slugService = inject(SlugService);

    const currentUser = authService.currentUser();

    // Si no está autenticado, redirigir al login
    if (!currentUser) {
        const slug = route.paramMap.get('slug');
        if (slug) {
            router.navigate(['/', slug, 'portal', 'login'], {
                queryParams: { returnUrl: state.url }
            });
        }
        return false;
    }

    // Refrescar datos del usuario para verificar si ahora tiene contrato
    authService.refreshUserData().subscribe(updatedUser => {
        if (!updatedUser?.contract) {
            // El usuario NO tiene contrato, redirigir al home pre-contrato
            slugService.navigateTo(['portal', 'home']);
        }
    });

    // Si NO tiene contrato, bloquear acceso inmediatamente
    if (!currentUser.contract) {
        slugService.navigateTo(['portal', 'home']);
        return false;
    }

    // Tiene contrato, permitir acceso
    return true;
};
