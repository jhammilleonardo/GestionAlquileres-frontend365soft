import { HttpErrorResponse } from '@angular/common/http';

/**
 * Extrae un mensaje de error legible para el usuario a partir de un error
 * de origen desconocido, sin recurrir a `any`.
 *
 * Soporta:
 * - Los `Error` normalizados que lanza `ApiClientService` (mensaje ya resuelto).
 * - Los `HttpErrorResponse` crudos de `HttpClient` (cuerpo string u objeto
 *   con `message: string | string[]`).
 * - Cualquier otro objeto con la forma `{ message: string }`.
 *
 * @param error    Error capturado (tipar el callback como `unknown`).
 * @param fallback Mensaje a usar cuando no se puede extraer nada útil.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = 'Ocurrió un error inesperado. Inténtalo de nuevo.',
): string {
  if (error instanceof HttpErrorResponse) {
    const fromBody = extractBackendMessage(error.error);
    if (fromBody) {
      return fromBody;
    }
    if (error.status === 0) {
      // status 0 = la respuesta no llegó: servidor inaccesible, petición
      // bloqueada por el navegador (CORS/extensión) o red caída.
      return 'No se pudo contactar con el servidor. Verifica que el servicio esté disponible e inténtalo de nuevo.';
    }
    return error.message || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return extractBackendMessage(error) ?? fallback;
}

/**
 * Normaliza el cuerpo de un error (string, `{ message }` o `{ message: [] }`)
 * a un único mensaje, o `null` si no contiene texto aprovechable.
 */
function extractBackendMessage(body: unknown): string | null {
  if (typeof body === 'string') {
    return body.trim() || null;
  }

  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message: unknown }).message;
    if (typeof message === 'string') {
      return message.trim() || null;
    }
    if (Array.isArray(message)) {
      const first = message.find((item): item is string => typeof item === 'string');
      return first ?? null;
    }
  }

  return null;
}
