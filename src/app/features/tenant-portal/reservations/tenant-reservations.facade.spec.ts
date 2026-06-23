import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MyReservation, ReservationService } from '../../../core/services/reservation.service';
import { ConfirmDialogService } from '../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { TenantReservationsFacade } from './tenant-reservations.facade';

function makeReservation(overrides?: Partial<MyReservation>): MyReservation {
  return {
    id: 1,
    property_id: 10,
    unit_id: 7,
    property_name: 'Casa',
    unit_number: 'A1',
    checkin_date: '2999-06-10',
    checkout_date: '2999-06-15',
    nights: 5,
    price_per_night: '80.00',
    cleaning_fee: '20.00',
    total_amount: '420.00',
    currency: 'BOB',
    status: 'confirmed',
    notes: null,
    created_at: '2026-05-01',
    paid_amount: '0.00',
    has_review: false,
    deposit_required: null,
    ...overrides,
  };
}

describe('TenantReservationsFacade', () => {
  let service: {
    getMyReservations: ReturnType<typeof vi.fn>;
    cancelReservation: ReturnType<typeof vi.fn>;
    getCancellationPreview: ReturnType<typeof vi.fn>;
  };
  let confirm: { confirm: ReturnType<typeof vi.fn> };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let facade: TenantReservationsFacade;

  function build(reservations: MyReservation[]): void {
    service = {
      getMyReservations: vi.fn(() => of(reservations)),
      cancelReservation: vi.fn(() => of(makeReservation({ status: 'cancelled' }))),
      getCancellationPreview: vi.fn(() =>
        of({
          refund_percentage: 100,
          refund_amount: 300,
          currency: 'BOB',
          reason: 'full_refund',
        }),
      ),
    };
    confirm = { confirm: vi.fn(() => Promise.resolve(true)) };
    toast = { success: vi.fn(), error: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        TenantReservationsFacade,
        { provide: ReservationService, useValue: service },
        { provide: ConfirmDialogService, useValue: confirm },
        { provide: ToastService, useValue: toast },
        { provide: TranslocoService, useValue: { translate: (key: string) => key } },
      ],
    });
    facade = TestBed.inject(TenantReservationsFacade);
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('carga las reservas al iniciar', () => {
    build([makeReservation()]);
    expect(facade.reservations()).toHaveLength(1);
    expect(facade.isLoading()).toBe(false);
  });

  it('separa próximas e historial', () => {
    build([
      makeReservation({ id: 1, status: 'confirmed', checkout_date: '2999-06-15' }),
      makeReservation({ id: 2, status: 'completed', checkout_date: '2020-01-10' }),
    ]);
    expect(facade.upcoming().map((r) => r.id)).toEqual([1]);
    expect(facade.past().map((r) => r.id)).toEqual([2]);
  });

  it('permite cancelar solo estados pending/confirmed', () => {
    build([makeReservation()]);
    expect(facade.canCancel(makeReservation({ status: 'pending' }))).toBe(true);
    expect(facade.canCancel(makeReservation({ status: 'confirmed' }))).toBe(true);
    expect(facade.canCancel(makeReservation({ status: 'completed' }))).toBe(false);
    expect(facade.canCancel(makeReservation({ status: 'cancelled' }))).toBe(false);
  });

  it('pide confirmación y cancela la reserva', async () => {
    build([makeReservation()]);
    await facade.cancel(makeReservation({ id: 5 }));

    expect(confirm.confirm).toHaveBeenCalled();
    expect(service.cancelReservation).toHaveBeenCalledWith(5);
    expect(toast.success).toHaveBeenCalled();
  });

  it('no cancela si el usuario rechaza la confirmación', async () => {
    build([makeReservation()]);
    confirm.confirm.mockResolvedValueOnce(false);

    await facade.cancel(makeReservation({ id: 5 }));

    expect(service.cancelReservation).not.toHaveBeenCalled();
  });

  it('mapea el tono del estado', () => {
    build([makeReservation()]);
    expect(facade.statusTone('pending')).toBe('warning');
    expect(facade.statusTone('completed')).toBe('success');
    expect(facade.statusTone('cancelled')).toBe('danger');
  });

  it('calcula el saldo pendiente (total − pagado)', () => {
    build([makeReservation()]);
    const r = makeReservation({ total_amount: '420.00', paid_amount: '120.00' });
    expect(facade.outstanding(r)).toBe(300);
  });

  it('canPay sólo si está activa y queda saldo', () => {
    build([makeReservation()]);
    expect(facade.canPay(makeReservation({ status: 'confirmed', paid_amount: '0' }))).toBe(true);
    expect(facade.canPay(makeReservation({ status: 'in_progress', paid_amount: '0' }))).toBe(true);
    // saldo cubierto → no se puede pagar
    expect(
      facade.canPay(
        makeReservation({ status: 'confirmed', total_amount: '420', paid_amount: '420' }),
      ),
    ).toBe(false);
    // estado terminal → no se puede pagar
    expect(facade.canPay(makeReservation({ status: 'completed', paid_amount: '0' }))).toBe(false);
  });

  it('canReview sólo si está completada y sin reseña', () => {
    build([makeReservation()]);
    expect(facade.canReview(makeReservation({ status: 'completed', has_review: false }))).toBe(
      true,
    );
    expect(facade.canReview(makeReservation({ status: 'completed', has_review: true }))).toBe(
      false,
    );
    expect(facade.canReview(makeReservation({ status: 'confirmed', has_review: false }))).toBe(
      false,
    );
  });

  it('onReviewed cierra el diálogo y recarga', () => {
    build([makeReservation()]);
    facade.openReview(makeReservation({ id: 8 }));
    expect(facade.reviewTarget()?.id).toBe(8);

    service.getMyReservations.mockClear();
    facade.onReviewed();

    expect(facade.reviewTarget()).toBeNull();
    expect(service.getMyReservations).toHaveBeenCalledTimes(1);
  });

  it('onPaid cierra el diálogo y recarga', () => {
    build([makeReservation()]);
    facade.openPayment(makeReservation({ id: 7 }));
    expect(facade.paymentTarget()?.id).toBe(7);

    service.getMyReservations.mockClear();
    facade.onPaid();

    expect(facade.paymentTarget()).toBeNull();
    expect(service.getMyReservations).toHaveBeenCalledTimes(1);
  });
});
