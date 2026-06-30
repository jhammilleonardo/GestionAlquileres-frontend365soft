import { Injectable, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
import { Banknote, CircleDollarSign, ReceiptText, TrendingDown, TrendingUp } from 'lucide-angular';

import { AccountingService } from '../../core/services/admin/accounting.service';
import {
  AccountingDashboard,
  AccountingBankAccountSummary,
  AccountingBankTransaction,
  AccountingOwnerStatement,
  AccountingPayable,
  AdminPaymentLedger,
  ChartAccount,
  CreateJournalEntry,
  FinancialIntegrityIssue,
  FinancialIntegrityReport,
  FinancialIntegrityRemediationResult,
  JournalEntryView,
  LongTermLedger,
  StatementLine,
  ShortTermReservationLedger,
  TrialBalanceRow,
} from '../../core/models/accounting.model';
import { QueryParams } from '../../core/http/api-client.service';
import type { AppSegmentedControlOption } from '../../shared/ui/segmented-control/segmented-control.component';
import { AppTableColumn } from '../../shared/ui/table/table.component';
import { AppStatusTone } from '../../shared/ui/status-badge/status-badge.component';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { getApiErrorMessage } from '../../core/http/http-error.util';
import { TranslocoService } from '@jsverse/transloco';
import { FormatService } from '../../core/services/format.service';

export type AccountingView =
  | 'dashboard'
  | 'integrity'
  | 'banks'
  | 'trial-balance'
  | 'balance-sheet'
  | 'income-statement'
  | 'chart'
  | 'journal';

interface DashboardMetric {
  label: string;
  value: string;
  detail: string;
  tone: AppStatusTone;
  icon: typeof CircleDollarSign;
}

interface ReceivableRow {
  [key: string]: unknown;
  key: string;
  source: string;
  tenant: string;
  property: string;
  due: number;
  overdue: string;
  status: string;
  currency: string;
}

interface PayableRow {
  [key: string]: unknown;
  id: number;
  vendor: string;
  property: string;
  category: string;
  dueDate: string;
  amount: number;
  currency: string;
}

interface OwnerStatementRow {
  [key: string]: unknown;
  id: number;
  owner: string;
  property: string;
  period: string;
  gross: number;
  deductions: number;
  net: number;
  status: string;
  currency: string;
}

interface BankAccountRow {
  [key: string]: unknown;
  id: number;
  account: string;
  bank: string;
  glAccount: string;
  balance: number;
  imported: number;
  lastReconciled: string;
  currency: string;
}

interface BankTransactionRow {
  [key: string]: unknown;
  id: number;
  account: string;
  bank: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
}

/**
 * Estado y lógica de la pantalla de contabilidad: carga de datos (dashboard,
 * reportes, conciliación, integridad), derivaciones para las tablas y acciones
 * (asiento manual, remediación). El componente solo presenta; aquí vive todo lo
 * demás (patrón facade, igual que en `vendors`). Mantiene SRP en la pantalla.
 */
@Injectable()
export class ContabilidadFacade {
  private readonly accounting = inject(AccountingService);
  private readonly transloco = inject(TranslocoService);
  private readonly format = inject(FormatService);
  private readonly toast = inject(ToastService);

  readonly view = signal<AccountingView>('dashboard');
  readonly fromInput = signal('');
  readonly toInput = signal('');
  readonly filters = signal<{ from: string; to: string }>({ from: '', to: '' });
  readonly integrityRefresh = signal(0);
  readonly bankRefresh = signal(0);
  readonly remediationLoading = signal(false);
  readonly remediationResult = signal<FinancialIntegrityRemediationResult | null>(null);
  readonly remediationError = signal<string | null>(null);
  readonly expenseRemediationLoading = signal(false);
  readonly expenseRemediationResult = signal<FinancialIntegrityRemediationResult | null>(null);
  readonly expenseRemediationError = signal<string | null>(null);

  readonly viewOptions = (): AppSegmentedControlOption<AccountingView>[] => [
    { value: 'dashboard', label: this.t('accounting.views.dashboard') },
    { value: 'integrity', label: this.t('accounting.views.integrity') },
    { value: 'banks', label: this.t('accounting.views.banks') },
    { value: 'trial-balance', label: this.t('accounting.views.trialBalance') },
    { value: 'balance-sheet', label: this.t('accounting.views.balanceSheet') },
    {
      value: 'income-statement',
      label: this.t('accounting.views.incomeStatement'),
    },
    { value: 'chart', label: this.t('accounting.views.chart') },
    { value: 'journal', label: this.t('accounting.views.journal') },
  ];

  readonly reportParams = computed<QueryParams>(() => this.cleanParams(this.filters()));
  readonly balanceSheetParams = computed<QueryParams>(() => {
    const to = this.filters().to;
    return to ? { asOf: to } : {};
  });

  readonly trialBalance = toSignal(
    toObservable(this.reportParams).pipe(
      switchMap((params) =>
        this.accounting.getTrialBalance(params).pipe(catchError(() => of(null))),
      ),
    ),
  );
  readonly balanceSheet = toSignal(
    toObservable(this.balanceSheetParams).pipe(
      switchMap((params) =>
        this.accounting.getBalanceSheet(params).pipe(catchError(() => of(null))),
      ),
    ),
  );
  readonly incomeStatement = toSignal(
    toObservable(this.reportParams).pipe(
      switchMap((params) =>
        this.accounting.getIncomeStatement(params).pipe(catchError(() => of(null))),
      ),
    ),
  );
  readonly chart = toSignal(this.accounting.getChartOfAccounts().pipe(catchError(() => of(null))));
  readonly journalRefresh = signal(0);
  private readonly journalTrigger = computed(() => {
    this.journalRefresh();
    return this.reportParams();
  });
  readonly journal = toSignal(
    toObservable(this.journalTrigger).pipe(
      switchMap((params) =>
        this.accounting
          .getJournalEntries({ ...params, limit: 50 })
          .pipe(catchError(() => of(null))),
      ),
    ),
  );
  readonly dashboard = toSignal<AccountingDashboard | null | undefined>(
    toObservable(this.reportParams).pipe(
      switchMap((params) => this.accounting.getDashboard(params).pipe(catchError(() => of(null)))),
    ),
  );
  readonly integrity = toSignal<FinancialIntegrityReport | null | undefined>(
    toObservable(this.integrityRefresh).pipe(
      switchMap(() => this.accounting.getFinancialIntegrity().pipe(catchError(() => of(null)))),
    ),
  );
  readonly openBankTransactions = toSignal<AccountingBankTransaction[] | null | undefined>(
    toObservable(this.bankRefresh).pipe(
      switchMap(() =>
        this.accounting.getOpenBankTransactions({ limit: 50 }).pipe(catchError(() => of(null))),
      ),
    ),
  );
  readonly dashboardLedger = computed<AdminPaymentLedger | null>(
    () => this.dashboard()?.payment_ledger ?? null,
  );
  readonly integrityIssues = computed<FinancialIntegrityIssue[]>(
    () => this.integrity()?.issues ?? [],
  );
  readonly integrityErrors = computed(
    () => this.integrityIssues().filter((issue) => issue.severity === 'error').length,
  );
  readonly integrityWarnings = computed(
    () => this.integrityIssues().filter((issue) => issue.severity === 'warning').length,
  );
  readonly hasUnpostedPaymentIssue = computed(() =>
    this.integrityIssues().some((issue) => issue.code === 'approved_payments_not_posted'),
  );
  readonly hasUnpostedExpenseIssue = computed(() =>
    this.integrityIssues().some((issue) =>
      ['expenses_not_posted', 'expense_payments_not_posted'].includes(issue.code),
    ),
  );

  readonly journalEntries = computed<JournalEntryView[]>(() => this.journal()?.data ?? []);
  readonly receivables = computed<ReceivableRow[]>(() => {
    const ledger = this.dashboardLedger();
    if (!ledger) return [];

    const longTerm = ledger.long_term
      .filter((item) => item.total_debt > 0 || item.total_pending_review > 0)
      .map((item) => this.longTermReceivable(item));
    const shortTerm = ledger.short_term
      .filter((item) => item.balance_due > 0 || item.pending_review > 0)
      .map((item) => this.shortTermReceivable(item));

    return [...longTerm, ...shortTerm].sort((a, b) => b.due - a.due).slice(0, 10);
  });
  readonly payables = computed<PayableRow[]>(() =>
    (this.dashboard()?.payables.data ?? []).map((expense) => this.payableRow(expense)),
  );
  readonly totalPayables = computed(() => this.dashboard()?.payables.total ?? 0);
  readonly ownerStatements = computed<OwnerStatementRow[]>(() =>
    (this.dashboard()?.owners.data ?? []).map((statement) => this.ownerStatementRow(statement)),
  );
  readonly bankAccounts = computed<BankAccountRow[]>(() =>
    (this.dashboard()?.banks.data ?? []).map((account) => this.bankAccountRow(account)),
  );
  readonly bankTransactionRows = computed<BankTransactionRow[]>(() =>
    (this.openBankTransactions() ?? []).map((transaction) => this.bankTransactionRow(transaction)),
  );
  readonly cashPosition = computed(() => {
    const assets = this.dashboardBalanceSheet()?.assets ?? [];
    const cashAccounts = assets.filter((line) => this.isCashAccount(line));
    const relevant = cashAccounts.length > 0 ? cashAccounts : assets;
    return relevant.reduce((sum, line) => sum + line.amount, 0);
  });
  readonly dashboardTrialBalance = computed(() => this.dashboard()?.reports.trial_balance ?? null);
  readonly dashboardBalanceSheet = computed(() => this.dashboard()?.reports.balance_sheet ?? null);
  readonly dashboardIncomeStatement = computed(
    () => this.dashboard()?.reports.income_statement ?? null,
  );
  readonly dashboardMetrics = computed<DashboardMetric[]>(() => {
    const income = this.dashboardIncomeStatement();
    const ledger = this.dashboardLedger();
    const balance = this.dashboardBalanceSheet();
    const netIncome = income?.net_income ?? 0;
    const receivable = ledger?.summary.total_receivable ?? 0;
    const payable = this.totalPayables();

    return [
      {
        label: this.t('accounting.dashboard.cash'),
        value: this.money(this.cashPosition()),
        detail: this.t('accounting.dashboard.cashDetail'),
        tone: this.cashPosition() >= 0 ? 'success' : 'danger',
        icon: Banknote,
      },
      {
        label: this.t('accounting.dashboard.receivable'),
        value: this.money(receivable),
        detail: this.t('accounting.dashboard.receivableDetail'),
        tone: receivable > 0 ? 'warning' : 'success',
        icon: CircleDollarSign,
      },
      {
        label: this.t('accounting.dashboard.payable'),
        value: this.money(payable),
        detail: this.t('accounting.dashboard.payableDetail'),
        tone: payable > 0 ? 'warning' : 'success',
        icon: ReceiptText,
      },
      {
        label: this.t('accounting.dashboard.netIncome'),
        value: this.money(netIncome),
        detail: balance?.balanced
          ? this.t('accounting.dashboard.booksBalanced')
          : this.t('accounting.dashboard.booksUnbalanced'),
        tone: !balance?.balanced ? 'danger' : netIncome >= 0 ? 'success' : 'warning',
        icon: netIncome >= 0 ? TrendingUp : TrendingDown,
      },
    ];
  });

  readonly trialBalanceColumns: AppTableColumn<TrialBalanceRow>[] = [
    { key: 'code', label: this.t('accounting.cols.code') },
    { key: 'name', label: this.t('accounting.cols.account') },
    {
      key: 'debit',
      label: this.t('accounting.cols.debit'),
      align: 'right',
      formatter: (row) => this.money(row.debit),
    },
    {
      key: 'credit',
      label: this.t('accounting.cols.credit'),
      align: 'right',
      formatter: (row) => this.money(row.credit),
    },
  ];

  readonly statementColumns: AppTableColumn<StatementLine>[] = [
    { key: 'code', label: this.t('accounting.cols.code') },
    { key: 'name', label: this.t('accounting.cols.account') },
    {
      key: 'amount',
      label: this.t('accounting.cols.amount'),
      align: 'right',
      formatter: (row) => this.money(row.amount),
    },
  ];

  readonly chartColumns: AppTableColumn<ChartAccount>[] = [
    { key: 'code', label: this.t('accounting.cols.code') },
    { key: 'name', label: this.t('accounting.cols.account') },
    {
      key: 'type',
      label: this.t('accounting.cols.type'),
      formatter: (row) => this.t('accounting.types.' + row.type),
    },
  ];

  readonly journalColumns: AppTableColumn<JournalEntryView>[] = [
    { key: 'entry_number', label: this.t('accounting.cols.entryNumber') },
    { key: 'entry_date', label: this.t('accounting.cols.date') },
    { key: 'description', label: this.t('accounting.cols.description') },
  ];

  readonly receivableColumns: AppTableColumn<ReceivableRow>[] = [
    { key: 'source', label: this.t('accounting.cols.source') },
    { key: 'tenant', label: this.t('accounting.cols.tenant') },
    { key: 'property', label: this.t('accounting.cols.property') },
    {
      key: 'due',
      label: this.t('accounting.cols.balanceDue'),
      align: 'right',
      formatter: (row) => this.money(row.due, row.currency),
    },
    { key: 'overdue', label: this.t('accounting.cols.overdue') },
    { key: 'status', label: this.t('accounting.cols.status') },
  ];

  readonly payableColumns: AppTableColumn<PayableRow>[] = [
    { key: 'vendor', label: this.t('accounting.cols.vendor') },
    { key: 'property', label: this.t('accounting.cols.property') },
    { key: 'category', label: this.t('accounting.cols.category') },
    { key: 'dueDate', label: this.t('accounting.cols.date') },
    {
      key: 'amount',
      label: this.t('accounting.cols.amount'),
      align: 'right',
      formatter: (row) => this.money(row.amount, row.currency),
    },
  ];

  readonly ownerStatementColumns: AppTableColumn<OwnerStatementRow>[] = [
    { key: 'owner', label: this.t('accounting.cols.owner') },
    { key: 'property', label: this.t('accounting.cols.property') },
    { key: 'period', label: this.t('accounting.cols.period') },
    {
      key: 'gross',
      label: this.t('accounting.cols.gross'),
      align: 'right',
      formatter: (row) => this.money(row.gross, row.currency),
    },
    {
      key: 'deductions',
      label: this.t('accounting.cols.deductions'),
      align: 'right',
      formatter: (row) => this.money(row.deductions, row.currency),
    },
    {
      key: 'net',
      label: this.t('accounting.cols.net'),
      align: 'right',
      formatter: (row) => this.money(row.net, row.currency),
    },
    { key: 'status', label: this.t('accounting.cols.status') },
  ];

  readonly bankColumns: AppTableColumn<BankAccountRow>[] = [
    { key: 'account', label: this.t('accounting.cols.bankAccount') },
    { key: 'bank', label: this.t('accounting.cols.bank') },
    { key: 'glAccount', label: this.t('accounting.cols.glAccount') },
    {
      key: 'balance',
      label: this.t('accounting.cols.bookBalance'),
      align: 'right',
      formatter: (row) => this.money(row.balance, row.currency),
    },
    { key: 'imported', label: this.t('accounting.cols.unreconciled'), align: 'right' },
    { key: 'lastReconciled', label: this.t('accounting.cols.lastReconciled') },
  ];

  readonly bankTransactionColumns: AppTableColumn<BankTransactionRow>[] = [
    { key: 'account', label: this.t('accounting.cols.bankAccount') },
    { key: 'bank', label: this.t('accounting.cols.bank') },
    { key: 'date', label: this.t('accounting.cols.date') },
    { key: 'description', label: this.t('accounting.cols.description') },
    {
      key: 'amount',
      label: this.t('accounting.cols.amount'),
      align: 'right',
      formatter: (row) => this.money(row.amount, row.currency),
    },
    { key: 'status', label: this.t('accounting.cols.status') },
  ];

  // ─── Asiento manual (GJE) ───────────────────────────────────────────────
  readonly journalDialogOpen = signal(false);
  readonly postingEntry = signal(false);
  readonly chartAccounts = computed<ChartAccount[]>(() => this.chart() ?? []);

  onViewChange(value: AccountingView | null): void {
    this.view.set(value ?? 'trial-balance');
  }

  openJournalDialog(): void {
    this.journalDialogOpen.set(true);
  }

  closeJournalDialog(): void {
    this.journalDialogOpen.set(false);
  }

  postJournalEntry(dto: CreateJournalEntry): void {
    if (this.postingEntry()) return;
    this.postingEntry.set(true);
    this.accounting.createJournalEntry(dto).subscribe({
      next: (entry) => {
        this.postingEntry.set(false);
        this.journalDialogOpen.set(false);
        this.toast.success(
          this.transloco.translate('accounting.journalEntry.posted', {
            number: entry.entryNumber,
          }),
        );
        // Refrescar diario y reportes derivados del nuevo asiento.
        this.journalRefresh.update((v) => v + 1);
      },
      error: (err: unknown) => {
        this.postingEntry.set(false);
        this.toast.error(
          getApiErrorMessage(err, this.transloco.translate('accounting.journalEntry.postError')),
        );
      },
    });
  }

  applyFilters(): void {
    this.filters.set({ from: this.fromInput(), to: this.toInput() });
  }

  clearFilters(): void {
    this.fromInput.set('');
    this.toInput.set('');
    this.filters.set({ from: '', to: '' });
  }

  reprocessPaymentPostings(): void {
    if (this.remediationLoading()) return;

    this.remediationLoading.set(true);
    this.remediationError.set(null);
    this.remediationResult.set(null);

    this.accounting.reprocessApprovedPaymentPostings().subscribe({
      next: (result) => {
        this.remediationResult.set(result);
        this.remediationLoading.set(false);
        this.integrityRefresh.update((value) => value + 1);
      },
      error: (error: unknown) => {
        this.remediationError.set(error instanceof Error ? error.message : String(error));
        this.remediationLoading.set(false);
      },
    });
  }

  reprocessExpensePostings(): void {
    if (this.expenseRemediationLoading()) return;

    this.expenseRemediationLoading.set(true);
    this.expenseRemediationError.set(null);
    this.expenseRemediationResult.set(null);

    this.accounting.reprocessExpensePostings().subscribe({
      next: (result) => {
        this.expenseRemediationResult.set(result);
        this.expenseRemediationLoading.set(false);
        this.integrityRefresh.update((value) => value + 1);
      },
      error: (error: unknown) => {
        this.expenseRemediationError.set(error instanceof Error ? error.message : String(error));
        this.expenseRemediationLoading.set(false);
      },
    });
  }

  healthTone(): AppStatusTone {
    return this.dashboardTrialBalance()?.balanced && this.dashboardBalanceSheet()?.balanced
      ? 'success'
      : 'danger';
  }

  integrityTone(issue: FinancialIntegrityIssue): AppStatusTone {
    return issue.severity === 'error' ? 'danger' : 'warning';
  }

  integrityTitle(issue: FinancialIntegrityIssue): string {
    return this.transloco.translate(`accounting.integrity.codes.${issue.code}`);
  }

  samplePreview(row: Record<string, unknown>): string {
    return Object.entries(row)
      .slice(0, 6)
      .map(([key, value]) => `${key}: ${this.sampleValue(value)}`)
      .join(' · ');
  }

  private t(key: string): string {
    return this.transloco.translate(key);
  }

  private money(amount: number, currency?: string): string {
    return this.format.formatCurrency(amount, currency);
  }

  private sampleValue(value: unknown): string {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'number')
      return Number.isInteger(value) ? String(value) : value.toFixed(2);
    if (typeof value === 'string') return value;
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    return JSON.stringify(value) ?? '-';
  }

  private cleanParams(filters: { from: string; to: string }): QueryParams {
    return {
      ...(filters.from ? { from: filters.from } : {}),
      ...(filters.to ? { to: filters.to } : {}),
    };
  }

  private longTermReceivable(item: LongTermLedger): ReceivableRow {
    return {
      key: `contract-${item.contract_id}`,
      source: this.t('accounting.sources.longTerm'),
      tenant: item.tenant_name,
      property: item.property_name,
      due: item.total_debt,
      overdue:
        item.overdue_months > 0
          ? this.transloco.translate('accounting.dashboard.monthsOverdue', {
              count: item.overdue_months,
            })
          : this.t('accounting.dashboard.current'),
      status:
        item.total_pending_review > 0
          ? this.t('accounting.dashboard.pendingReview')
          : this.t('accounting.dashboard.open'),
      currency: item.currency,
    };
  }

  private shortTermReceivable(item: ShortTermReservationLedger): ReceivableRow {
    return {
      key: `reservation-${item.reservation_id}`,
      source: this.t('accounting.sources.shortTerm'),
      tenant: item.tenant_name,
      property: item.property_name,
      due: item.balance_due,
      overdue:
        item.days_to_checkin < 0 && item.balance_due > 0
          ? this.t('accounting.dashboard.checkoutDebt')
          : this.format.formatDate(item.checkin_date),
      status:
        item.pending_review > 0
          ? this.t('accounting.dashboard.pendingReview')
          : this.t(`accounting.reservationAlerts.${item.alert}`),
      currency: item.currency,
    };
  }

  private payableRow(expense: AccountingPayable): PayableRow {
    return {
      id: expense.id,
      vendor: expense.vendor_name || this.t('accounting.dashboard.unassignedVendor'),
      property: expense.property_name || this.t('accounting.dashboard.unassignedProperty'),
      category: expense.category,
      dueDate: this.format.formatDate(expense.due_date),
      amount: Number(expense.amount) || 0,
      currency: expense.currency,
    };
  }

  private ownerStatementRow(statement: AccountingOwnerStatement): OwnerStatementRow {
    return {
      id: statement.id,
      owner: statement.owner_name || this.t('accounting.dashboard.unassignedOwner'),
      property: statement.property_name || this.t('accounting.dashboard.unassignedProperty'),
      period: `${String(statement.period_month).padStart(2, '0')}/${statement.period_year}`,
      gross: statement.gross_rent,
      deductions: statement.maintenance_deduction + statement.management_commission,
      net: statement.net_amount,
      status: this.t(`accounting.ownerStatuses.${statement.status}`),
      currency: statement.currency,
    };
  }

  private bankAccountRow(account: AccountingBankAccountSummary): BankAccountRow {
    return {
      id: account.id,
      account: account.name,
      bank: account.bank_name || this.t('accounting.dashboard.unassignedBank'),
      glAccount: `${account.gl_account_code} · ${account.gl_account_name}`,
      balance: account.book_balance,
      imported: account.imported_transactions,
      lastReconciled: account.last_reconciled_at
        ? this.format.formatDateTime(account.last_reconciled_at)
        : this.t('accounting.dashboard.neverReconciled'),
      currency: account.currency,
    };
  }

  private bankTransactionRow(transaction: AccountingBankTransaction): BankTransactionRow {
    return {
      id: transaction.id,
      account: transaction.bank_account_name,
      bank: transaction.bank_name || this.t('accounting.dashboard.unassignedBank'),
      date: this.format.formatDate(transaction.transaction_date),
      description: transaction.description,
      amount: transaction.amount,
      currency: transaction.currency,
      status: this.t(`accounting.bankStatuses.${transaction.status}`),
    };
  }

  private isCashAccount(line: StatementLine): boolean {
    const value = `${line.code} ${line.name}`.toLowerCase();
    return (
      value.startsWith('11') ||
      value.includes('efectivo') ||
      value.includes('banco') ||
      value.includes('cash') ||
      value.includes('bank')
    );
  }
}
