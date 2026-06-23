import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ReservationAdminService } from '../../../core/services/admin/reservation-admin.service';
import { SeasonRule } from '../../../core/models/reservation-admin.model';
import { ConfirmDialogService } from '../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { SeasonRulesFacade } from './season-rules.facade';

function makeSeason(overrides?: Partial<SeasonRule>): SeasonRule {
  return {
    id: 1,
    unit_id: 7,
    name: 'Alta',
    start_date: '2026-12-20',
    end_date: '2026-12-31',
    price_per_night: 150,
    min_nights: 3,
    ...overrides,
  };
}

describe('SeasonRulesFacade', () => {
  let service: {
    listSeasons: ReturnType<typeof vi.fn>;
    createSeason: ReturnType<typeof vi.fn>;
    deleteSeason: ReturnType<typeof vi.fn>;
  };
  let confirm: { confirm: ReturnType<typeof vi.fn> };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let facade: SeasonRulesFacade;

  beforeEach(() => {
    service = {
      listSeasons: vi.fn(() => of([makeSeason()])),
      createSeason: vi.fn(() => of(makeSeason({ id: 2 }))),
      deleteSeason: vi.fn(() => of(undefined)),
    };
    confirm = { confirm: vi.fn(() => Promise.resolve(true)) };
    toast = { success: vi.fn(), error: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        SeasonRulesFacade,
        { provide: ReservationAdminService, useValue: service },
        { provide: ConfirmDialogService, useValue: confirm },
        { provide: ToastService, useValue: toast },
        { provide: TranslocoService, useValue: { translate: (k: string) => k } },
      ],
    });
    facade = TestBed.inject(SeasonRulesFacade);
  });

  it('carga las temporadas de la unidad', () => {
    facade.load(7);
    expect(service.listSeasons).toHaveBeenCalledWith(7);
    expect(facade.seasons()).toHaveLength(1);
  });

  it('no envía con el formulario inválido', () => {
    facade.load(7);
    facade.submit(); // form vacío → inválido
    expect(service.createSeason).not.toHaveBeenCalled();
  });

  it('crea una temporada válida y recarga', () => {
    facade.load(7);
    facade.form.setValue({
      name: 'Navidad',
      start_date: '2026-12-20',
      end_date: '2026-12-31',
      price_per_night: 150,
      min_nights: 3,
    });
    service.listSeasons.mockClear();

    facade.submit();

    expect(service.createSeason).toHaveBeenCalledWith(7, {
      name: 'Navidad',
      start_date: '2026-12-20',
      end_date: '2026-12-31',
      price_per_night: 150,
      min_nights: 3,
    });
    expect(service.listSeasons).toHaveBeenCalledTimes(1);
  });

  it('elimina una temporada tras confirmar', async () => {
    facade.load(7);
    await facade.delete(makeSeason({ id: 5 }));
    expect(confirm.confirm).toHaveBeenCalled();
    expect(service.deleteSeason).toHaveBeenCalledWith(7, 5);
  });
});
