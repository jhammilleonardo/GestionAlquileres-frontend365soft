import { ErrorHandler, Injectable } from '@angular/core';
import * as Sentry from '@sentry/browser';

/**
 * Reemplaza el ErrorHandler de Angular para enviar errores no capturados a Sentry.
 * Los errores HttpErrorResponse con status 4xx se ignoran (manejados en interceptores).
 */
@Injectable()
export class SentryErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    const err = error as { status?: number; rejection?: { status?: number } };

    // Ignorar errores HTTP 4xx
    const status = err?.status ?? err?.rejection?.status;
    if (status !== undefined && status >= 400 && status < 500) {
      console.warn('Ignored 4xx error:', error);
      return;
    }

    console.error(error);
    Sentry.captureException(error);
  }
}
