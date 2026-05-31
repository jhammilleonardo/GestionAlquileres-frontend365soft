import { computed, inject, Injectable, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import {
  Currency,
  CurrencyLabels,
  CurrencySymbols,
  Payment,
  PaymentMethod,
  PaymentMethodLabels,
  PaymentStatus,
  PaymentType,
  PaymentTypeLabels,
} from '../../../core/models/payment.model';
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

export interface PaymentOption<TValue extends string = string> {
  value: TValue;
  label: string;
}

export interface CurrencyOption extends PaymentOption<Currency> {
  symbol: string;
}

@Injectable()
export class TenantCreatePaymentFacade {
  private readonly translocoService = inject(TranslocoService);

  readonly calendarExpanded = signal(true);
  private readonly paymentScheduleSignal = signal<PaymentScheduleItem[]>([]);
  readonly paymentSchedule = this.paymentScheduleSignal.asReadonly();
  readonly paidCount = computed(
    () => this.paymentSchedule().filter((item) => item.status === 'paid').length,
  );

  readonly paymentTypes: PaymentOption<PaymentType>[] = Object.values(PaymentType).map((value) => ({
    value,
    label: PaymentTypeLabels[value],
  }));

  readonly defaultPaymentMethods: PaymentOption<PaymentMethod>[] = Object.values(PaymentMethod).map(
    (value) => ({
      value,
      label: PaymentMethodLabels[value],
    }),
  );

  readonly currencies: CurrencyOption[] = Object.values(Currency).map((value) => ({
    value,
    label: CurrencyLabels[value],
    symbol: CurrencySymbols[value],
  }));

  normalizeCurrency(value?: string): Currency | null {
    if (!value) return null;

    const upper = value.toUpperCase();
    return Object.values(Currency).includes(upper as Currency) ? (upper as Currency) : null;
  }

  normalizePaymentMethod(value?: string): PaymentMethod | null {
    if (!value) return null;

    const upper = value.trim().toUpperCase();
    const aliases: Record<string, PaymentMethod> = {
      TRANSFERENCIA: PaymentMethod.TRANSFER,
      TRANSFERENCIA_BANCARIA: PaymentMethod.TRANSFER,
      TRANSFER_BANK: PaymentMethod.TRANSFER,
      QR: PaymentMethod.QR_MC4,
      QR_ACCL: PaymentMethod.QR_MC4,
      QR_MC4: PaymentMethod.QR_MC4,
      EFECTIVO: PaymentMethod.CASH,
      TARJETA: PaymentMethod.CREDIT_CARD,
    };

    if (aliases[upper]) return aliases[upper];
    return Object.values(PaymentMethod).includes(upper as PaymentMethod)
      ? (upper as PaymentMethod)
      : null;
  }

  normalizeAvailableMethods(
    methods: Array<{ method: PaymentMethod | string; label: string }>,
  ): PaymentOption<PaymentMethod>[] {
    return methods
      .map((method) => ({
        value: this.normalizePaymentMethod(method.method),
        label: method.label,
      }))
      .filter((method): method is PaymentOption<PaymentMethod> => !!method.value);
  }

  getContractPaymentPatch(contract: Contract): {
    amount: number | null;
    currency: Currency;
    payment_method: PaymentMethod;
  } {
    return {
      amount: this.toNumber(contract.monthly_rent),
      currency: this.normalizeCurrency(contract.currency) ?? Currency.USD,
      payment_method:
        this.normalizePaymentMethod(contract.payment_method) ?? PaymentMethod.TRANSFER,
    };
  }

  buildPaymentSchedule(contract: Contract, existingPayments: readonly Payment[]): void {
    const start = new Date(contract.start_date);
    const end = new Date(contract.end_date);
    const payDay = contract.payment_day || 1;
    const now = new Date();
    const paidRentInstallments = existingPayments.filter(
      (payment) =>
        payment.payment_type === PaymentType.RENT &&
        (payment.status === PaymentStatus.APPROVED ||
          payment.status === PaymentStatus.PENDING ||
          payment.status === PaymentStatus.PROCESSING),
    ).length;
    const activeLang = this.translocoService.getActiveLang();
    const monthLocale = activeLang.startsWith('en') ? 'en-US' : 'es-BO';
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

      const status = this.resolveInstallmentStatus({
        dueDate,
        isPaid,
        month,
        now,
        year,
      });

      const raw = cursor.toLocaleDateString(monthLocale, { month: 'short', year: 'numeric' });
      items.push({
        label: raw.charAt(0).toUpperCase() + raw.slice(1),
        year,
        month,
        dueDate,
        amount: this.toNumber(contract.monthly_rent) ?? 0,
        currency: contract.currency || Currency.USD,
        status,
        statusLabel: this.getScheduleStatusLabel(status),
      });

      cursor = new Date(year, month + 1, 1);
    }

    this.paymentScheduleSignal.set(items);
  }

  private resolveInstallmentStatus(params: {
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

  private getScheduleStatusLabel(status: PaymentScheduleItem['status']): string {
    const labels: Record<PaymentScheduleItem['status'], string> = {
      paid: this.translocoService.translate('public.tenantPayments.calPaid'),
      current: this.translocoService.translate('public.tenantPayments.calCurrent'),
      overdue: this.translocoService.translate('public.tenantPayments.calOverdue'),
      upcoming: this.translocoService.translate('public.tenantPayments.calUpcoming'),
    };

    return labels[status];
  }

  private toNumber(value: number | string): number | null {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
