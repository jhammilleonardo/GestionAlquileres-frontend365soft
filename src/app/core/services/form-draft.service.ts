import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type DraftStorage = 'local' | 'session';

interface DraftEnvelope<T> {
  value: T;
  savedAt: number;
}

/**
 * Persistencia genérica de borradores de formularios.
 *
 * Centraliza el manejo SSR-safe de `localStorage`/`sessionStorage` para que los
 * formularios no repitan los try/catch ni la verificación de plataforma (DRY).
 * Los borradores son best-effort: si el almacenamiento no está disponible o está
 * lleno, la operación se omite sin romper el flujo del usuario.
 */
@Injectable({ providedIn: 'root' })
export class FormDraftService {
  private readonly platformId = inject(PLATFORM_ID);

  save<T>(key: string, value: T, storage: DraftStorage = 'local'): void {
    if (!this.isBrowser()) return;

    const envelope: DraftEnvelope<T> = { value, savedAt: Date.now() };

    try {
      this.storage(storage).setItem(key, JSON.stringify(envelope));
    } catch (error) {
      // Cuota llena o almacenamiento bloqueado: el borrador es opcional, no interrumpir.
      console.warn(`FormDraftService: no se pudo guardar el borrador "${key}"`, error);
    }
  }

  load<T>(key: string, storage: DraftStorage = 'local'): T | null {
    if (!this.isBrowser()) return null;

    try {
      const raw = this.storage(storage).getItem(key);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as DraftEnvelope<T>;
      return parsed?.value ?? null;
    } catch (error) {
      // Borrador corrupto: lo descartamos para no dejar al usuario en un estado roto.
      console.warn(`FormDraftService: borrador "${key}" inválido, se descarta`, error);
      this.clear(key, storage);
      return null;
    }
  }

  clear(key: string, storage: DraftStorage = 'local'): void {
    if (!this.isBrowser()) return;

    try {
      this.storage(storage).removeItem(key);
    } catch (error) {
      console.warn(`FormDraftService: no se pudo limpiar el borrador "${key}"`, error);
    }
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private storage(kind: DraftStorage): Storage {
    return kind === 'session' ? sessionStorage : localStorage;
  }
}
