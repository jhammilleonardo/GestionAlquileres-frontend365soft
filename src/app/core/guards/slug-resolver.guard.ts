import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, type CanActivateFn } from '@angular/router';
import { SlugService } from '../services/slug.service';

/**
 * Formato válido de slug de tenant. Debe mantenerse sincronizado con
 * `TENANT_SLUG_REGEX` del backend, donde el slug se interpola para derivar el
 * schema de Postgres (`tenant_<slug>`). Validar también en el cliente evita que
 * un slug malformado de la URL (p. ej. con `/` codificado o `..`) llegue a
 * construir endpoints inesperados.
 */
const TENANT_SLUG_REGEX = /^[a-z0-9][a-z0-9-]{2,49}$/;

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

  // Solo se fija un slug con formato válido: uno malformado no debe propagarse
  // a la construcción de endpoints. El backend es la frontera real (rechaza
  // tenants inexistentes y ata el JWT al tenant), esto es defensa en profundidad.
  if (slug && TENANT_SLUG_REGEX.test(slug) && slug !== slugService.getSlug()) {
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
