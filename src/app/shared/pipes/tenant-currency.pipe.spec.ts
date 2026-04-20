import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TenantCurrencyPipe } from './tenant-currency.pipe';
import { FormatService } from '../../core/services/format.service';

describe('TenantCurrencyPipe', () => {
  let pipe: TenantCurrencyPipe;
  let formatService: FormatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    formatService = TestBed.inject(FormatService);
    pipe = TestBed.runInInjectionContext(() => new TenantCurrencyPipe());
  });

  it('delega en FormatService.formatCurrency con el monto', () => {
    const spy = vi.spyOn(formatService, 'formatCurrency').mockReturnValue('Bs 1.500,00');
    const result = pipe.transform(1500);
    expect(spy).toHaveBeenCalledWith(1500, undefined);
    expect(result).toBe('Bs 1.500,00');
  });

  it('pasa currencyOverride al servicio cuando se especifica', () => {
    const spy = vi.spyOn(formatService, 'formatCurrency').mockReturnValue('$500.00');
    const result = pipe.transform(500, 'USD');
    expect(spy).toHaveBeenCalledWith(500, 'USD');
    expect(result).toBe('$500.00');
  });

  it('pasa null al servicio y retorna "—"', () => {
    const result = pipe.transform(null);
    expect(result).toBe('—');
  });

  it('pasa undefined al servicio y retorna "—"', () => {
    const result = pipe.transform(undefined);
    expect(result).toBe('—');
  });

  it('formatea cero sin retornar "—"', () => {
    const result = pipe.transform(0);
    expect(result).not.toBe('—');
    expect(result).toMatch(/0/);
  });

  it('formatea valores negativos', () => {
    const spy = vi.spyOn(formatService, 'formatCurrency').mockReturnValue('-Bs 100,00');
    const result = pipe.transform(-100);
    expect(spy).toHaveBeenCalledWith(-100, undefined);
    expect(result).toBe('-Bs 100,00');
  });
});
