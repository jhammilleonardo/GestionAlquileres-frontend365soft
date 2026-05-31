import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds a toast with default info variant', () => {
    service.show('Mensaje');

    const [toast] = service.toasts();
    expect(toast?.message).toBe('Mensaje');
    expect(toast?.variant).toBe('info');
    expect(toast?.duration).toBe(3500);
  });

  it('dismisses a toast by id', () => {
    const id = service.success('Guardado');

    service.dismiss(id);

    expect(service.toasts()).toEqual([]);
  });

  it('auto dismisses after duration', () => {
    vi.useFakeTimers();

    service.error('Fallo', 100);

    expect(service.toasts().length).toBe(1);

    vi.advanceTimersByTime(100);

    expect(service.toasts()).toEqual([]);
  });
});
