export enum ExpenseCategory {
  MAINTENANCE = 'MAINTENANCE',
  REPAIRS = 'REPAIRS',
  INSURANCE = 'INSURANCE',
  TAX = 'TAX',
  UTILITIES = 'UTILITIES',
  MANAGEMENT_FEE = 'MANAGEMENT_FEE',
  CLEANING = 'CLEANING',
  SUPPLIES = 'SUPPLIES',
  LAUNDRY = 'LAUNDRY',
  PLATFORM_FEE = 'PLATFORM_FEE',
  BANK_FEE = 'BANK_FEE',
  LEGAL = 'LEGAL',
  OTHER = 'OTHER',
}

export enum ExpenseScope {
  GENERAL = 'GENERAL',
  LONG_TERM = 'LONG_TERM',
  SHORT_TERM = 'SHORT_TERM',
}

export enum ExpenseResponsibility {
  COMPANY = 'COMPANY',
  OWNER = 'OWNER',
  TENANT = 'TENANT',
  GUEST = 'GUEST',
}

export enum ExpensePaymentStatus {
  PAID = 'PAID',
  PENDING = 'PENDING',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  REIMBURSED = 'REIMBURSED',
}

export interface Expense {
  id: number;
  property_id: number;
  property?: { id: number; title: string } | null;
  unit_id?: number | null;
  category: string;
  expense_scope?: ExpenseScope | string;
  responsibility?: ExpenseResponsibility | string;
  payment_status?: ExpensePaymentStatus | string;
  amount: number;
  paid_amount?: number;
  currency: string;
  description?: string | null;
  date: string;
  due_date?: string | null;
  paid_date?: string | null;
  vendor_id?: number | null;
  vendor_name?: string | null;
  receipt_url?: string | null;
  invoice_number?: string | null;
  contract_id?: number | null;
  reservation_id?: number | null;
  maintenance_request_id?: number | null;
  affects_owner_statement?: boolean;
  is_reimbursable?: boolean;
  is_recurring?: boolean;
  notes?: string | null;
}

export interface CreateExpenseDto {
  property_id: number;
  unit_id?: number;
  category: string;
  expense_scope?: ExpenseScope | string;
  responsibility?: ExpenseResponsibility | string;
  payment_status?: ExpensePaymentStatus | string;
  amount: number;
  currency?: string;
  description?: string;
  date: string;
  due_date?: string;
  paid_date?: string;
  vendor_id?: number;
  vendor_name?: string;
  receipt_url?: string;
  invoice_number?: string;
  contract_id?: number;
  reservation_id?: number;
  maintenance_request_id?: number;
  affects_owner_statement?: boolean;
  is_reimbursable?: boolean;
  is_recurring?: boolean;
  notes?: string;
}

export type UpdateExpenseDto = Partial<Omit<CreateExpenseDto, 'is_recurring'>>;

export interface CreateExpensePaymentDto {
  amount: number;
  currency?: string;
  payment_date: string;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
}

export interface PaginatedExpenses {
  data: Expense[];
  total: number;
}

export interface MonthlyBalancePoint {
  month: string;
  income: number;
  expenses: number;
}
