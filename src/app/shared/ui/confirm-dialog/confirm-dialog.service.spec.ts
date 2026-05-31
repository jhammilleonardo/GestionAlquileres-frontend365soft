import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { ConfirmDialogService } from './confirm-dialog.service';

describe('ConfirmDialogService', () => {
  it('opens a dialog request', () => {
    const service = TestBed.inject(ConfirmDialogService);

    void service.open({
      title: 'Eliminar',
      message: 'Confirma la accion',
    });

    expect(service.request()?.options.title).toBe('Eliminar');
    expect(service.request()?.options.message).toBe('Confirma la accion');
  });

  it('resolves confirmed result', async () => {
    const service = TestBed.inject(ConfirmDialogService);
    const result = service.open({
      title: 'Motivo',
      message: 'Escribe un motivo',
    });

    service.resolve(true, 'Comprobante incorrecto');

    await expect(result).resolves.toEqual({
      confirmed: true,
      value: 'Comprobante incorrecto',
    });
    expect(service.request()).toBeNull();
  });

  it('resolves false when cancelled', async () => {
    const service = TestBed.inject(ConfirmDialogService);
    const result = service.confirm({
      title: 'Cancelar',
      message: 'Confirma',
    });

    service.resolve(false);

    await expect(result).resolves.toBe(false);
  });
});
