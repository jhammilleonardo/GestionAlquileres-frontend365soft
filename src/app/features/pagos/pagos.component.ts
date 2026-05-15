import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule, MatDatepicker } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  LucideAngularModule,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Filter,
  Eye,
  RefreshCw,
  Plus,
  X,
  Search,
  Download,
  Trash2,
  ExternalLink,
  Minus,
} from 'lucide-angular';
import { startWith, debounceTime, switchMap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { PaymentService } from '../../core/services/admin/payment.service';
import { TenantUserService } from '../../core/services/tenant/tenant-user.service';
import { ContractService, Contract } from '../../core/services/admin/contract.service';
import { FormatService } from '../../core/services/format.service';
import { TenantDatePipe } from '../../shared/pipes/tenant-date.pipe';
import { TenantCurrencyPipe } from '../../shared/pipes/tenant-currency.pipe';
import {
  Payment,
  PaymentStatus,
  PaymentType,
  PaymentMethod,
  Currency,
  PaymentStatusLabels,
  PaymentTypeLabels,
  PaymentMethodLabels,
  CurrencyLabels,
  CurrencySymbols,
  PaymentStatusColors,
  PaymentFilters,
  CreatePaymentAsAdminDto,
  PaymentProcessor,
  BulkPaymentActionDto,
} from '../../core/models/payment.model';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatAutocompleteModule,
    MatProgressBarModule,
    MatCheckboxModule,
    MatSnackBarModule,
    LucideAngularModule,
    TranslocoModule,
    TenantDatePipe,
    TenantCurrencyPipe,
  ],
  providers: [provideTranslocoScope({ scope: 'pagos', alias: 'payments' })],
  templateUrl: './pagos.component.html',
  styleUrl: './pagos.component.scss',
})
export class PagosComponent implements OnInit, OnDestroy {
  // Icons
  readonly DollarSign = DollarSign;
  readonly TrendingUp = TrendingUp;
  readonly AlertCircle = AlertCircle;
  readonly CheckCircle2 = CheckCircle2;
  readonly XCircle = XCircle;
  readonly Filter = Filter;
  readonly Eye = Eye;
  readonly RefreshCw = RefreshCw;
  readonly Plus = Plus;
  readonly X = X;
  readonly Search = Search;
  readonly Download = Download;
  readonly Trash2 = Trash2;
  readonly ExternalLink = ExternalLink;
  readonly Minus = Minus;

  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  paymentService = inject(PaymentService);
  tenantUserService = inject(TenantUserService);
  contractService = inject(ContractService);
  private formatService = inject(FormatService);

  // State
  showFilters = signal(false);
  showCreateForm = signal(false);
  selectedPayment = signal<Payment | null>(null);
  selectedProofPayment = signal<Payment | null>(null);
  rejectionPayment = signal<Payment | null>(null);
  proofObjectUrl = signal<string | null>(null);
  proofMimeType = signal<string | null>(null);
  proofLoadError = signal<string | null>(null);
  proofLoading = signal(false);
  proofZoom = signal(1);
  private readonly proofZoomStep = 0.2;
  private readonly proofZoomMin = 1;
  private readonly proofZoomMax = 2;

  // Bulk selection
  selectedIds = signal<number[]>([]);
  activeFilters = signal<PaymentFilters>({});

  pendingPaymentIds = computed(() =>
    this.paymentService
      .payments()
      .filter((p) => p.status === PaymentStatus.PENDING)
      .map((p) => p.id),
  );

  pendingPayments = computed(() =>
    this.paymentService.payments().filter((p) => p.status === PaymentStatus.PENDING),
  );

  pendingFilters = signal<{ propertyId?: number; dateFrom?: Date; dateTo?: Date }>({});

