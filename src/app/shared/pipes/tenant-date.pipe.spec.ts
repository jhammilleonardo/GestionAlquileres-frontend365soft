import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TenantDatePipe } from './tenant-date.pipe';
import { FormatService } from '../../core/services/format.service';

describe('TenantDatePipe', () => {
  let pipe: TenantDatePipe;
  let formatService: FormatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    formatService = TestBed.inject(FormatService);
    pipe = TestBed.runInInjectionContext(() => new TenantDatePipe());
  });

  it('delega en FormatService.formatDate cuando includeTime=false (por defecto)', () => {
    const spy = vi.spyOn(formatService, 'formatDate').mockReturnValue('15/06/2024');
    const result = pipe.transform('2024-06-15');
    expect(spy).toHaveBeenCalledWith('2024-06-15');
    expect(result).toBe('15/06/2024');
  });

  it('delega en FormatService.formatDateTime cuando includeTime=true', () => {
    const spy = vi.spyOn(formatService, 'formatDateTime').mockReturnValue('15/06/2024 14:30');
    const result = pipe.transform('2024-06-15T14:30:00', true);
    expect(spy).toHaveBeenCalledWith('2024-06-15T14:30:00');
    expect(result).toBe('15/06/2024 14:30');
  });

  it('pasa null al servicio y retorna "—"', () => {
    const result = pipe.transform(null);
    expect(result).toBe('—');
  });

  it('pasa undefined al servicio y retorna "—"', () => {
    const result = pipe.transform(undefined);
    expect(result).toBe('—');
  });

  it('acepta objeto Date', () => {
    const date = new Date('2024-03-20');
    const spy = vi.spyOn(formatService, 'formatDate');
    pipe.transform(date);
    expect(spy).toHaveBeenCalledWith(date);
  });

  it('no llama a formatDateTime cuando includeTime es false', () => {
    const spyDateTime = vi.spyOn(formatService, 'formatDateTime');
    pipe.transform('2024-01-01');
    expect(spyDateTime).not.toHaveBeenCalled();
  });
});
