import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { FormatService } from './format.service';
import { TenantConfig } from './admin/tenant-config.service';

// Tests de integración intencionales: se verifica el resultado real de Intl.*
// para garantizar que el servicio produce output correcto en cada locale,
// no solo que llama a los métodos correctos.

const makeConfig = (country: string, currency: string): TenantConfig =>
  ({ country, currency }) as TenantConfig;

// Helper: crea fecha en hora local para evitar desfase de timezone.
// new Date('YYYY-MM-DD') interpreta como UTC medianoche y puede cambiar de día.
const localDate = (year: number, month: number, day: number) => new Date(year, month - 1, day);

const localDateTime = (year: number, month: number, day: number, h: number, m: number) =>
  new Date(year, month - 1, day, h, m);

describe('FormatService', () => {
  let service: FormatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FormatService);
  });

  // ── formatDate ────────────────────────────────────────────────────────────

  describe('formatDate', () => {
    it('devuelve "—" para null', () => {
      expect(service.formatDate(null)).toBe('—');
    });

    it('devuelve "—" para undefined', () => {
      expect(service.formatDate(undefined)).toBe('—');
    });

    it('devuelve "—" para cadena vacía', () => {
      expect(service.formatDate('')).toBe('—');
    });

    it('devuelve "—" para fecha inválida', () => {
      expect(service.formatDate('no-es-fecha')).toBe('—');
    });

    it('formatea fecha con locale es-BO por defecto (sin config)', () => {
      const result = service.formatDate(localDate(2024, 6, 15));
      expect(result).toMatch(/15/);
      expect(result).toMatch(/06/);
      expect(result).toMatch(/2024/);
    });

    it('formatea fecha con locale en-US cuando country=US', () => {
      service.setConfig(makeConfig('US', 'USD'));
      const result = service.formatDate(localDate(2024, 6, 15));
      expect(result).toMatch(/06/);
      expect(result).toMatch(/15/);
      expect(result).toMatch(/2024/);
    });

    it('acepta objeto Date directamente', () => {
      service.setConfig(makeConfig('BO', 'BOB'));
      const result = service.formatDate(localDate(2024, 1, 5));
      expect(result).toMatch(/05/);
      expect(result).toMatch(/2024/);
    });
  });

  // ── formatDateTime ────────────────────────────────────────────────────────

  describe('formatDateTime', () => {
    it('devuelve "—" para null', () => {
      expect(service.formatDateTime(null)).toBe('—');
    });

    it('incluye la fecha en el resultado', () => {
      service.setConfig(makeConfig('BO', 'BOB'));
      const result = service.formatDateTime(localDateTime(2024, 6, 15, 14, 30));
      expect(result).toMatch(/15/);
      expect(result).toMatch(/2024/);
    });

    it('incluye minutos en el resultado', () => {
      service.setConfig(makeConfig('BO', 'BOB'));
      const result = service.formatDateTime(localDateTime(2024, 6, 15, 14, 45));
      expect(result).toMatch(/45/);
    });

    it('incluye la hora en el resultado', () => {
      service.setConfig(makeConfig('BO', 'BOB'));
      // Hora 10 es inequívoca: no aparece en ningún campo de fecha
      const result = service.formatDateTime(localDateTime(2024, 6, 15, 10, 0));
      expect(result).toMatch(/10/);
    });

    it('formatea con locale es-GT cuando country=GT', () => {
      service.setConfig(makeConfig('GT', 'GTQ'));
      const result = service.formatDateTime(localDateTime(2024, 6, 15, 8, 0));
      expect(result).toMatch(/2024/);
    });
  });

  // ── formatCurrency ────────────────────────────────────────────────────────

  describe('formatCurrency', () => {
    it('devuelve "—" para null', () => {
      expect(service.formatCurrency(null)).toBe('—');
    });

    it('devuelve "—" para undefined', () => {
      expect(service.formatCurrency(undefined)).toBe('—');
    });

    it('formatea en BOB por defecto (sin config)', () => {
      const result = service.formatCurrency(1500);
      expect(result).toMatch(/1[.,]500/);
      expect(result).toMatch(/Bs/);
    });

    it('formatea en USD cuando country=US', () => {
      service.setConfig(makeConfig('US', 'USD'));
      const result = service.formatCurrency(1500);
      expect(result).toMatch(/1[.,]500/);
      expect(result).toMatch(/\$/);
    });

    it('usa currencyOverride ignorando la moneda del tenant', () => {
      service.setConfig(makeConfig('US', 'USD'));
      const result = service.formatCurrency(500, 'GTQ');
      expect(result).toMatch(/500/);
      expect(result).toMatch(/GTQ|Q/);
    });

    it('formatea cero correctamente', () => {
      service.setConfig(makeConfig('BO', 'BOB'));
      const result = service.formatCurrency(0);
      expect(result).toMatch(/0[.,]00/);
    });

    it('formatea números decimales con exactamente 2 dígitos', () => {
      service.setConfig(makeConfig('BO', 'BOB'));
      const result = service.formatCurrency(99.9);
      expect(result).toMatch(/99[.,]90/);
    });

    it('redondea a 2 decimales (no trunca)', () => {
      service.setConfig(makeConfig('BO', 'BOB'));
      const result = service.formatCurrency(1.999);
      expect(result).toMatch(/2[.,]00/);
    });

    it('aplica separador de miles en números grandes', () => {
      service.setConfig(makeConfig('BO', 'BOB'));
      const result = service.formatCurrency(1000000);
      // Debe haber algún separador de miles (. o ,)
      expect(result).toMatch(/1[.,\s]000[.,\s]000/);
    });

    it('formatea en GTQ cuando country=GT', () => {
      service.setConfig(makeConfig('GT', 'GTQ'));
      const result = service.formatCurrency(250);
      expect(result).toMatch(/250/);
    });

    it('formatea en HNL cuando country=HN', () => {
      service.setConfig(makeConfig('HN', 'HNL'));
      const result = service.formatCurrency(750);
      expect(result).toMatch(/750/);
    });
  });

  // ── rentalType / supportsShortTerm (gating por modo) ──────────────────────

  describe('supportsShortTerm', () => {
    const makeMode = (rental_type: string): TenantConfig =>
      ({ country: 'BO', currency: 'BOB', rental_type }) as TenantConfig;

    it('asume true mientras el config no cargó (null)', () => {
      expect(service.rentalType()).toBeNull();
      expect(service.supportsShortTerm()).toBe(true);
    });

    it('es false sólo cuando el modo es LONG_TERM', () => {
      service.setConfig(makeMode('LONG_TERM'));
      expect(service.supportsShortTerm()).toBe(false);
    });

    it('es true para SHORT_TERM y BOTH', () => {
      service.setConfig(makeMode('SHORT_TERM'));
      expect(service.supportsShortTerm()).toBe(true);
      service.setConfig(makeMode('BOTH'));
      expect(service.supportsShortTerm()).toBe(true);
    });
  });

  describe('supportsLongTerm', () => {
    const makeMode = (rental_type: string): TenantConfig =>
      ({ country: 'BO', currency: 'BOB', rental_type }) as TenantConfig;

    it('asume true mientras el config no cargó (null)', () => {
      expect(service.supportsLongTerm()).toBe(true);
    });

    it('es false sólo cuando el modo es SHORT_TERM', () => {
      service.setConfig(makeMode('SHORT_TERM'));
      expect(service.supportsLongTerm()).toBe(false);
    });

    it('es true para LONG_TERM y BOTH', () => {
      service.setConfig(makeMode('LONG_TERM'));
      expect(service.supportsLongTerm()).toBe(true);
      service.setConfig(makeMode('BOTH'));
      expect(service.supportsLongTerm()).toBe(true);
    });

    it('es complementario de supportsShortTerm en los modos exclusivos', () => {
      service.setConfig(makeMode('SHORT_TERM'));
      expect(service.supportsShortTerm()).toBe(true);
      expect(service.supportsLongTerm()).toBe(false);
      service.setConfig(makeMode('LONG_TERM'));
      expect(service.supportsShortTerm()).toBe(false);
      expect(service.supportsLongTerm()).toBe(true);
    });
  });

  // ── setConfig / locale dinámico ───────────────────────────────────────────

  describe('setConfig', () => {
    it('cambia el locale al actualizar la configuración', () => {
      service.setConfig(makeConfig('BO', 'BOB'));
      const before = service.formatCurrency(1000);

      service.setConfig(makeConfig('US', 'USD'));
      const after = service.formatCurrency(1000);

      expect(before).not.toBe(after);
    });

    it('cambia el resultado de formatDate al actualizar la configuración', () => {
      service.setConfig(makeConfig('BO', 'BOB'));
      const before = service.formatDate(localDate(2024, 6, 15));

      service.setConfig(makeConfig('US', 'USD'));
      const after = service.formatDate(localDate(2024, 6, 15));

      // en-US invierte mes y día respecto a es-BO
      expect(before).not.toBe(after);
    });
  });
});
