import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ReservationAdminService } from '../../../core/services/admin/reservation-admin.service';
import { CalendarSyncSource } from '../../../core/models/reservation-admin.model';
import { ConfirmDialogService } from '../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { CalendarSyncFacade } from './calendar-sync.facade';

function makeSource(overrides?: Partial<CalendarSyncSource>): CalendarSyncSource {
  return {
    id: 1,
    unit_id: 7,
    name: 'Externo',
    url: 'https://x/c.ics',
    last_synced_at: null,
    ...overrides,
  };
}

describe('CalendarSyncFacade', () => {
  let service: {
    listSyncSources: ReturnType<typeof vi.fn>;
    createSyncSource: ReturnType<typeof vi.fn>;
    syncSourceNow: ReturnType<typeof vi.fn>;
    deleteSyncSource: ReturnType<typeof vi.fn>;
  };
  let confirm: { confirm: ReturnType<typeof vi.fn> };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let facade: CalendarSyncFacade;

  beforeEach(() => {
    service = {
      listSyncSources: vi.fn(() => of([makeSource()])),
      createSyncSource: vi.fn(() => of(makeSource({ id: 2 }))),
      syncSourceNow: vi.fn(() => of({ blocked: 4 })),
      deleteSyncSource: vi.fn(() => of(undefined)),
    };
    confirm = { confirm: vi.fn(() => Promise.resolve(true)) };
    toast = { success: vi.fn(), error: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        CalendarSyncFacade,
        { provide: ReservationAdminService, useValue: service },
        { provide: ConfirmDialogService, useValue: confirm },
        { provide: ToastService, useValue: toast },
        { provide: TranslocoService, useValue: { translate: (k: string) => k } },
      ],
    });
    facade = TestBed.inject(CalendarSyncFacade);
  });

  it('carga las fuentes de la unidad', () => {
    facade.load(7);
    expect(service.listSyncSources).toHaveBeenCalledWith(7);
    expect(facade.sources()).toHaveLength(1);
  });

  it('no envía con el formulario inválido', () => {
    facade.load(7);
    facade.submit();
    expect(service.createSyncSource).not.toHaveBeenCalled();
  });

  it('crea una fuente válida y recarga', () => {
    facade.load(7);
    facade.form.setValue({ name: 'Otro', url: 'https://y/c.ics' });
    service.listSyncSources.mockClear();

    facade.submit();

    expect(service.createSyncSource).toHaveBeenCalledWith(7, {
      name: 'Otro',
      url: 'https://y/c.ics',
    });
    expect(service.listSyncSources).toHaveBeenCalledTimes(1);
  });

  it('sincroniza una fuente y recarga', () => {
    facade.load(7);
    service.listSyncSources.mockClear();
    facade.syncNow(makeSource({ id: 5 }));
    expect(service.syncSourceNow).toHaveBeenCalledWith(7, 5);
    expect(service.listSyncSources).toHaveBeenCalledTimes(1);
  });

  it('elimina una fuente tras confirmar', async () => {
    facade.load(7);
    await facade.remove(makeSource({ id: 9 }));
    expect(confirm.confirm).toHaveBeenCalled();
    expect(service.deleteSyncSource).toHaveBeenCalledWith(7, 9);
  });
});
