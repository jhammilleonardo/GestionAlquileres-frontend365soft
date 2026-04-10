import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { PermissionsService } from '../services/permissions.service';
import { SlugService } from '../services/slug.service';
import { map, filter, take, timeout, catchError, of } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

/**
 * Protege rutas de módulos específicos.
 * Requiere que la ruta tenga `data: { module: 'nombre_modulo' }`.
 *
 * - ADMIN / SUPERADMIN: acceso total
 * - EMPLEADO: solo módulos asignados
 * - TECNICO: solo maintenance
 * - Sin permiso: redirige al dashboard con mensaje
 */
export const moduleGuard: CanActivateFn = (route, _state) => {
  const permissionsService = inject(PermissionsService);
  const slugService = inject(SlugService);
  const router = inject(Router);

  const requiredModule = route.data['module'] as string | undefined;

  // Si la ruta no declara módulo → libre acceso
  if (!requiredModule) return true;

  const slug = route.paramMap.get('slug') ?? slugService.getSlug();
  if (!slug) return true;

  const permissions$ = toObservable(permissionsService.permissions);

  return permissions$.pipe(
    // Esperar a que los permisos estén cargados (no null)
    filter((p) => p !== null),
    take(1),
    // Timeout de 3s por si el fetch falla sin responder
    timeout(3000),
    map((perms) => {
      if (!perms) return true; // error de carga → no bloquear

      const { role, allowedModules } = perms;

      if (role === 'ADMIN' || role === 'SUPERADMIN') return true;

      if (allowedModules.includes(requiredModule)) return true;

      // Sin permiso → redirigir al dashboard con estado
      void router.navigate(['/', slug, 'dashboard'], {
        replaceUrl: true,
        state: { accessDenied: true, module: requiredModule },
      });
      return false;
    }),
    catchError(() => of(true)), // timeout o error → no bloquear
  );
};
