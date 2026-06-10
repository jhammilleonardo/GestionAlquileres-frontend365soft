import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';

import { getApiErrorMessage } from '../../core/http/http-error.util';
import {
  BulkPaymentActionDto,
  Currency,
  CurrencyLabels,
  CurrencySymbols,
  Payment,
  PaymentFilters,
  PaymentMethod,
  PaymentMethodLabels,
  PaymentStatus,
  PaymentStatusColors,
  PaymentStatusLabels,
  PaymentType,
  PaymentTypeLabels,
} from '../../core/models/payment.model';
import { AdminTenantUser } from '../../core/models/tenant-user.model';
import { Contract } from '../../core/services/admin/contract.service';
import { PaymentService } from '../../core/services/admin/payment.service';
import { FileDownloadService } from '../../core/services/file-download.service';
import { FormatService } from '../../core/services/format.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { AppSelectOption } from '../../shared/ui/select/select.component';
import { AppStatusTone } from '../../shared/ui/status-badge/status-badge.component';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { PaymentAdminCreateFacade } from './payment-admin-create.facade';
import { PaymentProofViewerFacade } from './payment-proof-viewer.facade';

export class PaymentsFacade {
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly fileDownload = inject(FileDownloadService);
  private readonly adminCreate = inject(PaymentAdminCreateFacade);
  private readonly proofViewer = inject(PaymentProofViewerFacade);
  readonly paymentService = inject(PaymentService);
  private readonly formatService = inject(FormatService);
  private readonly transloco = inject(TranslocoService);

  readonly showFilters = signal(false);
  readonly showCreateForm = this.adminCreate.showCreateForm;
  readonly selectedPayment = signal<Payment | null>(null);
  readonly rejectionPayment = signal<Payment | null>(null);
  readonly selectedProofPayment = this.proofViewer.selectedProofPayment;
  readonly proofObjectUrl = this.proofViewer.proofObjectUrl;
  readonly proofMimeType = this.proofViewer.proofMimeType;
  readonly proofLoadError = this.proofViewer.proofLoadError;
  readonly proofLoading = this.proofViewer.proofLoading;
  readonly proofZoom = this.proofViewer.proofZoom;

  readonly selectedIds = signal<number[]>([]);
  readonly activeFilters = signal<PaymentFilters>({});

  readonly pendingPaymentIds = computed(() =>
    this.paymentService
      .payments()
      .filter((p) => p.status === PaymentStatus.PENDING)
      .map((p) => p.id),
  );

  readonly pendingPayments = computed(() =>
    this.paymentService.payments().filter((p) => p.status === PaymentStatus.PENDING),
  );

  readonly pendingFilters = signal<{ propertyId?: number; dateFrom?: Date; dateTo?: Date }>({});

