import { Injectable, computed, signal } from '@angular/core';
import { TenantConfig } from './admin/tenant-config.service';

const LOCALE_MAP: Record<string, string> = {
  US: 'en-US',
  BO: 'es-BO',
  GT: 'es-GT',
  HN: 'es-HN',
};

@Injectable({ providedIn: 'root' })
export class FormatService {
  private configSignal = signal<TenantConfig | null>(null);

  /** Modo de alquiler del tenant (`LONG_TERM`/`SHORT_TERM`/`BOTH`), o null si aún no cargó. */
  readonly rentalType = computed(() => this.configSignal()?.rental_type ?? null);

  /** País configurado para el tenant. Se usa para mantener consistencia legal/moneda. */
  readonly country = computed(() => this.configSignal()?.country ?? 'BO');

  /**
   * ¿El tenant admite corto plazo? Devuelve false sólo si el modo es
   * explícitamente `LONG_TERM`; mientras el config no cargó (null) asume que sí,
   * para no ocultar módulos durante la carga.
   */
  readonly supportsShortTerm = computed(() => this.rentalType() !== 'LONG_TERM');

  /**
   * ¿El tenant admite largo plazo? Simétrico a `supportsShortTerm`: false sólo si
   * el modo es explícitamente `SHORT_TERM`; mientras carga (null) asume que sí.
   */
  readonly supportsLongTerm = computed(() => this.rentalType() !== 'SHORT_TERM');

  setConfig(config: TenantConfig): void {
    this.configSignal.set(config);
  }

  private get locale(): string {
    return LOCALE_MAP[this.country()] ?? 'es-BO';
  }

  private get activeCurrency(): string {
    return this.configSignal()?.currency ?? 'BOB';
  }

  formatDate(value: string | Date | undefined | null): string {
    const d = this.toDate(value);
    if (!d) return '—';
    return new Intl.DateTimeFormat(this.locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  }

  formatDateTime(value: string | Date | undefined | null): string {
    const d = this.toDate(value);
    if (!d) return '—';
    return new Intl.DateTimeFormat(this.locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  }

  formatCurrency(amount: number | undefined | null, currencyOverride?: string): string {
    if (amount == null) return '—';
    const currency = currencyOverride ?? this.activeCurrency;
    return new Intl.NumberFormat(this.locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  private toDate(value: string | Date | undefined | null): Date | null {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
}
