export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';

/** Línea de un asiento manual (debe O haber sobre una cuenta del plan). */
export interface CreateJournalEntryLine {
  accountCode: string;
  debit?: number;
  credit?: number;
  memo?: string;
}

/** Asiento contable manual (General Journal Entry). */
export interface CreateJournalEntry {
  entryDate: string;
  description: string;
  basis?: 'cash' | 'accrual';
  lines: CreateJournalEntryLine[];
}

/** Resultado del posteo de un asiento. */
export interface PostedJournalEntry {
  id: number;
  entryNumber: string;
}

export interface ChartAccount {
  // Índice `unknown` para ser compatible con AppTableComponent<Record<...>>.
  [key: string]: unknown;
  id: number;
  code: string;
  name: string;
  type: AccountType;
  parent_id: number | null;
  is_system: boolean;
  is_active: boolean;
}

export interface JournalLineView {
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  memo: string | null;
}

export interface JournalEntryView {
  [key: string]: unknown;
  id: number;
  entry_number: string;
  entry_date: string;
  description: string;
  source_module: string | null;
  source_id: string | null;
  status: string;
  basis: string;
  lines: JournalLineView[];
}

export interface PaginatedJournalEntries {
  data: JournalEntryView[];
  total: number;
  limit: number;
  offset: number;
}

export interface TrialBalanceRow {
  [key: string]: unknown;
  code: string;
  name: string;
  type: AccountType;
  debit: number;
  credit: number;
}

export interface TrialBalance {
  from: string | null;
  to: string | null;
  rows: TrialBalanceRow[];
  total_debit: number;
  total_credit: number;
  balanced: boolean;
}

export interface StatementLine {
  [key: string]: unknown;
  code: string;
  name: string;
  amount: number;
}

export interface BalanceSheet {
  as_of: string;
  assets: StatementLine[];
  liabilities: StatementLine[];
  equity: StatementLine[];
  total_assets: number;
  total_liabilities: number;
  total_equity: number;
  net_income: number;
  balanced: boolean;
}

export interface IncomeStatement {
  from: string | null;
  to: string | null;
  income: StatementLine[];
  expenses: StatementLine[];
  total_income: number;
  total_expenses: number;
  net_income: number;
}

export interface LongTermLedgerMonth {
  label: string;
  due_date: string;
  rent_amount: number;
  paid_rent: number;
  pending_review: number;
  late_fee: number;
  outstanding_rent: number;
  total_due: number;
  days_overdue: number;
  status: string;
}

export interface LongTermLedger {
  contract_id: number;
  contract_number: string;
  tenant_id: number;
  tenant_name: string;
  property_id: number;
  property_name: string;
  start_date: string;
  end_date: string;
  duration_months: number;
  elapsed_months: number;
  paid_months: number;
  overdue_months: number;
  monthly_rent: number;
  currency: string;
  payment_day: number;
  grace_days: number;
  late_fee_percentage: number;
  total_paid_rent: number;
  total_pending_review: number;
  base_debt: number;
  late_fee_debt: number;
  total_debt: number;
  months: LongTermLedgerMonth[];
}

export interface ShortTermReservationLedger {
  reservation_id: number;
  tenant_id: number;
  tenant_name: string;
  property_id: number;
  property_name: string;
  unit_number: string | null;
  checkin_date: string;
  checkout_date: string;
  nights: number;
  status: string;
  total_amount: number;
  deposit_required: number;
  paid_amount: number;
  pending_review: number;
  refunded_amount: number;
  balance_due: number;
  deposit_due: number;
  cleaning_fee: number;
  security_deposit: number;
  currency: string;
  alert: string;
  days_to_checkin: number;
}

export interface PaymentLedgerAlert {
  scope: 'long_term' | 'short_term';
  severity: 'info' | 'warning' | 'danger';
  message: string;
  amount?: number;
  entity_id?: number;
}

export interface AdminPaymentLedger {
  generated_at: string;
  summary: {
    long_term_contracts: number;
    long_term_debt: number;
    long_term_overdue_months: number;
    short_term_reservations: number;
    short_term_balance_due: number;
    short_term_pending_review: number;
    total_receivable: number;
  };
  long_term: LongTermLedger[];
  short_term: ShortTermReservationLedger[];
  alerts: PaymentLedgerAlert[];
}

export interface AccountingTenantProfile {
  country: string;
  currency: string;
  rental_type: string;
  occupancy_tax_pct: number;
  accounting_basis: string;
  tax_id: string | null;
  legal_name: string | null;
  tax_regime: string | null;
}

export interface AccountingTaxProfile {
  country: string;
  tax_id_label: string;
  tax_id: string | null;
  legal_name: string | null;
  accounting_basis: string;
  required_reports: string[];
  operational_notes: string[];
}

export interface AccountingPayable {
  [key: string]: unknown;
  id: number;
  vendor_name: string | null;
  property_id: number;
  property_name: string | null;
  category: string;
  due_date: string;
  amount: number;
  currency: string;
  invoice_number: string | null;
}

export interface AccountingOwnerStatement {
  [key: string]: unknown;
  id: number;
  rental_owner_id: number;
  owner_name: string | null;
  property_id: number;
  property_name: string | null;
  period_month: number;
  period_year: number;
  gross_rent: number;
  maintenance_deduction: number;
  management_commission: number;
  net_amount: number;
  currency: string;
  status: string;
  transferred_at: string | null;
}

export interface AccountingBankAccountSummary {
  [key: string]: unknown;
  id: number;
  name: string;
  bank_name: string | null;
  currency: string;
  gl_account_code: string;
  gl_account_name: string;
  book_balance: number;
  imported_transactions: number;
  matched_transactions: number;
  last_reconciled_at: string | null;
}

export interface AccountingBankTransaction {
  [key: string]: unknown;
  id: number;
  bank_account_id: number;
  bank_account_name: string;
  bank_name: string | null;
  transaction_date: string;
  description: string;
  amount: number;
  currency: string;
  external_id: string | null;
  status: string;
}

export interface AccountingBankMatchCandidate {
  [key: string]: unknown;
  journal_line_id: number;
  journal_entry_id: number;
  entry_number: string;
  entry_date: string;
  description: string;
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  amount: number;
  days_distance: number;
}

export interface AccountingBankMatchResult {
  matched: true;
}

export interface AccountingDashboard {
  generated_at: string;
  profile: AccountingTenantProfile;
  reports: {
    trial_balance: TrialBalance;
    balance_sheet: BalanceSheet;
    income_statement: IncomeStatement;
  };
  payment_ledger: AdminPaymentLedger;
  payables: {
    total: number;
    count: number;
    data: AccountingPayable[];
  };
  owners: {
    pending_total: number;
    transferred_total: number;
    statement_count: number;
    data: AccountingOwnerStatement[];
  };
  banks: {
    account_count: number;
    total_book_balance: number;
    unreconciled_transactions: number;
    data: AccountingBankAccountSummary[];
  };
  tax_profile: AccountingTaxProfile;
}

export type FinancialIntegritySeverity = 'error' | 'warning';

export interface FinancialIntegrityIssue {
  code: string;
  severity: FinancialIntegritySeverity;
  description: string;
  count: number;
  sample: Record<string, unknown>[];
}

export interface FinancialIntegrityReport {
  generated_at: string;
  ok: boolean;
  issue_count: number;
  issues: FinancialIntegrityIssue[];
}

export interface FinancialIntegrityRemediationResult {
  generated_at: string;
  enqueued_payments: number;
  enqueued_expenses: number;
  enqueued_expense_payments: number;
  processed_events: number;
  report: FinancialIntegrityReport;
}
