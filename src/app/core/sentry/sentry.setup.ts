import * as Sentry from '@sentry/browser';
import type { ErrorEvent, EventHint } from '@sentry/browser';

/**
 * Inicializa Sentry solo si hay DSN configurado y el entorno es staging o production.
 */
export function setupSentry(dsn: string, environment: string): void {
  const activeEnvs = ['staging', 'production'];

  if (!dsn || !activeEnvs.includes(environment)) {
    return;
  }

  Sentry.init({
    dsn,
    environment,
    tracesSampleRate: environment === 'staging' ? 1.0 : 0.1,
    beforeSend(event: ErrorEvent, hint: EventHint): ErrorEvent | null {
      // No enviar errores HTTP 4xx — son errores del cliente, no del sistema
      const err = hint?.originalException as { status?: number } | null;
      const status = err?.status;
      if (status !== undefined && status >= 400 && status < 500) {
        return null;
      }
      return event;
    },
  });
}

/**
 * Adjunta el tenantSlug al scope de Sentry para todas las capturas posteriores.
 * Llamar después de que el usuario/tenant esté autenticado.
 */
export function setSentryTenant(tenantSlug: string, userId?: number): void {
  Sentry.getCurrentScope().setTag('tenantSlug', tenantSlug);
  if (userId !== undefined) {
    Sentry.getCurrentScope().setUser({ id: String(userId) });
  }
}
