import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  Currency,
  Payment,
  PaymentMethod,
  PaymentProcessor,
  PaymentStatus,
  PaymentType,
} from '../../core/models/payment.model';
import { ContractService } from '../../core/services/admin/contract.service';
import { PaymentService } from '../../core/services/admin/payment.service';
import { FormatService } from '../../core/services/format.service';
import { TenantUserService } from '../../core/services/tenant/tenant-user.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { PagosFacade } from './pagos.facade';

describe('PagosFacade', () => {
  let facade: PagosFacade;
  let loadPayments: ReturnType<typeof vi.fn>;
  const payments = signal<Payment[]>([]);

  beforeEach(() => {
    loadPayments = vi.fn();
    payments.set([
      makePayment({ id: 1, status: PaymentStatus.PENDING }),
      makePayment({ id: 2, status: PaymentStatus.APPROVED }),
    ]);

    TestBed.configureTestingModule({
      providers: [
        PagosFacade,
        {
          provide: PaymentService,
          useValue: {
            payments,
            stats: signal(null),
            isLoading: signal(false),
            error: signal(null),
            loadPayments,
            loadStats: vi.fn(),
            bulkAction: vi.fn(() => of({ processed: 1, errors: 0 })),
            exportCsv: vi.fn(() => of(new Blob())),
            getProofUrl: vi.fn(() => null),
            downloadProof: vi.fn(() => of(new Blob())),
            updatePaymentStatus: vi.fn(() => of({})),
            deletePayment: vi.fn(() => of({})),
            createPaymentAsAdmin: vi.fn(() => of({})),
          },
        },
        {
          provide: TenantUserService,
          useValue: {
            users: signal([]),
            loadAllUsers: vi.fn(),
          },
        },
        {
          provide: ContractService,
          useValue: {
            getContractsByTenantId: vi.fn(() => of([])),
            formatContractDisplay: vi.fn(() => 'Contrato test'),
          },
        },
        {
          provide: FormatService,
          useValue: {
            formatCurrency: (amount: number, currency?: Currency) =>
              `${currency ?? 'BOB'} ${amount}`,
          },
        },
        {
          provide: ConfirmDialogService,
          useValue: {
            confirm: vi.fn(() => Promise.resolve(true)),
            open: vi.fn(() => Promise.resolve({ confirmed: true, value: 'ok' })),
          },
        },
        {
          provide: ToastService,
          useValue: {
            success: vi.fn(),
            error: vi.fn(),
          },
        },
      ],
    });

    facade = TestBed.inject(PagosFacade);
    loadPayments.mockClear();
  });

  it('aplica filtros normalizados al servicio y limpia seleccion', () => {
    facade.selectedIds.set([1]);
    facade.filterForm.patchValue({
      status: PaymentStatus.PENDING,
      type: PaymentType.RENT,
      method: PaymentMethod.TRANSFER,
      currency: Currency.BOB,
      date_from: new Date(2026, 0, 1),
      date_to: new Date(2026, 0, 31),
    });

    facade.applyFilters();

    expect(facade.selectedIds()).toEqual([]);
    expect(loadPayments).toHaveBeenCalledWith({
      status: PaymentStatus.PENDING,
      type: PaymentType.RENT,
      method: PaymentMethod.TRANSFER,
      currency: Currency.BOB,
      date_from: '2026-01-01',
      date_to: '2026-01-31',
    });
  });

  it('solo permite seleccionar pagos pendientes', () => {
    facade.toggleSelection(payments()[0]);
    facade.toggleSelection(payments()[1]);

    expect(facade.selectedIds()).toEqual([1]);
    expect(facade.pendingPaymentIds()).toEqual([1]);
  });

  it('limpia filtros y recarga pagos sin parametros', () => {
    facade.activeFilters.set({ status: PaymentStatus.PENDING });
    facade.selectedIds.set([1]);

    facade.clearFilters();

    expect(facade.activeFilters()).toEqual({});
    expect(facade.selectedIds()).toEqual([]);
    expect(loadPayments).toHaveBeenCalledWith();
  });
});

function makePayment(overrides: { id: number; status: PaymentStatus }): Payment {
  return {
    id: overrides.id,
    tenant_id: 1,
    contract_id: 1,
    property_id: 1,
    amount: 1000,
    currency: Currency.BOB,
    payment_type: PaymentType.RENT,
    payment_method: PaymentMethod.TRANSFER,
    status: overrides.status,
    payment_date: new Date(2026, 0, 1),
    payment_processor: PaymentProcessor.MANUAL,
    is_partial_payment: false,
    is_recurring: false,
    is_autopay: false,
    created_at: new Date(2026, 0, 1),
    updated_at: new Date(2026, 0, 1),
  };
}
