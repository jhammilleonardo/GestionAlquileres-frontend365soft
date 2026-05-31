import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { debounceTime, startWith, switchMap } from 'rxjs/operators';

import { getApiErrorMessage } from '../../core/http/http-error.util';
import {
  BulkPaymentActionDto,
  CreatePaymentAsAdminDto,
  Currency,
  CurrencyLabels,
  CurrencySymbols,
  Payment,
  PaymentFilters,
  PaymentMethod,
  PaymentMethodLabels,
  PaymentProcessor,
  PaymentStatus,
  PaymentStatusColors,
  PaymentStatusLabels,
  PaymentType,
  PaymentTypeLabels,
} from '../../core/models/payment.model';
import { AdminTenantUser } from '../../core/models/tenant-user.model';
import { Contract, ContractService } from '../../core/services/admin/contract.service';
import { PaymentService } from '../../core/services/admin/payment.service';
import { FormatService } from '../../core/services/format.service';
import { TenantUserService } from '../../core/services/tenant/tenant-user.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { AppSelectOption } from '../../shared/ui/select/select.component';
import { AppStatusTone } from '../../shared/ui/status-badge/status-badge.component';
import { ToastService } from '../../shared/ui/toast/toast.service';

export class PagosFacade {
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly destroyRef = inject(DestroyRef);
  readonly paymentService = inject(PaymentService);
  readonly tenantUserService = inject(TenantUserService);
  readonly contractService = inject(ContractService);
  private readonly formatService = inject(FormatService);

  readonly showFilters = signal(false);
  readonly showCreateForm = signal(false);
  readonly selectedPayment = signal<Payment | null>(null);
  readonly selectedProofPayment = signal<Payment | null>(null);
  readonly rejectionPayment = signal<Payment | null>(null);
  readonly proofObjectUrl = signal<string | null>(null);
  readonly proofMimeType = signal<string | null>(null);
  readonly proofLoadError = signal<string | null>(null);
  readonly proofLoading = signal(false);
  readonly proofZoom = signal(1);
  private readonly proofZoomStep = 0.2;
  private readonly proofZoomMin = 1;
  private readonly proofZoomMax = 2;

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

  readonly tenantSearchControl = new FormControl('');
  filteredTenants$: Observable<AdminTenantUser[]> = of([]);
  readonly selectedTenant = signal<AdminTenantUser | null>(null);
  readonly availableContracts = signal<Contract[]>([]);
  readonly selectedContract = signal<Contract | null>(null);
  readonly loadingContracts = signal(false);

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

  readonly createPaymentForm = this.fb.group({
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    currency: [Currency.BOB, Validators.required],
    payment_type: [PaymentType.RENT, Validators.required],
    payment_method: [PaymentMethod.TRANSFER, Validators.required],
    status: [PaymentStatus.APPROVED],
    payment_date: [new Date(), Validators.required],
    due_date: [null as Date | null],
    reference_number: [''],
    check_number: [''],
    notes: [''],
    admin_notes: [''],
    card_last_4_digits: [''],
    card_holder_name: [''],
    card_expiry: [''],
    bank_name: [''],
    bank_account_last_4: [''],
    received_by: [''],
  });

  readonly selectedPaymentMethod = computed(() => {
    return this.createPaymentForm.get('payment_method')?.value as PaymentMethod;
  });

  readonly paymentStatuses = Object.values(PaymentStatus);
  readonly paymentTypes = Object.values(PaymentType);
  readonly paymentMethods = Object.values(PaymentMethod);
  readonly currencies = Object.values(Currency);

  readonly totalAmount = computed(() =>
    this.paymentService.payments().reduce((sum, p) => sum + p.amount, 0),
  );

  constructor() {
    this.loadData();
    this.setupTenantSearch();
    this.destroyRef.onDestroy(() => this.cleanupProofObjectUrl());
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

  setupTenantSearch(): void {
    this.filteredTenants$ = this.tenantSearchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap((value) => {
        if (typeof value !== 'string') {
          return of([]);
        }
        const searchTerm = value || '';
        const allTenants = this.tenantUserService.users();
        if (!searchTerm.trim()) {
          return of(allTenants.slice(0, 10));
        }
        const term = searchTerm.toLowerCase();
        const filtered = allTenants.filter((tenant) => {
          const name = tenant.name.toLowerCase();
          const email = tenant.email.toLowerCase();
          return name.includes(term) || email.includes(term);
        });
        return of(filtered.slice(0, 10));
      }),
    );
  }

