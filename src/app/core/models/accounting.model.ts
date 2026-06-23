export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';

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
