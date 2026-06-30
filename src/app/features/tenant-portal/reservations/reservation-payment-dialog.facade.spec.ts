import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MyReservation, ReservationService } from '../../../core/services/reservation.service';
import { TenantPaymentService } from '../../../core/services/tenant/tenant-payment.service';
import { TenantQrPaymentService } from '../../../core/services/tenant/tenant-qr-payment.service';
import { TenantPaymentQrFlowFacade } from '../payments/tenant-payment-qr-flow.facade';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { ReservationPaymentDialogFacade } from './reservation-payment-dialog.facade';

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
    paid_amount: '120.00',
    has_review: false,
    deposit_required: null,
    expires_at: null,
    ...overrides,
  };
}

describe('ReservationPaymentDialogFacade', () => {
  let reservationService: {
    createReservationPayment: ReturnType<typeof vi.fn>;
  };
  let paymentService: { getAvailablePaymentMethods: ReturnType<typeof vi.fn> };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let qrFlow: {
    safeUrl: ReturnType<typeof signal>;
    polling: ReturnType<typeof signal>;
    cancelling: ReturnType<typeof signal>;
    error: ReturnType<typeof signal>;
    clearActiveQr: ReturnType<typeof vi.fn>;
    generate: ReturnType<typeof vi.fn>;
    verifyActive: ReturnType<typeof vi.fn>;
    downloadActive: ReturnType<typeof vi.fn>;
    cancelActive: ReturnType<typeof vi.fn>;
  };
  let qrService: { activeQr: ReturnType<typeof signal>; isLoading: ReturnType<typeof signal> };
  let facade: ReservationPaymentDialogFacade;

  beforeEach(() => {
    reservationService = {
      createReservationPayment: vi.fn(() => of({ id: 99 })),
    };
    paymentService = {
      getAvailablePaymentMethods: vi.fn(() => of([{ method: 'TRANSFER', label: 'Transferencia' }])),
    };
    toast = { success: vi.fn(), error: vi.fn() };
    qrFlow = {
      safeUrl: signal(null),
      polling: signal(false),
      cancelling: signal(false),
      error: signal(null),
      clearActiveQr: vi.fn(),
      generate: vi.fn(),
      verifyActive: vi.fn(),
      downloadActive: vi.fn(),
      cancelActive: vi.fn(),
    };
    qrService = { activeQr: signal(null), isLoading: signal(false) };

    TestBed.configureTestingModule({
      providers: [
        ReservationPaymentDialogFacade,
        { provide: ReservationService, useValue: reservationService },
        { provide: TenantPaymentService, useValue: paymentService },
        { provide: TenantPaymentQrFlowFacade, useValue: qrFlow },
        { provide: TenantQrPaymentService, useValue: qrService },
        { provide: ToastService, useValue: toast },
        { provide: TranslocoService, useValue: { translate: (k: string) => k } },
      ],
    });
    facade = TestBed.inject(ReservationPaymentDialogFacade);
  });

  it('carga los métodos de pago al iniciar', () => {
    expect(facade.methodOptions()).toEqual([{ value: 'TRANSFER', label: 'Transferencia' }]);
  });

  it('calcula el saldo pendiente', () => {
    expect(facade.outstanding(makeReservation())).toBe(300);
  });

  it('precarga el formulario con saldo, fecha de hoy y primer método', () => {
    facade.prefill(makeReservation());
    const value = facade.form.getRawValue();
    expect(value.amount).toBe(300);
    expect(value.payment_method).toBe('TRANSFER');
    expect(value.payment_date).toBe(new Date().toISOString().slice(0, 10));
  });

  it('no envía si el formulario es inválido', () => {
    const onSuccess = vi.fn();
    facade.submit(makeReservation(), onSuccess); // form vacío

    expect(reservationService.createReservationPayment).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('envía el pago válido y dispara onSuccess', () => {
    const reservation = makeReservation({ id: 5 });
    facade.prefill(reservation);
    const onSuccess = vi.fn();

    facade.submit(reservation, onSuccess);

    expect(reservationService.createReservationPayment).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ amount: 300, payment_method: 'TRANSFER' }),
    );
    expect(toast.success).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('detecta el método QR y genera el QR ligado a la reserva', () => {
    const reservation = makeReservation({ id: 8, currency: 'BOB' });
    paymentService.getAvailablePaymentMethods.mockReturnValue(
      of([{ method: 'qr_accl', label: 'QR MC4 (Bolivia)' }]),
    );
    facade.loadMethods();
    facade.prefill(reservation);

    expect(facade.isQrMethod()).toBe(true);

    facade.generateQr(reservation);
    expect(qrFlow.generate).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 300, reservationId: 8, currency: 'BOB' }),
    );
  });

  it('expone qrPaid cuando el QR activo está pagado', () => {
    expect(facade.qrPaid()).toBe(false);
    qrService.activeQr.set({ status: 'PAGADO' });
    expect(facade.qrPaid()).toBe(true);
  });
});
