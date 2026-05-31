import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  CreditCard,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  XCircle,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CheckCheck,
  TriangleAlert,
} from 'lucide-angular';
import { TenantPaymentService } from '../../../core/services/tenant/tenant-payment.service';
import { SlugService } from '../../../core/services/slug.service';
import {
  TenantContractService,
  Contract,
} from '../../../core/services/tenant/tenant-contract.service';
import {
  PaymentStatus,
  Payment,
  PaymentType,
  PaymentMethod,
  PaymentStatusLabels,
  PaymentTypeLabels,
  PaymentMethodLabels,
  CurrencyLabels,
} from '../../../core/models/payment.model';
import { TranslocoModule, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { TenantDatePipe } from '../../../shared/pipes/tenant-date.pipe';
import { TenantCurrencyPipe } from '../../../shared/pipes/tenant-currency.pipe';
import { AppButtonComponent } from '../../../shared/ui/button/button.component';
import { AppLoadingStateComponent } from '../../../shared/ui/loading-state/loading-state.component';
import { AppPageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import {
  AppStatusBadgeComponent,
  AppStatusTone,
} from '../../../shared/ui/status-badge/status-badge.component';

interface PaymentScheduleItem {
  label: string;
  year: number;
  month: number;
  dueDate: Date;
  amount: number;
  currency: string;
  status: 'paid' | 'overdue' | 'current' | 'upcoming';
  statusLabel: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tenant-payments-list',
  standalone: true,
  imports: [
    DecimalPipe,
    RouterModule,
    FormsModule,
    LucideAngularModule,
    TranslocoModule,
    TenantDatePipe,
    TenantCurrencyPipe,
    AppButtonComponent,
    AppLoadingStateComponent,
    AppPageHeaderComponent,
    AppStatusBadgeComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  templateUrl: './tenant-payments-list.component.html',
  styleUrls: ['./tenant-payments-list.component.scss'],
})
export class TenantPaymentsListComponent {
  readonly CreditCard = CreditCard;
  readonly Download = Download;
  readonly Calendar = Calendar;
  readonly DollarSign = DollarSign;
  readonly TrendingUp = TrendingUp;
  readonly AlertCircle = AlertCircle;
  readonly CheckCircle2 = CheckCircle2;
  readonly Clock = Clock;
  readonly Plus = Plus;
  readonly XCircle = XCircle;
  readonly CalendarDays = CalendarDays;
  readonly ChevronDown = ChevronDown;
  readonly ChevronUp = ChevronUp;
  readonly CheckCheck = CheckCheck;
  readonly TriangleAlert = TriangleAlert;

  paymentService = inject(TenantPaymentService);
  contractService = inject(TenantContractService);
  private slugService = inject(SlugService);
  private translocoService = inject(TranslocoService);

  calendarExpanded = signal(true);
  private paymentScheduleSignal = signal<PaymentScheduleItem[]>([]);
  paymentSchedule = this.paymentScheduleSignal.asReadonly();
  hasPendingRent = computed(() =>
    this.paymentSchedule().some((item) => item.status === 'current' || item.status === 'overdue'),
  );

  PaymentStatus = PaymentStatus;
  private paymentStatusLabels = PaymentStatusLabels;
  private paymentTypeLabels = PaymentTypeLabels;
  private paymentMethodLabels = PaymentMethodLabels;
  currencyLabels = CurrencyLabels;
  // URL para registrar nuevo pago
  nuevoPagoUrl = computed(() => this.slugService.buildUrl('/portal/pagos/nuevo'));

  constructor() {
    this.paymentService.loadPayments();
    this.paymentService.loadStats();

    if (!this.contractService.currentContract()) {
      this.contractService.loadCurrentContract();
    }
    const tryBuildCalendar = () => {
      const contract = this.contractService.currentContract();
      if (contract) {
        setTimeout(() => this.buildPaymentSchedule(contract), 200);
        setTimeout(() => this.buildPaymentSchedule(contract), 900);
      } else if (this.contractService.isLoading()) {
        setTimeout(tryBuildCalendar, 300);
      }
    };
    setTimeout(tryBuildCalendar, 150);
  }

  private buildPaymentSchedule(contract: Contract): void {
    const start = new Date(contract.start_date as unknown as string);
    const end = new Date(contract.end_date as unknown as string);
    const payDay = contract.payment_day || 1;
    const now = new Date();
    const existing = this.paymentService.payments();
    const paidRentInstallments = existing.filter(
      (payment) =>
        payment.payment_type === PaymentType.RENT &&
        (payment.status === PaymentStatus.APPROVED ||
          payment.status === PaymentStatus.PENDING ||
          payment.status === PaymentStatus.PROCESSING),
    ).length;
    const activeLang = this.translocoService.getActiveLang();
    const monthLocale = activeLang.startsWith('en') ? 'en-US' : 'es-BO';
    let assignedPaidInstallments = 0;

    const items: PaymentScheduleItem[] = [];
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

      const isCurrent = now.getFullYear() === year && now.getMonth() === month;
      const isPastDue = dueDate < now && !isCurrent;

      let status: PaymentScheduleItem['status'];
      let statusLabel: string;

      if (isPaid) {
        status = 'paid';
        statusLabel = this.translocoService.translate('public.tenantPayments.calPaid');
      } else if (isCurrent) {
        status = 'current';
        statusLabel = this.translocoService.translate('public.tenantPayments.calCurrent');
      } else if (isPastDue) {
        status = 'overdue';
        statusLabel = this.translocoService.translate('public.tenantPayments.calOverdue');
      } else {
        status = 'upcoming';
        statusLabel = this.translocoService.translate('public.tenantPayments.calUpcoming');
      }

      const raw = cursor.toLocaleDateString(monthLocale, { month: 'short', year: 'numeric' });
      items.push({
        label: raw.charAt(0).toUpperCase() + raw.slice(1),
        year,
        month,
        dueDate,
        amount:
          typeof contract.monthly_rent === 'number'
            ? contract.monthly_rent
            : parseFloat(contract.monthly_rent as unknown as string) || 0,
        currency: contract.currency || 'USD',
        status,
        statusLabel,
      });
      cursor = new Date(year, month + 1, 1);
    }
    this.paymentScheduleSignal.set(items);
  }

  getPaymentStatusTone(status: PaymentStatus): AppStatusTone {
    const tones: Record<PaymentStatus, AppStatusTone> = {
      [PaymentStatus.PENDING]: 'warning',
      [PaymentStatus.PROCESSING]: 'info',
      [PaymentStatus.APPROVED]: 'success',
      [PaymentStatus.REJECTED]: 'danger',
      [PaymentStatus.FAILED]: 'danger',
      [PaymentStatus.REFUNDED]: 'info',
      [PaymentStatus.REVERSED]: 'neutral',
      [PaymentStatus.DISPUTED]: 'warning',
    };

    return tones[status] ?? 'neutral';
  }

  getPaymentStatusLabel(status: PaymentStatus): string {
    return this.translateOrFallback(
      `public.tenantPayments.paymentStatus.${status}`,
      this.paymentStatusLabels[status],
    );
  }

  getPaymentTypeLabel(type: PaymentType): string {
    return this.translateOrFallback(
      `public.tenantPayments.paymentType.${type}`,
      this.paymentTypeLabels[type],
    );
  }

  getPaymentMethodLabel(method: PaymentMethod): string {
    return this.translateOrFallback(
      `public.tenantPayments.paymentMethod.${method}`,
      this.paymentMethodLabels[method],
    );
  }

  private translateOrFallback(key: string, fallback: string): string {
    const translated = this.translocoService.translate(key);
    return translated === key ? fallback : translated;
  }

  getRejectionReason(payment: Payment): string {
    return payment.rejection_reason || payment.admin_notes || '-';
  }
}
