import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';
import { of, switchMap } from 'rxjs';

import { getApiErrorMessage } from '../../core/http/http-error.util';
import {
  CreateExpenseDto,
  Expense,
  ExpenseCategory,
  ExpensePaymentStatus,
  ExpenseResponsibility,
  ExpenseScope,
  MonthlyBalancePoint,
} from '../../core/models/expense.model';
import { FileDownloadService } from '../../core/services/file-download.service';
import { toDateOnly } from '../../core/utils/date-only.util';
import { ExpenseService } from '../../core/services/admin/expense.service';
import { PropertyService } from '../../core/services/admin/property.service';
import { VendorService } from '../../core/services/admin/vendor.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { AppSelectOption } from '../../shared/ui/select/select.component';
import { ToastService } from '../../shared/ui/toast/toast.service';

export interface ChartBar {
  readonly label: string;
  readonly income: number;
  readonly expenses: number;
  readonly incomeHeight: number;
  readonly expenseHeight: number;
}

const RECEIPT_MAX_BYTES = 10 * 1024 * 1024;
const RECEIPT_ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

@Injectable()
export class ExpensesFacade {
  private readonly fb = inject(FormBuilder);
  private readonly expenseService = inject(ExpenseService);
  private readonly vendorService = inject(VendorService);
  private readonly propertyService = inject(PropertyService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly fileDownload = inject(FileDownloadService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly expenses = signal<Expense[]>([]);
  readonly isLoading = signal(true);
  readonly monthlyBalance = signal<MonthlyBalancePoint[]>([]);

  readonly propertyOptions = signal<AppSelectOption<number>[]>([]);
  readonly vendorOptions = signal<AppSelectOption<number>[]>([]);

  readonly dialogOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly saving = signal(false);
  readonly selectedReceipt = signal<File | null>(null);
  readonly receiptError = signal<string | null>(null);
  readonly paymentDialogOpen = signal(false);
  readonly paymentExpense = signal<Expense | null>(null);
  readonly registeringPayment = signal(false);

  readonly categoryValues = Object.values(ExpenseCategory);

  get categoryOptions(): AppSelectOption<string>[] {
    return this.categoryValues.map((value) => ({
      value,
      label: this.transloco.translate(`accounting.category.${value}`),
    }));
  }

  get categoryFilterOptions(): AppSelectOption<string>[] {
    return [
      { value: '', label: this.transloco.translate('accounting.allCategories') },
      ...this.categoryOptions,
    ];
  }

  get scopeOptions(): AppSelectOption<string>[] {
    return Object.values(ExpenseScope).map((value) => ({
      value,
      label: this.transloco.translate(`accounting.scope.${value}`),
    }));
  }

  get scopeFilterOptions(): AppSelectOption<string>[] {
    return [
      { value: '', label: this.transloco.translate('accounting.allScopes') },
      ...this.scopeOptions,
    ];
  }

  get responsibilityOptions(): AppSelectOption<string>[] {
    return Object.values(ExpenseResponsibility).map((value) => ({
      value,
      label: this.transloco.translate(`accounting.responsibility.${value}`),
    }));
  }

  get responsibilityFilterOptions(): AppSelectOption<string>[] {
    return [
      { value: '', label: this.transloco.translate('accounting.allResponsibilities') },
      ...this.responsibilityOptions,
    ];
  }

  get paymentStatusOptions(): AppSelectOption<string>[] {
    return Object.values(ExpensePaymentStatus).map((value) => ({
      value,
      label: this.transloco.translate(`accounting.paymentStatus.${value}`),
    }));
  }

  get paymentStatusFilterOptions(): AppSelectOption<string>[] {
    return [
      { value: '', label: this.transloco.translate('accounting.allPaymentStatuses') },
      ...this.paymentStatusOptions,
    ];
  }

  get reimbursableFilterOptions(): AppSelectOption<string>[] {
    return [
      { value: '', label: this.transloco.translate('accounting.allReimbursable') },
      { value: 'true', label: this.transloco.translate('accounting.reimbursableOnly') },
      { value: 'false', label: this.transloco.translate('accounting.notReimbursableOnly') },
    ];
  }

  readonly filterForm = this.fb.group({
    property_id: [null as number | null],
    category: [''],
    expense_scope: [''],
    responsibility: [''],
    payment_status: [''],
    is_reimbursable: [''],
    from: [''],
    to: [''],
  });

  readonly form = this.fb.group({
    property_id: [null as number | null, Validators.required],
    category: [ExpenseCategory.MAINTENANCE as string, Validators.required],
    expense_scope: [ExpenseScope.GENERAL as string, Validators.required],
    responsibility: [ExpenseResponsibility.COMPANY as string, Validators.required],
    payment_status: [ExpensePaymentStatus.PAID as string, Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    date: ['', Validators.required],
    due_date: [''],
    paid_date: [''],
    vendor_id: [null as number | null],
    invoice_number: [''],
    description: [''],
    receipt_url: [''],
    affects_owner_statement: [true],
    is_reimbursable: [false],
    notes: [''],
  });

  readonly paymentForm = this.fb.group({
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    payment_date: [toDateOnly(new Date()), Validators.required],
    payment_method: [''],
    reference_number: [''],
    notes: [''],
  });

  readonly totalIncome = computed(() =>
    this.monthlyBalance().reduce((sum, month) => sum + month.income, 0),
  );
  readonly totalExpenses = computed(() =>
    this.monthlyBalance().reduce((sum, month) => sum + month.expenses, 0),
  );
  readonly netResult = computed(() => this.totalIncome() - this.totalExpenses());
  readonly listedExpenseTotal = computed(() => this.sumBy((expense) => expense.amount));
  readonly ownerDeductionTotal = computed(() =>
    this.sumBy((expense) => ((expense.affects_owner_statement ?? true) ? expense.amount : 0)),
  );
  readonly reimbursableTotal = computed(() =>
    this.sumBy((expense) => (expense.is_reimbursable ? expense.amount : 0)),
  );
  readonly pendingTotal = computed(() =>
    this.sumBy((expense) =>
      expense.payment_status === ExpensePaymentStatus.PENDING ||
      expense.payment_status === ExpensePaymentStatus.PARTIALLY_PAID
        ? this.expenseBalance(expense)
        : 0,
    ),
  );
  readonly shortTermTotal = computed(() =>
    this.sumBy((expense) =>
      expense.expense_scope === ExpenseScope.SHORT_TERM ? expense.amount : 0,
    ),
  );
  readonly longTermTotal = computed(() =>
    this.sumBy((expense) =>
      expense.expense_scope === ExpenseScope.LONG_TERM ? expense.amount : 0,
    ),
  );
  readonly hasChartData = computed(() =>
    this.monthlyBalance().some((month) => month.income > 0 || month.expenses > 0),
  );

  readonly chartBars = computed<ChartBar[]>(() => {
    const data = this.monthlyBalance();
    const max = Math.max(1, ...data.map((month) => Math.max(month.income, month.expenses)));
    return data.map((month) => ({
      label: this.monthLabel(month.month),
      income: month.income,
      expenses: month.expenses,
      incomeHeight: Math.round((month.income / max) * 100),
      expenseHeight: Math.round((month.expenses / max) * 100),
    }));
  });

  constructor() {
    this.loadProperties();
    this.loadVendors();
    this.load();
  }

  loadProperties(): void {
    this.propertyService.getAdminProperties().subscribe({
      next: (properties) =>
        this.propertyOptions.set(
          properties.map((property) => ({ value: property.id, label: property.title })),
        ),
      error: () => this.propertyOptions.set([]),
    });
  }

  loadVendors(): void {
    this.vendorService.list().subscribe({
      next: (vendors) =>
        this.vendorOptions.set(vendors.map((vendor) => ({ value: vendor.id, label: vendor.name }))),
      error: () => this.vendorOptions.set([]),
    });
  }

  load(): void {
    this.isLoading.set(true);
    const filters = this.filterForm.value;
    const params: Record<string, string | number> = { limit: 200 };
    if (filters.property_id) params['property_id'] = filters.property_id;
    if (filters.category) params['category'] = filters.category;
    if (filters.expense_scope) params['expense_scope'] = filters.expense_scope;
    if (filters.responsibility) params['responsibility'] = filters.responsibility;
    if (filters.payment_status) params['payment_status'] = filters.payment_status;
    if (filters.is_reimbursable) params['is_reimbursable'] = filters.is_reimbursable;
    if (filters.from) params['from'] = filters.from;
    if (filters.to) params['to'] = filters.to;

    this.expenseService.list(params).subscribe({
      next: (res) => {
        this.expenses.set(res.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.expenses.set([]);
        this.isLoading.set(false);
      },
    });

    this.expenseService.getMonthlyBalance(filters.property_id ?? undefined).subscribe({
      next: (balance) => this.monthlyBalance.set(balance),
      error: () => this.monthlyBalance.set([]),
    });
  }

  applyFilters(): void {
    this.load();
  }

  clearFilters(): void {
    this.filterForm.reset({
      property_id: null,
      category: '',
      expense_scope: '',
      responsibility: '',
      payment_status: '',
      is_reimbursable: '',
      from: '',
      to: '',
    });
    this.load();
  }

  openCreate(): void {
    this.editingId.set(null);
    this.selectedReceipt.set(null);
    this.receiptError.set(null);
    this.form.reset({
      category: ExpenseCategory.MAINTENANCE,
      expense_scope: ExpenseScope.GENERAL,
      responsibility: ExpenseResponsibility.COMPANY,
      payment_status: ExpensePaymentStatus.PAID,
      date: toDateOnly(new Date()),
      due_date: '',
      paid_date: toDateOnly(new Date()),
      affects_owner_statement: true,
      is_reimbursable: false,
    });
    this.dialogOpen.set(true);
  }

  openEdit(expense: Expense): void {
    this.editingId.set(expense.id);
    this.selectedReceipt.set(null);
    this.receiptError.set(null);
    this.form.reset({
      property_id: expense.property_id,
      category: expense.category,
      expense_scope: expense.expense_scope ?? ExpenseScope.GENERAL,
      responsibility: expense.responsibility ?? ExpenseResponsibility.COMPANY,
      payment_status: expense.payment_status ?? ExpensePaymentStatus.PAID,
      amount: expense.amount,
      date: expense.date?.slice(0, 10) ?? '',
      due_date: expense.due_date?.slice(0, 10) ?? '',
      paid_date: expense.paid_date?.slice(0, 10) ?? '',
      vendor_id: expense.vendor_id ?? null,
      invoice_number: expense.invoice_number ?? '',
      description: expense.description ?? '',
      receipt_url: expense.receipt_url ?? '',
      affects_owner_statement: expense.affects_owner_statement ?? true,
      is_reimbursable: expense.is_reimbursable ?? false,
      notes: expense.notes ?? '',
    });
    this.dialogOpen.set(true);
  }

  closeDialog(): void {
    this.dialogOpen.set(false);
    this.selectedReceipt.set(null);
    this.receiptError.set(null);
  }

  openPaymentDialog(expense: Expense): void {
    this.paymentExpense.set(expense);
    this.paymentForm.reset({
      amount: this.expenseBalance(expense),
      payment_date: toDateOnly(new Date()),
      payment_method: '',
      reference_number: '',
      notes: '',
    });
    this.paymentDialogOpen.set(true);
  }

  closePaymentDialog(): void {
    this.paymentDialogOpen.set(false);
    this.paymentExpense.set(null);
  }

  registerPayment(): void {
    const expense = this.paymentExpense();
    if (!expense) return;
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    const raw = this.paymentForm.getRawValue();
    this.registeringPayment.set(true);
    this.expenseService
      .registerPayment(expense.id, {
        amount: Number(raw.amount),
        currency: expense.currency,
        payment_date: raw.payment_date!,
        payment_method: raw.payment_method?.trim() || undefined,
        reference_number: raw.reference_number?.trim() || undefined,
        notes: raw.notes?.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.registeringPayment.set(false);
          this.closePaymentDialog();
          this.toast.success(this.transloco.translate('accounting.paymentRegistered'));
          this.load();
        },
        error: (err: unknown) => {
          this.registeringPayment.set(false);
          this.toast.error(
            getApiErrorMessage(err, this.transloco.translate('accounting.paymentRegisterError')),
          );
        },
      });
  }

  selectReceipt(file: File | null): void {
    this.receiptError.set(null);
    if (!file) {
      this.selectedReceipt.set(null);
      return;
    }

    if (!RECEIPT_ALLOWED_TYPES.has(file.type)) {
      this.selectedReceipt.set(null);
      this.receiptError.set(this.transloco.translate('accounting.receiptTypeError'));
      return;
    }

    if (file.size > RECEIPT_MAX_BYTES) {
      this.selectedReceipt.set(null);
      this.receiptError.set(this.transloco.translate('accounting.receiptSizeError'));
      return;
    }

    this.selectedReceipt.set(file);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const dto = this.buildDto();
    this.saving.set(true);
    const id = this.editingId();
    const request$ = id ? this.expenseService.update(id, dto) : this.expenseService.create(dto);
    const receipt = this.selectedReceipt();

    request$
      .pipe(
        switchMap((expense) =>
          receipt ? this.expenseService.uploadReceipt(expense.id, receipt) : of(expense),
        ),
      )
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.dialogOpen.set(false);
          this.selectedReceipt.set(null);
          this.receiptError.set(null);
          this.toast.success(
            this.transloco.translate(id ? 'accounting.updated' : 'accounting.created'),
          );
          this.load();
        },
        error: (err: unknown) => {
          this.saving.set(false);
          this.toast.error(
            getApiErrorMessage(err, this.transloco.translate('accounting.saveError')),
          );
        },
      });
  }

