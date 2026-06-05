import { TestBed } from '@angular/core/testing';
import { Router, type ActivatedRouteSnapshot, type RouterStateSnapshot } from '@angular/router';
import { firstValueFrom, isObservable, of } from 'rxjs';

import { tenantContractDocumentGuard, tenantWithContractGuard } from './tenant-auth.guard';
import { TenantAuthService } from '../services/tenant/tenant-auth.service';
import { ContractService } from '../services/admin/contract.service';
import { SlugService } from '../services/slug.service';

type GuardResult = boolean;

async function resolveGuardResult(result: unknown): Promise<GuardResult> {
  if (isObservable(result)) {
    return (await firstValueFrom(result)) as GuardResult;
  }
  return result as GuardResult;
}

function routeWithSlug(slug = 'acme'): ActivatedRouteSnapshot {
  const root = {
    paramMap: { get: (key: string) => (key === 'slug' ? slug : null) },
  } as ActivatedRouteSnapshot;

  return {
    paramMap: { get: () => null },
    pathFromRoot: [root],
  } as unknown as ActivatedRouteSnapshot;
}

describe('tenant portal guards', () => {
  let currentUser: unknown;
  let navigateSpy: ReturnType<typeof vi.fn>;
  let navigateToSpy: ReturnType<typeof vi.fn>;
  let hasAnyContractsSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    currentUser = { id: 7, tenant_slug: 'acme' };
    navigateSpy = vi.fn().mockResolvedValue(true);
    navigateToSpy = vi.fn();
    hasAnyContractsSpy = vi.fn().mockReturnValue(of([]));

    TestBed.configureTestingModule({
      providers: [
        {
          provide: TenantAuthService,
          useValue: { currentUser: () => currentUser },
        },
        {
          provide: ContractService,
          useValue: { hasAnyContracts: hasAnyContractsSpy },
        },
        {
          provide: SlugService,
          useValue: { navigateTo: navigateToSpy },
        },
        {
          provide: Router,
          useValue: { navigate: navigateSpy },
        },
      ],
    });
  });

  it('redirects unauthenticated tenants to /:slug/login, not /:slug/portal/login', async () => {
    currentUser = null;

    const result = await TestBed.runInInjectionContext(() =>
      resolveGuardResult(
        tenantWithContractGuard(routeWithSlug('demo'), {
          url: '/demo/portal/dashboard',
        } as RouterStateSnapshot),
      ),
    );

    expect(result).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(
      ['/', 'demo', 'login'],
      expect.objectContaining({
        queryParams: { returnUrl: '/demo/portal/dashboard' },
      }),
    );
  });

  it('allows with-contract routes when the active contract is returned by API', async () => {
    hasAnyContractsSpy.mockReturnValueOnce(of([{ id: 11, status: 'ACTIVO' }]));

    const result = await TestBed.runInInjectionContext(() =>
      resolveGuardResult(
        tenantWithContractGuard(routeWithSlug(), {
          url: '/acme/portal/dashboard',
        } as RouterStateSnapshot),
      ),
    );

    expect(result).toBe(true);
    expect(navigateToSpy).not.toHaveBeenCalled();
  });

  it('redirects tenants with only draft contracts to contract documents', async () => {
    hasAnyContractsSpy.mockReturnValueOnce(of([{ id: 11, status: 'BORRADOR' }]));

    const result = await TestBed.runInInjectionContext(() =>
      resolveGuardResult(
        tenantWithContractGuard(routeWithSlug(), {
          url: '/acme/portal/pagos',
        } as RouterStateSnapshot),
      ),
    );

    expect(result).toBe(false);
    expect(navigateToSpy).toHaveBeenCalledWith(['portal', 'documentos', 'contratos']);
  });

  it('allows contract document routes for draft contracts', async () => {
    hasAnyContractsSpy.mockReturnValueOnce(of([{ id: 11, status: 'BORRADOR' }]));

    const result = await TestBed.runInInjectionContext(() =>
      resolveGuardResult(
        tenantContractDocumentGuard(routeWithSlug(), {
          url: '/acme/portal/documentos/contratos',
        } as RouterStateSnapshot),
      ),
    );

    expect(result).toBe(true);
    expect(navigateToSpy).not.toHaveBeenCalled();
  });

  it('blocks contract document routes when the tenant has no contracts', async () => {
    hasAnyContractsSpy.mockReturnValueOnce(of([]));

    const result = await TestBed.runInInjectionContext(() =>
      resolveGuardResult(
        tenantContractDocumentGuard(routeWithSlug(), {
          url: '/acme/portal/documentos/contratos',
        } as RouterStateSnapshot),
      ),
    );

    expect(result).toBe(false);
    expect(navigateToSpy).toHaveBeenCalledWith(['portal', 'home']);
  });
});
