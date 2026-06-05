import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
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
import { FileDownloadService } from '../../core/services/file-download.service';
import { FormatService } from '../../core/services/format.service';
import { TenantUserService } from '../../core/services/tenant/tenant-user.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { PaymentsFacade } from './payments.facade';

describe('PaymentsFacade', () => {
  let facade: PaymentsFacade;
  let loadPayments: ReturnType<typeof vi.fn>;
  let paymentService: {
    payments: typeof payments;
    stats: ReturnType<typeof signal<null>>;
    isLoading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<null>>;
    loadPayments: ReturnType<typeof vi.fn>;
    loadStats: ReturnType<typeof vi.fn>;
    bulkAction: ReturnType<typeof vi.fn>;
    exportCsv: ReturnType<typeof vi.fn>;
    getProofUrl: ReturnType<typeof vi.fn>;
    downloadProof: ReturnType<typeof vi.fn>;
    updatePaymentStatus: ReturnType<typeof vi.fn>;
    deletePayment: ReturnType<typeof vi.fn>;
    createPaymentAsAdmin: ReturnType<typeof vi.fn>;
  };
  let confirmDialog: {
    confirm: ReturnType<typeof vi.fn>;
    open: ReturnType<typeof vi.fn>;
  };
  let toast: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };
  let fileDownload: {
    downloadBlob: ReturnType<typeof vi.fn>;
  };
  const payments = signal<Payment[]>([]);

  beforeEach(() => {
    loadPayments = vi.fn();
    paymentService = {
      payments,
      stats: signal(null),
      isLoading: signal(false),
      error: signal(null),
      loadPayments,
      loadStats: vi.fn(),
      bulkAction: vi.fn(() => of({ processed: 1, errors: 0 })),
      exportCsv: vi.fn(() => of(new Blob())),
      getProofUrl: vi.fn(() => null),
      downloadProof: vi.fn(() => of(new Blob(['proof'], { type: 'application/pdf' }))),
      updatePaymentStatus: vi.fn(() => of({})),
      deletePayment: vi.fn(() => of({})),
      createPaymentAsAdmin: vi.fn(() => of({})),
    };
    confirmDialog = {
      confirm: vi.fn(() => Promise.resolve(true)),
      open: vi.fn(() => Promise.resolve({ confirmed: true, value: 'ok' })),
    };
    toast = {
      success: vi.fn(),
      error: vi.fn(),
    };
    fileDownload = {
      downloadBlob: vi.fn(),
    };
    payments.set([
      makePayment({ id: 1, status: PaymentStatus.PENDING }),
      makePayment({ id: 2, status: PaymentStatus.APPROVED }),
    ]);

    TestBed.configureTestingModule({
      providers: [
        PaymentsFacade,
        {
          provide: PaymentService,
          useValue: paymentService,
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
          useValue: confirmDialog,
        },
        {
          provide: ToastService,
          useValue: toast,
        },
        {
          provide: FileDownloadService,
          useValue: fileDownload,
        },
        {
          provide: TranslocoService,
          useValue: {
            translate: (key: string, params?: { tenantName?: string }) =>
              params?.tenantName ? `${key}:${params.tenantName}` : key,
          },
        },
      ],
    });

    facade = TestBed.inject(PaymentsFacade);
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

  it('aprueba un pago pendiente y muestra feedback', () => {
    const payment = payments()[0];

    facade.approvePayment(payment);

    expect(paymentService.updatePaymentStatus).toHaveBeenCalledWith(1, {
      status: PaymentStatus.APPROVED,
      admin_notes: 'pagos.actions.approvedByAdmin',
    });
    expect(toast.success).toHaveBeenCalledWith('pagos.actions.approvedToast:Inquilino #1');
  });

  it('rechaza un pago con motivo obligatorio', () => {
    const payment = payments()[0];
    facade.rejectPayment(payment);
    facade.rejectForm.controls.reason.setValue('Comprobante ilegible');

    facade.submitRejectPayment();

    expect(paymentService.updatePaymentStatus).toHaveBeenCalledWith(1, {
      status: PaymentStatus.REJECTED,
      admin_notes: 'Comprobante ilegible',
      rejection_reason: 'Comprobante ilegible',
    });
    expect(facade.rejectionPayment()).toBeNull();
    expect(toast.error).toHaveBeenCalledWith('pagos.actions.rejectedToast:Inquilino #1');
  });

  it('no rechaza si el motivo no fue informado', () => {
    facade.rejectPayment(payments()[0]);
    facade.rejectForm.controls.reason.setValue('');

    facade.submitRejectPayment();

    expect(paymentService.updatePaymentStatus).not.toHaveBeenCalled();
    expect(facade.rejectForm.controls.reason.touched).toBe(true);
  });

  it('ejecuta accion masiva de aprobar despues de confirmar', async () => {
    facade.selectedIds.set([1]);

    await facade.executeBulkAction('approve');

    expect(confirmDialog.confirm).toHaveBeenCalled();
    expect(paymentService.bulkAction).toHaveBeenCalledWith({
      ids: [1],
      action: 'approve',
      admin_notes: undefined,
    });
    expect(facade.selectedIds()).toEqual([]);
    expect(toast.success).toHaveBeenCalled();
  });

  it('ejecuta accion masiva de rechazar con motivo', async () => {
    facade.selectedIds.set([1]);

    await facade.executeBulkAction('reject');

    expect(confirmDialog.open).toHaveBeenCalled();
    expect(paymentService.bulkAction).toHaveBeenCalledWith({
      ids: [1],
      action: 'reject',
      admin_notes: 'ok',
    });
  });

  it('no ejecuta accion masiva si el usuario cancela', async () => {
    confirmDialog.confirm.mockResolvedValue(false);
    facade.selectedIds.set([1]);

    await facade.executeBulkAction('delete');

    expect(paymentService.bulkAction).not.toHaveBeenCalled();
  });

  it('exporta CSV con los filtros activos', () => {
    facade.activeFilters.set({ status: PaymentStatus.PENDING });

    facade.exportCsv();

    expect(paymentService.exportCsv).toHaveBeenCalledWith({ status: PaymentStatus.PENDING });
    expect(fileDownload.downloadBlob).toHaveBeenCalledWith(
      expect.any(Blob),
      expect.stringMatching(/^pagos_.*\.csv$/),
    );
  });

  it('carga comprobante como URL temporal y permite cerrar el visor', () => {
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:proof');
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    paymentService.getProofUrl.mockReturnValue('/proof.pdf');

    facade.openProof({ ...payments()[0], proof_file: 'proof.pdf' });

    expect(paymentService.downloadProof).toHaveBeenCalled();
    expect(createObjectUrl).toHaveBeenCalled();
    expect(facade.proofObjectUrl()).toBe('blob:proof');
    expect(facade.proofLoading()).toBe(false);
    expect(facade.isProofPdf({ ...payments()[0], proof_file: 'proof.pdf' })).toBe(true);

    facade.closeProof();

    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:proof');
    expect(facade.selectedProofPayment()).toBeNull();
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