  pendingPropertyOptions = computed(() => {
    const options = new Map<number, string>();
    this.pendingPayments().forEach((payment) => {
      options.set(payment.property_id, this.getPropertyName(payment));
    });

    return [...options.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  filteredPendingPayments = computed(() => {
    const filters = this.pendingFilters();
    return this.pendingPayments().filter((payment) => {
      if (filters.propertyId && payment.property_id !== filters.propertyId) return false;

      const registeredAt = this.getRegisteredDate(payment);
      if (filters.dateFrom && registeredAt < this.startOfDay(filters.dateFrom)) return false;
      if (filters.dateTo && registeredAt > this.endOfDay(filters.dateTo)) return false;

      return true;
    });
  });

  // Create payment state
  tenantSearchControl = new FormControl('');
  filteredTenants$: Observable<any[]> = of([]);
  selectedTenant = signal<any>(null);
  availableContracts = signal<Contract[]>([]);
  selectedContract = signal<Contract | null>(null);
  loadingContracts = signal(false);

  // Enums para templates
  PaymentStatus = PaymentStatus;
  PaymentType = PaymentType;
  PaymentMethod = PaymentMethod;
  Currency = Currency;
  PaymentStatusLabels = PaymentStatusLabels;
  PaymentTypeLabels = PaymentTypeLabels;
  PaymentMethodLabels = PaymentMethodLabels;
  CurrencyLabels = CurrencyLabels;
  CurrencySymbols = CurrencySymbols;
  PaymentStatusColors = PaymentStatusColors;

  // Table columns
  displayedColumns: string[] = [
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

  // Filter form
  filterForm = this.fb.group({
    status: [''],
    type: [''],
    method: [''],
    currency: [''],
    date_from: [null as Date | null],
    date_to: [null as Date | null],
  });

  pendingFilterForm = this.fb.group({
    property_id: [null as number | null],
    date_from: [null as Date | null],
    date_to: [null as Date | null],
  });

  rejectForm = this.fb.group({
    reason: ['', [Validators.required, Validators.maxLength(400)]],
  });

  // Create payment form (sin IDs manuales)
  createPaymentForm = this.fb.group({
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

    // Campos específicos - Tarjeta
    card_last_4_digits: [''],
    card_holder_name: [''],
    card_expiry: [''],

    // Campos específicos - Transferencia
    bank_name: [''],
    bank_account_last_4: [''],

    // Campos específicos - Efectivo
    received_by: [''],
  });

  // Computed para saber qué método está seleccionado
  selectedPaymentMethod = computed(() => {
    return this.createPaymentForm.get('payment_method')?.value as PaymentMethod;
  });

  // Payment types and methods for filters
  paymentStatuses = Object.values(PaymentStatus);
  paymentTypes = Object.values(PaymentType);
  paymentMethods = Object.values(PaymentMethod);
  currencies = Object.values(Currency);

  // Computed totals
  totalAmount = computed(() => {
    return this.paymentService.payments().reduce((sum, p) => sum + p.amount, 0);
  });

  ngOnInit(): void {
    this.loadData();
    this.setupTenantSearch();
  }

  ngOnDestroy(): void {
    this.cleanupProofObjectUrl();
  }

  /**
   * Configurar búsqueda de inquilinos en tiempo real
   */
  setupTenantSearch(): void {
    this.filteredTenants$ = this.tenantSearchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap((value) => {
        if (typeof value !== 'string') {
          return of([]);
        }
        const searchTerm = value || '';
        // Filtrar localmente desde el signal
        const allTenants = this.tenantUserService.users();
        if (!searchTerm.trim()) {
          return of(allTenants.slice(0, 10)); // Mostrar primeros 10
        }
        const term = searchTerm.toLowerCase();
        const filtered = allTenants.filter((tenant) => {
          const name = tenant.name.toLowerCase();
          const email = tenant.email.toLowerCase();
          return name.includes(term) || email.includes(term);
        });
        return of(filtered.slice(0, 10)); // Máximo 10 resultados
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

  openDatepicker(datepicker: MatDatepicker<Date>, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!datepicker.opened) {
      datepicker.open();
    }
  }

  // =====================
  // Bulk Selection
  // =====================

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

  executeBulkAction(action: 'approve' | 'reject' | 'delete'): void {
    const ids = this.selectedIds();
    if (ids.length === 0) return;

    const labels: Record<string, string> = {
      approve: 'aprobar',
      reject: 'rechazar',
      delete: 'eliminar',
    };

    if (
      !confirm(
        `¿${labels[action].charAt(0).toUpperCase() + labels[action].slice(1)} ${ids.length} pago(s) seleccionado(s)?`,
      )
    ) {
      return;
    }

    let adminNotes: string | undefined;
    if (action === 'reject') {
      const reason = prompt('Motivo de rechazo (opcional):');
      if (reason === null) return; // Cancelled
      adminNotes = reason || 'Rechazado en acción masiva';
    }

    const payload: BulkPaymentActionDto = { ids, action, admin_notes: adminNotes };
    this.paymentService.bulkAction(payload).subscribe({
      next: (result) => {
        this.selectedIds.set([]);
        alert(`Acción completada: ${result.processed} procesados, ${result.errors} errores`);
      },
      error: (error) => {
        console.error('Error en acción masiva:', error);
        alert(`Error: ${error?.error?.message || 'Error del servidor'}`);
      },
    });
  }

  // =====================
  // Export CSV
  // =====================

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
      error: (error) => {
        console.error('Error exportando CSV:', error);
        let msg = `Error ${error.status || ''}: `;
        if (error.error instanceof Blob) {
          void (error.error as Blob).text().then((text) => {
            try {
              const json = JSON.parse(text) as { message?: string };
              msg += json.message || text;
            } catch {
              msg += 'Error del servidor';
            }
            alert('Error al exportar el CSV\n' + msg);
          });
        } else {
          msg += error.error?.message || error.message || 'Error desconocido';
          alert('Error al exportar el CSV\n' + msg);
        }
      },
    });
  }

  // =====================
  // Proof File
  // =====================

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
          this.snackBar.open(`Pago de ${tenantName} aprobado`, 'Cerrar', { duration: 3500 });
        },
        error: (error) => {
          console.error('Error al aprobar pago:', error);
          alert(
            `Error al aprobar el pago: ${error?.error?.message || error?.message || 'Error del servidor'}`,
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
          this.snackBar.open(`Pago de ${tenantName} rechazado`, 'Cerrar', { duration: 3500 });
        },
        error: (error) => {
          console.error('Error al rechazar pago:', error);
          alert(
            `Error al rechazar el pago: ${error?.error?.message || error?.message || 'Error del servidor'}`,
          );
        },
      });
  }

