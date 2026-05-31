export enum ExpenseCategory {
  MAINTENANCE = 'MAINTENANCE',
  INSURANCE = 'INSURANCE',
  TAX = 'TAX',
  UTILITIES = 'UTILITIES',
  MANAGEMENT_FEE = 'MANAGEMENT_FEE',
  CLEANING = 'CLEANING',
  OTHER = 'OTHER',
}

export interface Expense {
  id: number;
  property_id: number;
  property?: { id: number; title: string } | null;
  unit_id?: number | null;
  category: string;
  amount: number;
  currency: string;
  description?: string | null;
  date: string;
  vendor_id?: number | null;
  vendor_name?: string | null;
  receipt_url?: string | null;
  is_recurring?: boolean;
}

export interface CreateExpenseDto {
  property_id: number;
  unit_id?: number;
  category: string;
  amount: number;
  currency?: string;
  description?: string;
  date: string;
  vendor_id?: number;
  vendor_name?: string;
  receipt_url?: string;
  is_recurring?: boolean;
}

export type UpdateExpenseDto = Partial<Omit<CreateExpenseDto, 'is_recurring'>>;

export interface PaginatedExpenses {
  data: Expense[];
  total: number;
}

export interface MonthlyBalancePoint {
  month: string;
  income: number;
  expenses: number;
}
