import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'X-CSRF-Token';

/** Lee una cookie no-HttpOnly por nombre (la del CSRF es legible por diseño). */
export function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Envía las cookies de sesión (`withCredentials`) en las llamadas a la API y, en
 * mutaciones, reenvía el token CSRF como header (patrón double-submit). Acotado
 * a la URL de la API para no afectar requests a terceros (S3, mapas, etc.).
 *
 * Es aditivo: si el backend autentica por header Bearer (e2e/legacy) la cookie
 * y el CSRF simplemente se ignoran; cuando la sesión es por cookie, habilitan el
 * flujo sin tocar cada servicio.
 */
export const credentialsCsrfInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  let apiReq = req.clone({ withCredentials: true });

  if (MUTATING_METHODS.has(req.method.toUpperCase()) && !apiReq.headers.has(CSRF_HEADER)) {
    const csrf = readCookie(CSRF_COOKIE);
    if (csrf) {
      apiReq = apiReq.clone({ setHeaders: { [CSRF_HEADER]: csrf } });
    }
  }

  return next(apiReq);
};
