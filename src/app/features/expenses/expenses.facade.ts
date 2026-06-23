import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';

import { getApiErrorMessage } from '../../core/http/http-error.util';
import {
  CreateExpenseDto,
  Expense,
  ExpenseCategory,
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

  readonly categoryValues = Object.values(ExpenseCategory);
  readonly categoryOptions: AppSelectOption<string>[] = this.categoryValues.map((value) => ({
    value,
    label: this.transloco.translate(`accounting.category.${value}`),
  }));
  readonly categoryFilterOptions: AppSelectOption<string>[] = [
    { value: '', label: this.transloco.translate('accounting.allCategories') },
    ...this.categoryOptions,
  ];

  readonly filterForm = this.fb.group({
    property_id: [null as number | null],
    category: [''],
    from: [''],
    to: [''],
  });

  readonly form = this.fb.group({
    property_id: [null as number | null, Validators.required],
    category: [ExpenseCategory.MAINTENANCE as string, Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    date: ['', Validators.required],
    vendor_id: [null as number | null],
    description: [''],
    receipt_url: [''],
  });

  readonly totalIncome = computed(() =>
    this.monthlyBalance().reduce((sum, month) => sum + month.income, 0),
  );
  readonly totalExpenses = computed(() =>
    this.monthlyBalance().reduce((sum, month) => sum + month.expenses, 0),
  );
  readonly netResult = computed(() => this.totalIncome() - this.totalExpenses());

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
    this.filterForm.reset({ property_id: null, category: '', from: '', to: '' });
    this.load();
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({
      category: ExpenseCategory.MAINTENANCE,
      date: toDateOnly(new Date()),
    });
    this.dialogOpen.set(true);
  }

  openEdit(expense: Expense): void {
    this.editingId.set(expense.id);
    this.form.reset({
      property_id: expense.property_id,
      category: expense.category,
      amount: expense.amount,
      date: expense.date?.slice(0, 10) ?? '',
      vendor_id: expense.vendor_id ?? null,
      description: expense.description ?? '',
      receipt_url: expense.receipt_url ?? '',
    });
    this.dialogOpen.set(true);
  }

  closeDialog(): void {
    this.dialogOpen.set(false);
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

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogOpen.set(false);
        this.toast.success(
          this.transloco.translate(id ? 'accounting.updated' : 'accounting.created'),
        );
        this.load();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.toast.error(getApiErrorMessage(err, this.transloco.translate('accounting.saveError')));
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
    const header = ['Fecha', 'Categoría', 'Monto', 'Moneda', 'Proveedor', 'Descripción'];
    const lines = rows.map((expense) =>
      [
        expense.date,
        this.transloco.translate(`accounting.category.${expense.category}`),
        expense.amount,
        expense.currency,
        expense.vendor_name ?? '',
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

  private buildDto(): CreateExpenseDto {
    const raw = this.form.getRawValue();
    const vendorName = this.vendorOptions().find((vendor) => vendor.value === raw.vendor_id)?.label;
    return {
      property_id: raw.property_id!,
      category: raw.category!,
      amount: raw.amount!,
      date: raw.date!,
      vendor_id: raw.vendor_id ?? undefined,
      vendor_name: vendorName,
      description: raw.description || undefined,
      receipt_url: raw.receipt_url || undefined,
    };
  }

  private monthLabel(month: string): string {
    const [year, monthNumber] = month.split('-');
    const date = new Date(Number(year), Number(monthNumber) - 1, 1);
    return date.toLocaleDateString(this.transloco.getActiveLang(), { month: 'short' });
  }
}
