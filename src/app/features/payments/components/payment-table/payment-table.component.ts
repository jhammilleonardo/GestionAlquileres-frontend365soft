import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { CalendarCheck2, CheckCircle2, Eye, LucideAngularModule, XCircle } from 'lucide-angular';

import {
  Currency,
  Payment,
  PaymentMethod,
  PaymentMethodLabels,
  PaymentStatus,
  PaymentStatusLabels,
  PaymentType,
  PaymentTypeLabels,
} from '../../../../core/models/payment.model';
import { TenantCurrencyPipe } from '../../../../shared/pipes/tenant-currency.pipe';
import { TenantDatePipe } from '../../../../shared/pipes/tenant-date.pipe';
import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import {
  AppStatusBadgeComponent,
  AppStatusTone,
} from '../../../../shared/ui/status-badge/status-badge.component';

@Component({
  selector: 'app-payment-table',
  standalone: true,
  imports: [
    LucideAngularModule,
    TranslocoModule,
    TenantCurrencyPipe,
    TenantDatePipe,
    AppButtonComponent,
    AppStatusBadgeComponent,
  ],
  templateUrl: './payment-table.component.html',
  styleUrl: './payment-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentTableComponent {
  readonly payments = input<readonly Payment[]>([]);
  readonly selectedIds = input<readonly number[]>([]);
  readonly pendingPaymentIds = input<readonly number[]>([]);

  readonly rowSelected = output<Payment>();
  readonly selectionToggled = output<Payment>();
  readonly selectAllToggled = output<boolean>();
  readonly approved = output<Payment>();
  readonly rejected = output<Payment>();

  readonly CheckCircle2 = CheckCircle2;
  readonly CalendarCheck2 = CalendarCheck2;
  readonly XCircle = XCircle;
  readonly Eye = Eye;
  readonly PaymentStatus = PaymentStatus;

  readonly allPendingSelected = computed(
    () =>
      this.pendingPaymentIds().length > 0 &&
      this.selectedIds().length === this.pendingPaymentIds().length,
  );

  readonly somePendingSelected = computed(
    () =>
      this.selectedIds().length > 0 && this.selectedIds().length < this.pendingPaymentIds().length,
  );

  isSelected(id: number): boolean {
    return this.selectedIds().includes(id);
  }

  checkboxChecked(event: Event): boolean {
    return event.target instanceof HTMLInputElement ? event.target.checked : false;
  }

  getTenantName(payment: Payment): string {
    const tenant = payment.tenant;
    if (tenant?.name) return tenant.name;

    const fullName = `${tenant?.first_name ?? ''} ${tenant?.last_name ?? ''}`.trim();
    return fullName || 'Inquilino';
  }

  getPropertyName(payment: Payment): string {
    return payment.property?.title || 'Propiedad';
  }

  getStatusLabel(status: PaymentStatus): string {
    return PaymentStatusLabels[status];
  }

  getStatusTone(status: PaymentStatus): AppStatusTone {
    switch (status) {
      case PaymentStatus.APPROVED:
        return 'success';
      case PaymentStatus.PENDING:
      case PaymentStatus.PROCESSING:
        return 'warning';
      case PaymentStatus.REJECTED:
      case PaymentStatus.FAILED:
      case PaymentStatus.DISPUTED:
        return 'danger';
      case PaymentStatus.REFUNDED:
      case PaymentStatus.REVERSED:
        return 'info';
      default:
        return 'neutral';
    }
  }

  getTypeLabel(type: PaymentType): string {
    return PaymentTypeLabels[type];
  }

  isReservationPayment(payment: Payment): boolean {
    return Boolean(payment.reservation_id || payment.reservation?.id);
  }

  getReservationDepositPercent(payment: Payment): number | null {
    const reservation = payment.reservation;
    const total = Number(reservation?.total_amount ?? 0);
    const required = Number(reservation?.deposit_required ?? payment.amount ?? 0);
    if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(required)) return null;
    return Math.round((required / total) * 100);
  }

  getReservationTotal(payment: Payment): number {
    const total = Number(payment.reservation?.total_amount ?? 0);
    return Number.isFinite(total) ? total : 0;
  }

  getReservationPaid(payment: Payment): number {
    const reservation = payment.reservation;
    const fallbackPaid = payment.status === PaymentStatus.APPROVED ? payment.amount : 0;
    const paid = Number(reservation?.paid_amount ?? fallbackPaid);
    return Number.isFinite(paid) ? paid : 0;
  }

  getReservationBalance(payment: Payment): number {
    const total = this.getReservationTotal(payment);
    const paid = this.getReservationPaid(payment);
    return Math.max(0, total - paid);
  }

  getMethodLabel(method: PaymentMethod): string {
    return PaymentMethodLabels[method];
  }

  resolveCurrency(currency?: Currency): string {
    return currency || Currency.USD;
  }

  stopAndToggleSelection(event: Event, payment: Payment): void {
    event.stopPropagation();
    this.selectionToggled.emit(payment);
  }

  stopAndApprove(event: Event, payment: Payment): void {
    event.stopPropagation();
    this.approved.emit(payment);
  }

  stopAndReject(event: Event, payment: Payment): void {
    event.stopPropagation();
    this.rejected.emit(payment);
  }
}
