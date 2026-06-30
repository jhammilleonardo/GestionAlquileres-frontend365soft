import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { FormatService } from '../services/format.service';
import { TenantConfigService } from '../services/admin/tenant-config.service';
import { SlugService } from '../services/slug.service';

/**
 * Bloquea rutas que pertenecen a un modo de alquiler que el tenant no admite.
 * Complementa el filtrado del sidebar: el menú oculta el item, pero sin este
 * guard la ruta seguía accesible escribiendo la URL directa.
 *
 * Requiere `data: { rentalMode: 'short_term' | 'long_term' }` en la ruta.
 * - `short_term` → solo tenants SHORT_TERM o BOTH
 * - `long_term`  → solo tenants LONG_TERM o BOTH
 *
 * El config se carga de forma asíncrona en el layout, que se instancia DESPUÉS
 * de los guards; por eso, si aún no está en `FormatService`, el guard lo trae él
 * mismo (y de paso lo cachea para el resto de la app).
 */
export const rentalModeGuard: CanActivateFn = (route, state) => {
  const formatService = inject(FormatService);
  const tenantConfigService = inject(TenantConfigService);
  const slugService = inject(SlugService);
  const router = inject(Router);

  const requiredMode = route.data['rentalMode'] as 'short_term' | 'long_term' | undefined;

  // La ruta no declara modo → libre acceso
  if (!requiredMode) return true;

  const slug = route.paramMap.get('slug') ?? slugService.getSlug();
  if (!slug) return router.createUrlTree(['/login']);

  const redirect = (): false => {
    const target = state.url.includes(`/${slug}/portal/`)
      ? ['/', slug, 'portal', 'new-application']
      : ['/', slug, 'dashboard'];

    void router.navigate(target, {
      replaceUrl: true,
      state: { rentalModeBlocked: true, rentalMode: requiredMode },
    });
    return false;
  };

  const decide = (): boolean => {
    if (requiredMode === 'short_term' && !formatService.supportsShortTerm()) return redirect();
    if (requiredMode === 'long_term' && !formatService.supportsLongTerm()) return redirect();
    return true;
  };

  // Config ya cargado → decidir directo
  if (formatService.rentalType() !== null) return decide();

  // No cargado → traer config, cachearlo y luego decidir
  return tenantConfigService.getConfig(slug).pipe(
    map((config) => {
      formatService.setConfig(config);
      return decide();
    }),
    // Error de carga → no bloquear (degradar abierto, igual que moduleGuard)
    catchError(() => of(true)),
  );
};
