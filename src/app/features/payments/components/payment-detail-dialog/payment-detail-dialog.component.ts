import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import {
  CalendarCheck2,
  CheckCircle2,
  ExternalLink,
  LucideAngularModule,
  XCircle,
} from 'lucide-angular';

import {
  Currency,
  CurrencyLabels,
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
import { AppDialogComponent } from '../../../../shared/ui/dialog/dialog.component';
import {
  AppStatusBadgeComponent,
  AppStatusTone,
} from '../../../../shared/ui/status-badge/status-badge.component';

@Component({
  selector: 'app-payment-detail-dialog',
  standalone: true,
  imports: [
    TranslocoModule,
    LucideAngularModule,
    TenantCurrencyPipe,
    TenantDatePipe,
    AppButtonComponent,
    AppDialogComponent,
    AppStatusBadgeComponent,
  ],
  templateUrl: './payment-detail-dialog.component.html',
  styleUrl: './payment-detail-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentDetailDialogComponent {
  readonly payment = input.required<Payment>();

  readonly closed = output<void>();
  readonly proofOpened = output<Payment>();
  readonly approved = output<Payment>();
  readonly rejected = output<Payment>();

  readonly CheckCircle2 = CheckCircle2;
  readonly CalendarCheck2 = CalendarCheck2;
  readonly ExternalLink = ExternalLink;
  readonly PaymentStatus = PaymentStatus;
  readonly XCircle = XCircle;

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

  getCurrencyLabel(currency: Currency): string {
    return CurrencyLabels[currency];
  }

  getTypeLabel(type: PaymentType): string {
    return PaymentTypeLabels[type];
  }

  getMethodLabel(method: PaymentMethod): string {
    return PaymentMethodLabels[method];
  }

  isReservationPayment(payment: Payment): boolean {
    return Boolean(payment.reservation_id || payment.reservation?.id);
  }

  getReservationDepositRequired(payment: Payment): number {
    const required = Number(payment.reservation?.deposit_required ?? payment.amount ?? 0);
    return Number.isFinite(required) ? required : 0;
  }

  getReservationTotal(payment: Payment): number {
    const total = Number(payment.reservation?.total_amount ?? 0);
    return Number.isFinite(total) ? total : 0;
  }

  getReservationPaid(payment: Payment): number {
    const fallbackPaid = payment.status === PaymentStatus.APPROVED ? payment.amount : 0;
    const paid = Number(payment.reservation?.paid_amount ?? fallbackPaid);
    return Number.isFinite(paid) ? paid : 0;
  }

  getReservationDepositPercent(payment: Payment): number | null {
    const total = this.getReservationTotal(payment);
    const required = this.getReservationDepositRequired(payment);
    if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(required)) return null;
    return Math.round((required / total) * 100);
  }

  getReservationBalance(payment: Payment): number {
    const total = this.getReservationTotal(payment);
    const paid = this.getReservationPaid(payment);
    return Math.max(0, total - paid);
  }

  getDisplayNotes(payment: Payment): string {
    return this.removeInternalReservationId(payment.notes ?? '');
  }

  getDisplayAdminNotes(payment: Payment): string {
    return this.removeInternalReservationId(payment.admin_notes ?? '');
  }

  private removeInternalReservationId(value: string): string {
    return value
      .replace(/\s*-\s*Reserva\s*#\d+\b/gi, '')
      .replace(/\s*-\s*Reservation\s*#\d+\b/gi, '')
      .replace(/\bReserva\s*#\d+\b/gi, 'Reserva')
      .replace(/\bReservation\s*#\d+\b/gi, 'Reservation')
      .trim();
  }
}
