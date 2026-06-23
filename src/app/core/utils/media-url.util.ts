import { environment } from '../../../environments/environment';

/**
 * Resuelve la URL pública de un archivo servido por el backend (imágenes de
 * propiedades, etc.) a partir de su ruta almacenada.
 *
 * Centraliza lo que antes estaba repetido (y con el host `localhost:3000`
 * hardcodeado) en varios componentes/servicios: en producción esas URLs
 * apuntaban al backend local y las imágenes se rompían. Aquí se usa siempre
 * `environment.apiUrl`.
 *
 * - Rutas ya absolutas (`http(s):`), `blob:` o `data:` se devuelven tal cual.
 * - El resto se normaliza con una sola barra entre el host y la ruta.
 */
export function resolveMediaUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (/^(https?:|blob:|data:)/i.test(path)) return path;

  const base = environment.apiUrl.replace(/\/+$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}
