import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, type CanActivateFn } from '@angular/router';
import { SlugService } from '../services/slug.service';

/**
 * Resuelve el slug del tenant desde la URL y lo fija en `SlugService` ANTES de
 * que se construyan los componentes de la ruta.
 *
 * Las rutas públicas (portal público, registro de inquilino) no pasan por un
 * guard de autenticación, así que sin esto el slug solo existiría si una sesión
 * previa lo hubiera persistido en storage. Eso hacía que el portal dependiera de
 * que alguien (p. ej. el admin) estuviera logueado: sin sesión, `getSlug()` era
 * null y las llamadas al catálogo salían sin slug (`/catalog/...` → 404) y el
 * portal aparecía vacío. La URL es la única fuente de verdad del tenant.
 *
 * Nunca bloquea: siempre devuelve `true`.
 */
export const slugResolverGuard: CanActivateFn = (route) => {
  const slugService = inject(SlugService);
  const slug = findSlugInRoute(route);

  if (slug && slug !== slugService.getSlug()) {
    slugService.setSlug(slug);
  }

  return true;
};

/** Busca el parámetro `slug` en la ruta y sus ancestros. */
function findSlugInRoute(route: ActivatedRouteSnapshot | null): string | null {
  for (let current = route; current; current = current.parent) {
    const slug = current.paramMap.get('slug');
    if (slug) return slug;
  }
  return null;
}