  readonly pendingPropertyOptions = computed(() => {
    const options = new Map<number, string>();
    this.pendingPayments().forEach((payment) => {
      options.set(payment.property_id, this.getPropertyName(payment));
    });

    return [...options.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  readonly filteredPendingPayments = computed(() => {
    const filters = this.pendingFilters();
    return this.pendingPayments().filter((payment) => {
      if (filters.propertyId && payment.property_id !== filters.propertyId) return false;

      const registeredAt = this.getRegisteredDate(payment);
      if (filters.dateFrom && registeredAt < this.startOfDay(filters.dateFrom)) return false;
      if (filters.dateTo && registeredAt > this.endOfDay(filters.dateTo)) return false;

      return true;
    });
  });

  readonly tenantSearchControl = this.adminCreate.tenantSearchControl;
  readonly filteredTenants$ = this.adminCreate.filteredTenants$;
  readonly selectedTenant = this.adminCreate.selectedTenant;
  readonly availableContracts = this.adminCreate.availableContracts;
  readonly selectedContract = this.adminCreate.selectedContract;
  readonly loadingContracts = this.adminCreate.loadingContracts;

  readonly PaymentStatus = PaymentStatus;
  readonly PaymentType = PaymentType;
  readonly PaymentMethod = PaymentMethod;
  readonly Currency = Currency;
  readonly PaymentStatusLabels = PaymentStatusLabels;
  readonly PaymentTypeLabels = PaymentTypeLabels;
  readonly PaymentMethodLabels = PaymentMethodLabels;
  readonly CurrencyLabels = CurrencyLabels;
  readonly CurrencySymbols = CurrencySymbols;
  readonly PaymentStatusColors = PaymentStatusColors;

  readonly statusOptions: AppSelectOption[] = Object.values(PaymentStatus).map((v) => ({
    value: v,
    label: PaymentStatusLabels[v] ?? v,
  }));
  readonly typeOptions: AppSelectOption[] = Object.values(PaymentType).map((v) => ({
    value: v,
    label: PaymentTypeLabels[v] ?? v,
  }));
  readonly methodOptions: AppSelectOption[] = Object.values(PaymentMethod).map((v) => ({
    value: v,
    label: PaymentMethodLabels[v] ?? v,
  }));
  readonly currencyOptions: AppSelectOption[] = Object.values(Currency).map((v) => ({
    value: v,
    label: `${CurrencySymbols[v] ?? ''} ${CurrencyLabels[v] ?? v}`,
  }));

  readonly pendingPropertySelectOptions = computed<AppSelectOption<number>[]>(() =>
    this.pendingPropertyOptions().map((o) => ({ value: o.id, label: o.name })),
  );

  readonly displayedColumns: string[] = [
    'select',
    'id',
    'tenant',
    'property',
    'amount',
    'currency',
    'type',
    'method',
    'payment_date',
    'status',
    'actions',
  ];

  readonly filterForm = this.fb.group({
    status: [''],
    type: [''],
    method: [''],
    currency: [''],
    date_from: [null as Date | null],
    date_to: [null as Date | null],
  });

  readonly pendingFilterForm = this.fb.group({
    property_id: [null as number | null],
    date_from: [null as Date | null],
    date_to: [null as Date | null],
  });

  readonly rejectForm = this.fb.group({
    reason: ['', [Validators.required, Validators.maxLength(400)]],
  });

  readonly createPaymentForm = this.adminCreate.createPaymentForm;
  readonly selectedPaymentMethod = this.adminCreate.selectedPaymentMethod;

  readonly paymentStatuses = Object.values(PaymentStatus);
  readonly paymentTypes = Object.values(PaymentType);
  readonly paymentMethods = Object.values(PaymentMethod);
  readonly currencies = Object.values(Currency);

  readonly totalAmount = computed(() =>
    this.paymentService.payments().reduce((sum, p) => sum + p.amount, 0),
  );

  constructor() {
    this.loadData();
  }

  getStatusTone(status: PaymentStatus): AppStatusTone {
    const map: Record<string, AppStatusTone> = {
      PENDING: 'warning',
      APPROVED: 'success',
      REJECTED: 'danger',
      CANCELLED: 'neutral',
    };
    return map[status] ?? 'neutral';
  }

  loadData(): void {
    this.paymentService.loadPayments();
    this.paymentService.loadStats();
    this.adminCreate.loadTenants();
  }

  applyFilters(): void {
    const formValue = this.filterForm.value;
    const filters: PaymentFilters = {};

    if (formValue.status) filters.status = formValue.status as PaymentStatus;
    if (formValue.type) filters.type = formValue.type as PaymentType;
    if (formValue.method) filters.method = formValue.method as PaymentMethod;
    if (formValue.currency) filters.currency = formValue.currency as Currency;
    if (formValue.date_from) filters.date_from = this.formatDate(formValue.date_from);
    if (formValue.date_to) filters.date_to = this.formatDate(formValue.date_to);

    this.activeFilters.set(filters);
    this.selectedIds.set([]);
    this.paymentService.loadPayments(filters);
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.activeFilters.set({});
    this.selectedIds.set([]);
    this.paymentService.loadPayments();
  }

  applyPendingFilters(): void {
    const formValue = this.pendingFilterForm.value;
    this.pendingFilters.set({
      propertyId: formValue.property_id ?? undefined,
      dateFrom: formValue.date_from ?? undefined,
      dateTo: formValue.date_to ?? undefined,
    });
  }

  clearPendingFilters(): void {
    this.pendingFilterForm.reset();
    this.pendingFilters.set({});
  }

  isSelected(id: number): boolean {
    return this.selectedIds().includes(id);
  }

  toggleSelection(payment: Payment): void {
    if (payment.status !== PaymentStatus.PENDING) return;
    const current = this.selectedIds();
    if (current.includes(payment.id)) {
      this.selectedIds.set(current.filter((i) => i !== payment.id));
    } else {
      this.selectedIds.set([...current, payment.id]);
    }
  }

  selectAll(): void {
    this.selectedIds.set(this.pendingPaymentIds());
  }

  clearSelection(): void {
    this.selectedIds.set([]);
  }

  get hasPendingPayments(): boolean {
    return this.paymentService.payments().some((p) => p.status === PaymentStatus.PENDING);
  }

  async executeBulkAction(action: 'approve' | 'reject' | 'delete'): Promise<void> {
    const ids = this.selectedIds();
    if (ids.length === 0) return;

    const labels: Record<string, string> = {
      approve: this.transloco.translate('pagos.actions.approve'),
      reject: this.transloco.translate('pagos.actions.reject'),
      delete: this.transloco.translate('common.delete'),
    };
    const verb = labels[action];
    let adminNotes: string | undefined;

    if (action === 'reject') {
      const result = await this.confirmDialog.open({
        title: this.transloco.translate('pagos.bulk.title', { action: verb, count: ids.length }),
        message: this.transloco.translate('pagos.bulk.message', {
          action: verb,
          count: ids.length,
        }),
        confirmLabel: verb,
        variant: 'danger',
        input: {
          label: this.transloco.translate('pagos.bulk.rejectReasonLabel'),
          placeholder: this.transloco.translate('pagos.bulk.rejectReasonPlaceholder'),
        },
      });
      if (!result.confirmed) return;
      adminNotes = result.value || this.transloco.translate('pagos.bulk.defaultRejectReason');
    } else {
      const confirmed = await this.confirmDialog.confirm({
        title: this.transloco.translate('pagos.bulk.title', { action: verb, count: ids.length }),
        message: this.transloco.translate('pagos.bulk.message', {
          action: verb,
          count: ids.length,
        }),
        confirmLabel: verb,
        variant: action === 'delete' ? 'danger' : 'default',
      });
      if (!confirmed) return;
    }

    const payload: BulkPaymentActionDto = { ids, action, admin_notes: adminNotes };
    this.paymentService.bulkAction(payload).subscribe({
      next: (result) => {
        this.selectedIds.set([]);
        this.toast.success(this.transloco.translate('pagos.bulk.completed', result));
      },
      error: (error: unknown) => {
        this.toast.error(
          this.transloco.translate('pagos.bulk.error', {
            message: getApiErrorMessage(error, this.transloco.translate('common.serverError')),
          }),
        );
      },
    });
  }

  exportCsv(): void {
    const filters = this.activeFilters();
    this.paymentService.exportCsv(filters).subscribe({
      next: (blob) => {
        this.fileDownload.downloadBlob(blob, `pagos_${new Date().toISOString().split('T')[0]}.csv`);
      },
      error: (error: HttpErrorResponse) => {
        let msg = `Error ${error.status || ''}: `;
        const body: unknown = error.error;
        if (body instanceof Blob) {
          void body.text().then((text) => {
            try {
              const json = JSON.parse(text) as { message?: string };
              msg += json.message || text;
            } catch {
              msg += this.transloco.translate('common.serverError');
            }
            this.toast.error(this.transloco.translate('pagos.actions.exportCsvError', { msg }));
          });
        } else {
          msg += getApiErrorMessage(error, this.transloco.translate('common.unknownError'));
          this.toast.error(this.transloco.translate('pagos.actions.exportCsvError', { msg }));
        }
      },
    });
  }

  getProofUrl(payment: Payment): string | null {
    return this.proofViewer.getProofUrl(payment);
  }

  openProof(payment: Payment): void {
    this.proofViewer.openProof(payment);
  }

  closeProof(): void {
    this.proofViewer.closeProof();
  }

  isProofPdf(payment: Payment): boolean {
    return this.proofViewer.isProofPdf(payment);
  }

  zoomInProof(): void {
    this.proofViewer.zoomInProof();
  }

  zoomOutProof(): void {
    this.proofViewer.zoomOutProof();
  }

  resetProofZoom(): void {
    this.proofViewer.resetProofZoom();
  }

  canZoomInProof(): boolean {
    return this.proofViewer.canZoomInProof();
  }

  canZoomOutProof(): boolean {
    return this.proofViewer.canZoomOutProof();
  }

  viewPaymentDetail(payment: Payment): void {
    this.selectedPayment.set(payment);
  }

  approvePayment(payment: Payment): void {
    const tenantName = this.getTenantName(payment);
    this.paymentService
      .approvePayment(payment.id, this.transloco.translate('pagos.actions.approvedByAdmin'))
      .subscribe({
        next: () => {
          this.rejectionPayment.set(null);
          this.toast.success(
            this.transloco.translate('pagos.actions.approvedToast', { tenantName }),
          );
        },
        error: (error: unknown) => {
          this.toast.error(
            this.transloco.translate('pagos.actions.approveError', {
              message: getApiErrorMessage(error, this.transloco.translate('common.serverError')),
            }),
          );
        },
      });
  }

  rejectPayment(payment: Payment): void {
    this.rejectionPayment.set(payment);
    this.rejectForm.reset({ reason: '' });
  }

  submitRejectPayment(): void {
    const payment = this.rejectionPayment();
    if (!payment) return;

    if (this.rejectForm.invalid) {
      this.rejectForm.markAllAsTouched();
      return;
    }

    const reason = this.rejectForm.controls.reason.value?.trim() ?? '';
    const tenantName = this.getTenantName(payment);

    this.paymentService.rejectPayment(payment.id, reason, reason).subscribe({
      next: () => {
        this.rejectionPayment.set(null);
        this.rejectForm.reset({ reason: '' });
        this.toast.error(this.transloco.translate('pagos.actions.rejectedToast', { tenantName }));
      },
      error: (error: unknown) => {
        this.toast.error(
          this.transloco.translate('pagos.actions.rejectError', {
            message: getApiErrorMessage(error, this.transloco.translate('common.serverError')),
          }),
        );
      },
    });
  }

  closeRejectDialog(): void {
    this.rejectionPayment.set(null);
    this.rejectForm.reset({ reason: '' });
  }

  async deletePayment(payment: Payment): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.transloco.translate('pagos.actions.deleteTitle'),
      message: this.transloco.translate('pagos.actions.deleteMessage', { amount: payment.amount }),
      confirmLabel: this.transloco.translate('common.delete'),
      variant: 'danger',
    });
    if (!confirmed) return;

    this.paymentService.deletePayment(payment.id).subscribe({
      next: () => this.toast.success(this.transloco.translate('pagos.actions.deleted')),
      error: () => this.toast.error(this.transloco.translate('pagos.actions.deleteError')),
    });
  }

