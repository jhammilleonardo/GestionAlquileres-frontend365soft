import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { TenantAuthService } from '../services/tenant/tenant-auth.service';
import { SlugService } from '../services/slug.service';
import { ContractService } from '../services/admin/contract.service';

const ACTIVE_TENANT_CONTRACT_STATUSES = new Set(['ACTIVO', 'FIRMADO', 'POR_VENCER']);
const DRAFT_TENANT_CONTRACT_STATUSES = new Set(['BORRADOR', 'PENDIENTE']);

function getRouteSlug(route: ActivatedRouteSnapshot): string | null {
  for (const snapshot of route.pathFromRoot) {
    const slug = snapshot.paramMap.get('slug');
    if (slug) return slug;
  }
  return null;
}

export const tenantAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(TenantAuthService);
  const slugService = inject(SlugService);
  const router = inject(Router);

  // Get slug from URL
  const slug = getRouteSlug(route);

  // Check if slug exists in URL
  if (!slug) {
    // No slug in URL, redirect to main login
    void router.navigate(['/login'], {
      queryParams: { returnUrl: state.url },
    });
    return false;
  }

  if (authService.isAuthenticated()) {
    // Validate URL slug against the authenticated user's tenant_slug
    const currentUser = authService.currentUser();
    const userSlug = currentUser?.tenant_slug || currentUser?.tenantSlug || null;

    if (userSlug && slug !== userSlug) {
      // URL slug doesn't match user's tenant — redirect to correct URL
      const correctUrl = state.url.replace(`/${slug}/`, `/${userSlug}/`);
      void router.navigate([correctUrl], { replaceUrl: true });
      return false;
    }

    // Set verified slug
    slugService.setSlug(userSlug || slug);
    return true;
  }

  // Set slug from URL as fallback (for unauthenticated redirects)
  slugService.setSlug(slug);

  // Redirect to tenant login with slug
  // Usar replaceUrl para que la redirección no quede en el historial
  void router.navigate(['/', slug, 'login'], {
    queryParams: { returnUrl: state.url },
    replaceUrl: true,
  });
  return false;
};

export const tenantLoginGuard: CanActivateFn = (route, _state) => {
  const authService = inject(TenantAuthService);
  const slugService = inject(SlugService);
  const router = inject(Router);

  // Get slug from URL
  const slug = getRouteSlug(route);

  // Check if slug exists in URL
  if (slug) {
    // Set slug in SlugService
    slugService.setSlug(slug);
  }

  // If already logged in, check for contract and redirect accordingly
  // Usar replaceUrl para que el login no quede en el historial
  if (authService.isAuthenticated()) {
    const currentUser = authService.currentUser();

    if (currentUser && slug) {
      // Check if user has contract in the current user object (fast path)
      if (currentUser.contract) {
        void router.navigate(['/', slug, 'portal', 'dashboard'], { replaceUrl: true });
        return false;
      }

      // No contract in user object, default to home pre-contract
      // The tenant-layout component will do a more thorough check via ContractService
      // and redirect if contracts are found
      void router.navigate(['/', slug, 'portal', 'home'], { replaceUrl: true });
      return false;
    } else if (!slug) {
      void router.navigate(['/portal/dashboard'], { replaceUrl: true });
      return false;
    }
  }

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
  const slug = getRouteSlug(route);

  // Si no está autenticado, redirigir al login
  if (!currentUser) {
    if (slug) {
      void router.navigate(['/', slug, 'login'], {
        queryParams: { returnUrl: state.url },
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
        const hasActive = contracts.some((c) =>
          ACTIVE_TENANT_CONTRACT_STATUSES.has(String(c.status)),
        );
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
    catchError(() => of(true)),
  );
};

/**
 * Guard para rutas de inquilinos CON CONTRATO
 * Solo permite acceso si el usuario TIENE un contrato activo
 */
export const tenantWithContractGuard: CanActivateFn = (route, state) => {
  const authService = inject(TenantAuthService);
  const contractService = inject(ContractService);
  const router = inject(Router);
  const slugService = inject(SlugService);

  const currentUser = authService.currentUser();
  const slug = getRouteSlug(route);

  // Si no está autenticado, redirigir al login
  if (!currentUser) {
    if (slug) {
      void router.navigate(['/', slug, 'login'], {
        queryParams: { returnUrl: state.url },
      });
    }
    return false;
  }

  // Si NO tiene contrato, bloquear acceso inmediatamente
  if (!currentUser.contract) {
    return contractService.hasAnyContracts().pipe(
      map((contracts) => {
        const hasActive = contracts.some((contract) =>
          ACTIVE_TENANT_CONTRACT_STATUSES.has(String(contract.status)),
        );

        if (hasActive) return true;

        const hasDraft = contracts.some((contract) =>
          DRAFT_TENANT_CONTRACT_STATUSES.has(String(contract.status)),
        );
        slugService.navigateTo(
          hasDraft ? ['portal', 'documentos', 'contratos'] : ['portal', 'home'],
        );
        return false;
      }),
      catchError(() => {
        slugService.navigateTo(['portal', 'home']);
        return of(false);
      }),
    );
  }

  // Tiene contrato, permitir acceso
  return true;
};

/**
 * Permite ver contratos del tenant si existe al menos un contrato asociado.
 * Es distinto de tenantWithContractGuard porque BORRADOR/PENDIENTE debe poder
 * abrirse para revisión/firma sin habilitar pagos, mantenimiento o dashboard.
 */
export const tenantContractDocumentGuard: CanActivateFn = (route, state) => {
  const authService = inject(TenantAuthService);
  const contractService = inject(ContractService);
  const router = inject(Router);
  const slugService = inject(SlugService);

  const currentUser = authService.currentUser();
  const slug = getRouteSlug(route);

  if (!currentUser) {
    if (slug) {
      void router.navigate(['/', slug, 'login'], {
        queryParams: { returnUrl: state.url },
      });
    }
    return false;
  }

  if (currentUser.contract) return true;

  return contractService.hasAnyContracts().pipe(
    map((contracts) => {
      if (contracts.length > 0) return true;
      slugService.navigateTo(['portal', 'home']);
      return false;
    }),
    catchError(() => {
      slugService.navigateTo(['portal', 'home']);
      return of(false);
    }),
  );
};
