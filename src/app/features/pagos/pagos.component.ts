import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LucideAngularModule, DollarSign, TrendingUp, AlertCircle, CheckCircle2, XCircle, Filter, Eye, RefreshCw, Plus, X, Search } from 'lucide-angular';
import { startWith, debounceTime, switchMap, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { PaymentService } from '../../core/services/payment.service';
import { TenantUserService } from '../../core/services/tenant-user.service';
import { ContractService, Contract } from '../../core/services/contract.service';
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
  PaymentProcessor
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
    LucideAngularModule
  ],
  templateUrl: './pagos.component.html',
  styleUrl: './pagos.component.scss'
})
export class PagosComponent implements OnInit {
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

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  paymentService = inject(PaymentService);
  tenantUserService = inject(TenantUserService);
  contractService = inject(ContractService);

  // State
  showFilters = signal(false);
  showCreateForm = signal(false);
  selectedPayment = signal<Payment | null>(null);

  // Create payment state
  tenantSearchControl = new FormControl('');
  filteredTenants$: Observable<any[]> = of([]);
  selectedTenant = signal<any | null>(null);
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
  displayedColumns: string[] = ['id', 'tenant', 'property', 'amount', 'currency', 'type', 'method', 'payment_date', 'status', 'actions'];

  // Filter form
  filterForm = this.fb.group({
    status: [''],
    type: [''],
    method: [''],
    currency: [''],
    date_from: [null as Date | null],
    date_to: [null as Date | null]
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
    received_by: ['']
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

  /**
   * Configurar búsqueda de inquilinos en tiempo real
   */
  setupTenantSearch(): void {
    this.filteredTenants$ = this.tenantSearchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(value => {
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
        const filtered = allTenants.filter(tenant => {
          const name = tenant.name.toLowerCase();
          const email = tenant.email.toLowerCase();
          return name.includes(term) || email.includes(term);
        });
        return of(filtered.slice(0, 10)); // Máximo 10 resultados
      })
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

    this.paymentService.loadPayments(filters);
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.paymentService.loadPayments();
  }

  viewPaymentDetail(payment: Payment): void {
    this.selectedPayment.set(payment);
  }

  approvePayment(payment: Payment): void {
    const tenantName = this.getTenantName(payment);
    if (confirm(`¿Aprobar el pago de ${this.formatCurrency(payment.amount, payment.currency)} de ${tenantName}?`)) {
      this.paymentService.updatePaymentStatus(payment.id, {
        status: PaymentStatus.APPROVED,
        admin_notes: 'Pago aprobado por administrador'
      }).subscribe({
        next: () => {
          console.log('Pago aprobado exitosamente');
          this.loadData();
        },
        error: (error) => {
          console.error('Error al aprobar pago:', error);
          alert(`Error al aprobar el pago: ${error?.error?.message || error?.message || 'Error del servidor'}`);
        }
      });
    }
  }

  rejectPayment(payment: Payment): void {
    const reason = prompt('¿Por qué rechazas este pago?');
    if (reason !== null) {
      this.paymentService.updatePaymentStatus(payment.id, {
        status: PaymentStatus.REJECTED,
        admin_notes: reason || 'Pago rechazado',
        rejection_reason: reason || 'Rechazado por administrador'
      }).subscribe({
        next: () => {
          console.log('Pago rechazado');
          this.loadData();
        },
        error: (error) => {
          console.error('Error al rechazar pago:', error);
          alert(`Error al rechazar el pago: ${error?.error?.message || error?.message || 'Error del servidor'}`);
        }
      });
    }
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
        }
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
      }
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
      payment_date: new Date()
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
      received_by: formValue.received_by || undefined
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
      }
    });
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  formatCurrency(amount: number, currency?: Currency): string {
    const curr = currency || Currency.USD;
    const symbol = CurrencySymbols[curr];
    return `${symbol}${amount.toFixed(2)}`;
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
}