  onTenantSelected(tenant: AdminTenantUser): void {
    this.adminCreate.onTenantSelected(tenant);
  }

  onContractSelected(contract: Contract): void {
    this.adminCreate.onContractSelected(contract);
  }

  displayTenantFn(tenant: AdminTenantUser | null): string {
    return this.adminCreate.displayTenantFn(tenant);
  }

  displayContractFn(contract: Contract): string {
    return this.adminCreate.displayContractFn(contract);
  }

  openCreateForm(): void {
    this.adminCreate.openCreateForm();
  }

  closeCreateForm(): void {
    this.adminCreate.closeCreateForm();
  }

  submitCreatePayment(): void {
    this.adminCreate.submitCreatePayment();
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  formatCurrency(amount: number, currency?: Currency): string {
    return this.formatService.formatCurrency(amount, currency);
  }

  getCurrencyLabel(currency: Currency): string {
    return CurrencyLabels[currency];
  }

  getTenantName(payment: Payment): string {
    if (payment.tenant) {
      const t = payment.tenant as { name?: string; first_name?: string; last_name?: string };
      if (t.name) return t.name;
      const full = `${t.first_name || ''} ${t.last_name || ''}`.trim();
      if (full) return full;
    }
    return `Inquilino #${payment.tenant_id}`;
  }

  getPropertyName(payment: Payment): string {
    return payment.property?.title || `ID ${payment.property_id}`;
  }

  getUnitName(payment: Payment): string {
    const metadataUnit = payment.metadata?.['unit_number'];
    const metadataUnitStr = typeof metadataUnit === 'string' ? metadataUnit : '';
    return (
      payment.unit?.unit_number || payment.contract?.unit?.unit_number || metadataUnitStr || 'N/A'
    );
  }

  getRegisteredDate(payment: Payment): Date {
    return this.parseDate(payment.created_at) ?? this.parseDate(payment.payment_date) ?? new Date();
  }

  getStatusLabel(status: PaymentStatus): string {
    return PaymentStatusLabels[status];
  }

  getStatusColor(status: PaymentStatus): string {
    return PaymentStatusColors[status];
  }

  getTypeLabel(type: PaymentType): string {
    return PaymentTypeLabels[type];
  }

  getMethodLabel(method: PaymentMethod): string {
    return PaymentMethodLabels[method];
  }

  private parseDate(dateValue?: string | Date): Date | null {
    if (!dateValue) return null;
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private startOfDay(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  private endOfDay(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(23, 59, 59, 999);
    return normalized;
  }
}
