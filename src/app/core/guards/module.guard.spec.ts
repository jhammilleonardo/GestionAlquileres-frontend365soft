import { TestBed } from '@angular/core/testing';
import {
  Router,
  type ActivatedRouteSnapshot,
  type RouterStateSnapshot,
  type UrlTree,
} from '@angular/router';
import { signal } from '@angular/core';
import { firstValueFrom, isObservable } from 'rxjs';

import { moduleGuard } from './module.guard';
import { PermissionsService, type MyPermissions } from '../services/permissions.service';
import { SlugService } from '../services/slug.service';

/**
 * Helper para ejecutar el moduleGuard dentro del contexto de inyección
 * y normalizar el resultado (boolean, UrlTree u Observable) a una promesa.
 */
async function runGuard(route: Partial<ActivatedRouteSnapshot>): Promise<boolean | UrlTree> {
  const result = TestBed.runInInjectionContext(() =>
    moduleGuard(route as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
  );
  if (isObservable(result)) {
    return (await firstValueFrom(result)) as boolean | UrlTree;
  }
  return result as boolean | UrlTree;
}

function buildRoute(module?: string, slug = 'acme'): Partial<ActivatedRouteSnapshot> {
  return {
    data: module ? { module } : {},
    paramMap: {
      get: (key: string) => (key === 'slug' ? slug : null),
    } as ActivatedRouteSnapshot['paramMap'],
  };
}

describe('moduleGuard', () => {
  let permissionsSignal: ReturnType<typeof signal<MyPermissions | null>>;
  let navigateSpy: ReturnType<typeof vi.fn>;
  let createUrlTreeSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    permissionsSignal = signal<MyPermissions | null>(null);
    navigateSpy = vi.fn().mockResolvedValue(true);
    createUrlTreeSpy = vi.fn().mockReturnValue({ __isUrlTree: true } as unknown as UrlTree);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: PermissionsService,
          useValue: { permissions: permissionsSignal.asReadonly() },
        },
        {
          provide: SlugService,
          useValue: { getSlug: () => 'acme' },
        },
        {
          provide: Router,
          useValue: { navigate: navigateSpy, createUrlTree: createUrlTreeSpy },
        },
      ],
    });
  });

  it('permite acceso libre si la ruta no declara módulo', async () => {
    const result = await runGuard(buildRoute(undefined));
    expect(result).toBe(true);
  });

  it('redirige a /login si no hay slug', async () => {
    TestBed.overrideProvider(SlugService, { useValue: { getSlug: () => null } });
    const result = await runGuard(buildRoute('properties', ''));
    expect(createUrlTreeSpy).toHaveBeenCalledWith(['/login']);
    expect(result).toEqual({ __isUrlTree: true });
  });

  it('da acceso total a ADMIN', async () => {
    permissionsSignal.set({ role: 'ADMIN', allowedModules: [] });
    const result = await runGuard(buildRoute('properties'));
    expect(result).toBe(true);
  });

  it('da acceso total a SUPERADMIN', async () => {
    permissionsSignal.set({ role: 'SUPERADMIN', allowedModules: [] });
    const result = await runGuard(buildRoute('payments'));
    expect(result).toBe(true);
  });

  it('permite a TECNICO solo el módulo maintenance', async () => {
    permissionsSignal.set({ role: 'TECNICO', allowedModules: [] });
    const result = await runGuard(buildRoute('maintenance'));
    expect(result).toBe(true);
  });

  it('bloquea a TECNICO en módulos distintos de maintenance', async () => {
    permissionsSignal.set({ role: 'TECNICO', allowedModules: [] });
    const result = await runGuard(buildRoute('payments'));
    expect(result).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(
      ['/', 'acme', 'dashboard'],
      expect.objectContaining({ state: expect.objectContaining({ accessDenied: true }) }),
    );
  });

  it('permite a EMPLEADO un módulo en su lista de permitidos', async () => {
    permissionsSignal.set({ role: 'EMPLEADO', allowedModules: ['properties', 'contracts'] });
    const result = await runGuard(buildRoute('contracts'));
    expect(result).toBe(true);
  });

  it('bloquea a EMPLEADO un módulo fuera de su lista', async () => {
    permissionsSignal.set({ role: 'EMPLEADO', allowedModules: ['properties'] });
    const result = await runGuard(buildRoute('payments'));
    expect(result).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(
      ['/', 'acme', 'dashboard'],
      expect.objectContaining({
        state: expect.objectContaining({ accessDenied: true, module: 'payments' }),
      }),
    );
  });
});
