import { Currency, Payment, PaymentStatus, PaymentType } from '../../../core/models/payment.model';
import { Contract } from '../../../core/services/tenant/tenant-contract.service';

export interface PaymentScheduleItem {
  label: string;
  year: number;
  month: number;
  dueDate: Date;
  amount: number;
  currency: string;
  status: 'paid' | 'overdue' | 'current' | 'upcoming';
  statusLabel: string;
}

export interface TenantPaymentScheduleLabels {
  paid: string;
  current: string;
  overdue: string;
  upcoming: string;
}

export function buildTenantPaymentSchedule(params: {
  contract: Contract;
  existingPayments: readonly Payment[];
  locale: string;
  labels: TenantPaymentScheduleLabels;
  now?: Date;
}): PaymentScheduleItem[] {
  const { contract, existingPayments, labels, locale, now = new Date() } = params;
  const start = new Date(contract.start_date);
  const end = new Date(contract.end_date);
  const payDay = contract.payment_day || 1;
  const paidRentInstallments = existingPayments.filter(isAcceptedRentPayment).length;
  const items: PaymentScheduleItem[] = [];

  let assignedPaidInstallments = 0;
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  while (cursor <= endMonth) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const dueDate = new Date(year, month, Math.min(payDay, lastDay));
    const isPaid = assignedPaidInstallments < paidRentInstallments;

    if (isPaid) {
      assignedPaidInstallments += 1;
    }

    const status = resolveInstallmentStatus({
      dueDate,
      isPaid,
      month,
      now,
      year,
    });
    const raw = cursor.toLocaleDateString(locale, { month: 'short', year: 'numeric' });

    items.push({
      label: raw.charAt(0).toUpperCase() + raw.slice(1),
      year,
      month,
      dueDate,
      amount: toNumber(contract.monthly_rent) ?? 0,
      currency: contract.currency || Currency.USD,
      status,
      statusLabel: labels[status],
    });

    cursor = new Date(year, month + 1, 1);
  }

  return items;
}

function isAcceptedRentPayment(payment: Payment): boolean {
  return (
    payment.payment_type === PaymentType.RENT &&
    (payment.status === PaymentStatus.APPROVED ||
      payment.status === PaymentStatus.PENDING ||
      payment.status === PaymentStatus.PROCESSING)
  );
}

function resolveInstallmentStatus(params: {
  dueDate: Date;
  isPaid: boolean;
  month: number;
  now: Date;
  year: number;
}): PaymentScheduleItem['status'] {
  if (params.isPaid) return 'paid';

  const isCurrent =
    params.now.getFullYear() === params.year && params.now.getMonth() === params.month;
  if (isCurrent) return 'current';

  return params.dueDate < params.now ? 'overdue' : 'upcoming';
}

function toNumber(value: number | string): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
