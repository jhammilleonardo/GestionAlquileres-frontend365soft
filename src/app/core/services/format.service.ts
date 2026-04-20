import { Injectable, signal } from '@angular/core';
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

  setConfig(config: TenantConfig): void {
    this.configSignal.set(config);
  }

  private get locale(): string {
    const country = this.configSignal()?.country ?? 'BO';
    return LOCALE_MAP[country] ?? 'es-BO';
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
