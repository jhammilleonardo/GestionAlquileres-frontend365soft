import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { TranslocoModule, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import {
  LucideAngularModule,
  Plus,
  Pencil,
  Trash2,
  Download,
  Receipt,
  TrendingUp,
  TrendingDown,
} from 'lucide-angular';

import { ExpenseService } from '../../core/services/admin/expense.service';
import { VendorService } from '../../core/services/admin/vendor.service';
import { PropertyService } from '../../core/services/admin/property.service';
import {
  CreateExpenseDto,
  Expense,
  ExpenseCategory,
  MonthlyBalancePoint,
} from '../../core/models/expense.model';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { AppDialogComponent } from '../../shared/ui/dialog/dialog.component';
import { AppTextFieldComponent } from '../../shared/ui/text-field/text-field.component';
import { AppTextareaComponent } from '../../shared/ui/textarea/textarea.component';
import { AppSelectComponent, AppSelectOption } from '../../shared/ui/select/select.component';
import { AppDatePickerComponent } from '../../shared/ui/date-picker/date-picker.component';
import { AppLoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { AppEmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AppPageHeaderComponent } from '../../shared/ui/page-header/page-header.component';

import { getApiErrorMessage } from '../../core/http/http-error.util';
interface ChartBar {
  readonly label: string;
  readonly income: number;
  readonly expenses: number;
  readonly incomeHeight: number;
  readonly expenseHeight: number;
}

@Component({
  selector: 'app-expenses',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    TranslocoModule,
    LucideAngularModule,
    AppButtonComponent,
    AppDialogComponent,
    AppTextFieldComponent,
    AppTextareaComponent,
    AppSelectComponent,
    AppDatePickerComponent,
    AppLoadingStateComponent,
    AppEmptyStateComponent,
    AppPageHeaderComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'contabilidad', alias: 'accounting' })],
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.scss',
})
export class ExpensesComponent {
  readonly Plus = Plus;
  readonly Pencil = Pencil;
  readonly Trash2 = Trash2;
  readonly Download = Download;
  readonly Receipt = Receipt;
  readonly TrendingUp = TrendingUp;
  readonly TrendingDown = TrendingDown;

  private readonly fb = inject(FormBuilder);
  private readonly expenseService = inject(ExpenseService);
  private readonly vendorService = inject(VendorService);
  private readonly propertyService = inject(PropertyService);
  private readonly confirmDialog = inject(ConfirmDialogService);
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

  // Balance del período visible (suma de los 6 meses del gráfico)
  readonly totalIncome = computed(() =>
    this.monthlyBalance().reduce((sum, m) => sum + m.income, 0),
  );
  readonly totalExpenses = computed(() =>
    this.monthlyBalance().reduce((sum, m) => sum + m.expenses, 0),
  );
  readonly netResult = computed(() => this.totalIncome() - this.totalExpenses());

  // Barras del gráfico (altura relativa al máximo)
  readonly chartBars = computed<ChartBar[]>(() => {
    const data = this.monthlyBalance();
    const max = Math.max(1, ...data.map((m) => Math.max(m.income, m.expenses)));
    return data.map((m) => ({
      label: this.monthLabel(m.month),
      income: m.income,
      expenses: m.expenses,
      incomeHeight: Math.round((m.income / max) * 100),
      expenseHeight: Math.round((m.expenses / max) * 100),
    }));
  });

  constructor() {
    this.loadProperties();
    this.loadVendors();
    this.load();
  }

  private loadProperties(): void {
    this.propertyService.getAdminProperties().subscribe({
      next: (properties) =>
        this.propertyOptions.set(properties.map((p) => ({ value: p.id, label: p.title }))),
      error: () => this.propertyOptions.set([]),
    });
  }

  private loadVendors(): void {
    this.vendorService.list().subscribe({
      next: (vendors) =>
        this.vendorOptions.set(vendors.map((v) => ({ value: v.id, label: v.name }))),
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
      date: new Date().toISOString().slice(0, 10),
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
    const raw = this.form.getRawValue();
    const vendorName = this.vendorOptions().find((v) => v.value === raw.vendor_id)?.label;
    const dto: CreateExpenseDto = {
      property_id: raw.property_id!,
      category: raw.category!,
      amount: raw.amount!,
      date: raw.date!,
      vendor_id: raw.vendor_id ?? undefined,
      vendor_name: vendorName,
      description: raw.description || undefined,
      receipt_url: raw.receipt_url || undefined,
    };

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
      error: (err: { error?: { message?: string } }) => {
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
    const lines = rows.map((e) =>
      [
        e.date,
        this.transloco.translate(`accounting.category.${e.category}`),
        e.amount,
        e.currency,
        e.vendor_name ?? '',
        (e.description ?? '').replace(/"/g, '""'),
      ]
        .map((cell) => `"${cell}"`)
        .join(','),
    );
    const bom = String.fromCharCode(0xfeff);
    const csv = bom + [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gastos-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  categoryLabel(category: string): string {
    return this.transloco.translate(`accounting.category.${category}`);
  }

  private monthLabel(month: string): string {
    const [year, m] = month.split('-');
    const date = new Date(Number(year), Number(m) - 1, 1);
    return date.toLocaleDateString(this.transloco.getActiveLang(), { month: 'short' });
  }
}