  loadData(): void {
    this.paymentService.loadPayments();
    this.paymentService.loadStats();
    this.tenantUserService.loadAllUsers();
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
      approve: 'Aprobar',
      reject: 'Rechazar',
      delete: 'Eliminar',
    };
    const verb = labels[action];
    let adminNotes: string | undefined;

    if (action === 'reject') {
      const result = await this.confirmDialog.open({
        title: `${verb} ${ids.length} pago(s)`,
        message: `¿${verb} ${ids.length} pago(s) seleccionado(s)?`,
        confirmLabel: verb,
        variant: 'danger',
        input: { label: 'Motivo de rechazo (opcional)', placeholder: 'Motivo...' },
      });
      if (!result.confirmed) return;
      adminNotes = result.value || 'Rechazado en acción masiva';
    } else {
      const confirmed = await this.confirmDialog.confirm({
        title: `${verb} ${ids.length} pago(s)`,
        message: `¿${verb} ${ids.length} pago(s) seleccionado(s)?`,
        confirmLabel: verb,
        variant: action === 'delete' ? 'danger' : 'default',
      });
      if (!confirmed) return;
    }

    const payload: BulkPaymentActionDto = { ids, action, admin_notes: adminNotes };
    this.paymentService.bulkAction(payload).subscribe({
      next: (result) => {
        this.selectedIds.set([]);
        this.toast.success(
          `Acción completada: ${result.processed} procesados, ${result.errors} errores`,
        );
      },
      error: (error: unknown) => {
        this.toast.error(`Error: ${getApiErrorMessage(error, 'Error del servidor')}`);
      },
    });
  }

  exportCsv(): void {
    const filters = this.activeFilters();
    this.paymentService.exportCsv(filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pagos_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
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
              msg += 'Error del servidor';
            }
            this.toast.error('Error al exportar el CSV\n' + msg);
          });
        } else {
          msg += getApiErrorMessage(error, 'Error desconocido');
          this.toast.error('Error al exportar el CSV\n' + msg);
        }
      },
    });
  }

  getProofUrl(payment: Payment): string | null {
    return this.paymentService.getProofUrl(payment);
  }

  openProof(payment: Payment): void {
    if (!this.getProofUrl(payment)) return;
    this.selectedProofPayment.set(payment);
    this.proofLoading.set(true);
    this.proofLoadError.set(null);
    this.proofZoom.set(1);
    this.cleanupProofObjectUrl();

    this.paymentService.downloadProof(payment).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        this.proofObjectUrl.set(objectUrl);
        this.proofMimeType.set(blob.type || null);
        this.proofLoading.set(false);
      },
      error: (error: { message?: string }) => {
        this.proofLoading.set(false);
        this.proofLoadError.set(error.message || 'No se pudo cargar el comprobante');
      },
    });
  }

  closeProof(): void {
    this.selectedProofPayment.set(null);
    this.proofLoading.set(false);
    this.proofLoadError.set(null);
    this.proofZoom.set(1);
    this.cleanupProofObjectUrl();
  }

  isProofPdf(payment: Payment): boolean {
    const mimeType = this.proofMimeType()?.toLowerCase() ?? '';
    if (mimeType.includes('pdf')) return true;
    const proofFile = payment.proof_file?.toLowerCase() ?? '';
    return proofFile.endsWith('.pdf');
  }

  zoomInProof(): void {
    this.proofZoom.update((zoom) =>
      Math.min(Number((zoom + this.proofZoomStep).toFixed(2)), this.proofZoomMax),
    );
  }

  zoomOutProof(): void {
    this.proofZoom.update((zoom) =>
      Math.max(Number((zoom - this.proofZoomStep).toFixed(2)), this.proofZoomMin),
    );
  }

  resetProofZoom(): void {
    this.proofZoom.set(1);
  }

  canZoomInProof(): boolean {
    return this.proofZoom() < this.proofZoomMax;
  }

  canZoomOutProof(): boolean {
    return this.proofZoom() > this.proofZoomMin;
  }

  viewPaymentDetail(payment: Payment): void {
    this.selectedPayment.set(payment);
  }

  approvePayment(payment: Payment): void {
    const tenantName = this.getTenantName(payment);
    this.paymentService
      .updatePaymentStatus(payment.id, {
        status: PaymentStatus.APPROVED,
        admin_notes: 'Pago aprobado por administrador',
      })
      .subscribe({
        next: () => {
          this.rejectionPayment.set(null);
          this.toast.success(`Pago de ${tenantName} aprobado`);
        },
        error: (error: unknown) => {
          this.toast.error(
            `Error al aprobar el pago: ${getApiErrorMessage(error, 'Error del servidor')}`,
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

    this.paymentService
      .updatePaymentStatus(payment.id, {
        status: PaymentStatus.REJECTED,
        admin_notes: reason,
        rejection_reason: reason,
      })
      .subscribe({
        next: () => {
          this.rejectionPayment.set(null);
          this.rejectForm.reset({ reason: '' });
          this.toast.error(`Pago de ${tenantName} rechazado`);
        },
        error: (error: unknown) => {
          this.toast.error(
            `Error al rechazar el pago: ${getApiErrorMessage(error, 'Error del servidor')}`,
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
      title: 'Eliminar pago',
      message: `¿Eliminar el pago de ${payment.amount} BOB? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!confirmed) return;

    this.paymentService.deletePayment(payment.id).subscribe({
      next: () => this.toast.success('Pago eliminado'),
      error: () => this.toast.error('Error al eliminar el pago'),
    });
  }

  onTenantSelected(tenant: AdminTenantUser): void {
    this.selectedTenant.set(tenant);
    this.selectedContract.set(null);
    this.availableContracts.set([]);
    this.loadingContracts.set(true);
    this.contractService.getContractsByTenantId(tenant.id).subscribe({
      next: (contracts) => {
        this.availableContracts.set(contracts);
        this.loadingContracts.set(false);
      },
      error: () => {
        this.loadingContracts.set(false);
        this.toast.error('Error al cargar los contratos del inquilino');
      },
    });
  }

  onContractSelected(contract: Contract): void {
    this.selectedContract.set(contract);
  }

  displayTenantFn(tenant: AdminTenantUser | null): string {
    return tenant ? `${tenant.name} (${tenant.email})` : '';
  }

  displayContractFn(contract: Contract): string {
    return this.contractService.formatContractDisplay(contract);
  }

  openCreateForm(): void {
    this.showCreateForm.set(true);
    this.tenantSearchControl.reset('');
    this.selectedTenant.set(null);
    this.selectedContract.set(null);
    this.availableContracts.set([]);
    this.createPaymentForm.reset({
      currency: Currency.BOB,
      payment_type: PaymentType.RENT,
      payment_method: PaymentMethod.TRANSFER,
      status: PaymentStatus.APPROVED,
      payment_date: new Date(),
    });
  }

  closeCreateForm(): void {
    this.showCreateForm.set(false);
    this.tenantSearchControl.reset('');
    this.selectedTenant.set(null);
    this.selectedContract.set(null);
    this.availableContracts.set([]);
    this.createPaymentForm.reset();
  }

  submitCreatePayment(): void {
    const tenant = this.selectedTenant();
    const contract = this.selectedContract();

    if (!tenant || !contract) {
      this.toast.error('Debes seleccionar un inquilino y un contrato');
      return;
    }

    if (this.createPaymentForm.invalid) {
      this.toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    const formValue = this.createPaymentForm.value;
    const payload: CreatePaymentAsAdminDto = {
      tenant_id: tenant.id,
      contract_id: contract.id,
      property_id: contract.property_id,
      amount: formValue.amount!,
      currency: formValue.currency as Currency,
      payment_type: formValue.payment_type as PaymentType,
      payment_method: formValue.payment_method as PaymentMethod,
      status: formValue.status as PaymentStatus,
      payment_date: formValue.payment_date!,
      due_date: formValue.due_date || undefined,
      reference_number: formValue.reference_number || undefined,
      check_number: formValue.check_number || undefined,
      notes: formValue.notes || undefined,
      admin_notes: formValue.admin_notes || undefined,
      payment_processor: PaymentProcessor.MANUAL,
      card_last_4_digits: formValue.card_last_4_digits || undefined,
      card_holder_name: formValue.card_holder_name || undefined,
      card_expiry: formValue.card_expiry || undefined,
      bank_name: formValue.bank_name || undefined,
      bank_account_last_4: formValue.bank_account_last_4 || undefined,
      received_by: formValue.received_by || undefined,
    };

    this.paymentService.createPaymentAsAdmin(payload).subscribe({
      next: () => {
        this.closeCreateForm();
        this.toast.success('Pago creado exitosamente');
      },
      error: (error: unknown) => {
        this.toast.error(getApiErrorMessage(error, 'Error al crear el pago'));
      },
    });
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

  private cleanupProofObjectUrl(): void {
    const currentObjectUrl = this.proofObjectUrl();
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
    }
    this.proofObjectUrl.set(null);
    this.proofMimeType.set(null);
  }
}