  async deleteExpense(expense: Expense): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.transloco.translate('common.delete'),
      message: this.transloco.translate('accounting.confirmDelete'),
      confirmLabel: this.transloco.translate('common.delete'),
      cancelLabel: this.transloco.translate('common.cancel'),
      variant: 'danger',
    });
    if (!confirmed) return;

    this.expenseService.remove(expense.id).subscribe({
      next: () => {
        this.toast.success(this.transloco.translate('accounting.deleted'));
        this.load();
      },
      error: () => this.toast.error(this.transloco.translate('accounting.saveError')),
    });
  }

  exportCsv(): void {
    const rows = this.expenses();
    if (rows.length === 0) return;
    const header = [
      'Fecha',
      'Propiedad',
      'Ámbito',
      'Categoría',
      'Responsable',
      'Estado',
      'Vence',
      'Pagado el',
      'Monto',
      'Moneda',
      'Proveedor',
      'Deducible propietario',
      'Reembolsable',
      'Documento',
      'Descripción',
    ];
    const lines = rows.map((expense) =>
      [
        expense.date,
        expense.property?.title ?? '',
        this.scopeLabel(expense.expense_scope),
        this.transloco.translate(`accounting.category.${expense.category}`),
        this.responsibilityLabel(expense.responsibility),
        this.paymentStatusLabel(expense.payment_status),
        expense.due_date ?? '',
        expense.paid_date ?? '',
        expense.amount,
        expense.currency,
        expense.vendor_name ?? '',
        (expense.affects_owner_statement ?? true) ? 'Si' : 'No',
        expense.is_reimbursable ? 'Si' : 'No',
        expense.invoice_number ?? '',
        (expense.description ?? '').replace(/"/g, '""'),
      ]
        .map((cell) => `"${cell}"`)
        .join(','),
    );
    const bom = String.fromCharCode(0xfeff);
    const csv = bom + [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    this.fileDownload.downloadBlob(blob, `gastos-${toDateOnly(new Date())}.csv`);
  }

  categoryLabel(category: string): string {
    return this.transloco.translate(`accounting.category.${category}`);
  }

  scopeLabel(scope: string | null | undefined): string {
    return this.transloco.translate(`accounting.scope.${scope ?? ExpenseScope.GENERAL}`);
  }

  responsibilityLabel(responsibility: string | null | undefined): string {
    return this.transloco.translate(
      `accounting.responsibility.${responsibility ?? ExpenseResponsibility.COMPANY}`,
    );
  }

  paymentStatusLabel(status: string | null | undefined): string {
    return this.transloco.translate(
      `accounting.paymentStatus.${status ?? ExpensePaymentStatus.PAID}`,
    );
  }

  private buildDto(): CreateExpenseDto {
    const raw = this.form.getRawValue();
    const vendorName = this.vendorOptions().find((vendor) => vendor.value === raw.vendor_id)?.label;
    return {
      property_id: raw.property_id!,
      category: raw.category!,
      expense_scope: raw.expense_scope ?? ExpenseScope.GENERAL,
      responsibility: raw.responsibility ?? ExpenseResponsibility.COMPANY,
      payment_status: raw.payment_status ?? ExpensePaymentStatus.PAID,
      amount: Number(raw.amount),
      date: raw.date!,
      due_date: raw.due_date || undefined,
      paid_date: raw.paid_date || undefined,
      vendor_id: raw.vendor_id ?? undefined,
      vendor_name: vendorName,
      description: raw.description?.trim() || undefined,
      receipt_url: raw.receipt_url?.trim() || undefined,
      invoice_number: raw.invoice_number?.trim() || undefined,
      affects_owner_statement: raw.affects_owner_statement ?? true,
      is_reimbursable: raw.is_reimbursable ?? false,
      notes: raw.notes?.trim() || undefined,
    };
  }

  private sumBy(selector: (expense: Expense) => number): number {
    return this.expenses().reduce((sum, expense) => sum + selector(expense), 0);
  }

  expenseBalance(expense: Expense): number {
    return Math.max(0, expense.amount - Number(expense.paid_amount ?? 0));
  }

  private monthLabel(month: string): string {
    const [year, monthNumber] = month.split('-');
    const date = new Date(Number(year), Number(monthNumber) - 1, 1);
    return date.toLocaleDateString(this.transloco.getActiveLang(), { month: 'short' });
  }
}