  closeRejectDialog(): void {
    this.rejectionPayment.set(null);
    this.rejectForm.reset({ reason: '' });
  }

  deletePayment(payment: Payment): void {
    if (confirm(`¿Eliminar el pago de ${payment.amount} BOB? Esta acción no se puede deshacer.`)) {
      this.paymentService.deletePayment(payment.id).subscribe({
        next: () => {
          console.log('Pago eliminado');
        },
        error: (error) => {
          console.error('Error al eliminar pago:', error);
          alert('Error al eliminar el pago');
        },
      });
    }
  }

  /**
   * Cuando selecciona un inquilino del autocomplete
   */
  onTenantSelected(tenant: any): void {
    this.selectedTenant.set(tenant);
    this.selectedContract.set(null);
    this.availableContracts.set([]);

    // Cargar contratos del inquilino
    this.loadingContracts.set(true);
    this.contractService.getContractsByTenantId(tenant.id).subscribe({
      next: (contracts) => {
        this.availableContracts.set(contracts);
        this.loadingContracts.set(false);
      },
      error: (error) => {
        console.error('Error loading contracts:', error);
        this.loadingContracts.set(false);
        alert('Error al cargar los contratos del inquilino');
      },
    });
  }

  /**
   * Cuando selecciona un contrato del dropdown
   */
  onContractSelected(contract: Contract): void {
    this.selectedContract.set(contract);
  }

  /**
   * Display function para el autocomplete
   */
  displayTenantFn(tenant: any): string {
    return tenant ? `${tenant.name} (${tenant.email})` : '';
  }

  /**
   * Display function para el contrato select
   */
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
      alert('Debes seleccionar un inquilino y un contrato');
      return;
    }

    if (this.createPaymentForm.invalid) {
      alert('Por favor completa todos los campos requeridos');
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

      // Campos específicos por método de pago
      card_last_4_digits: formValue.card_last_4_digits || undefined,
      card_holder_name: formValue.card_holder_name || undefined,
      card_expiry: formValue.card_expiry || undefined,
      bank_name: formValue.bank_name || undefined,
      bank_account_last_4: formValue.bank_account_last_4 || undefined,
      received_by: formValue.received_by || undefined,
    };

    this.paymentService.createPaymentAsAdmin(payload).subscribe({
      next: () => {
        console.log('Pago creado exitosamente');
        this.closeCreateForm();
        alert('Pago creado exitosamente');
      },
      error: (error) => {
        console.error('Error al crear pago:', error);
        alert(error.error?.message || 'Error al crear el pago');
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
      // El backend puede devolver 'name' (campo único) o 'first_name'/'last_name'
      const t = payment.tenant as any;
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
    return (
      payment.unit?.unit_number ||
      payment.contract?.unit?.unit_number ||
      (metadataUnit ? metadataUnit.toString() : '') ||
      'N/A'
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
