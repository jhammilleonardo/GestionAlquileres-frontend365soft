import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { CheckCircle2, ExternalLink, LucideAngularModule, XCircle } from 'lucide-angular';

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
  readonly ExternalLink = ExternalLink;
  readonly PaymentStatus = PaymentStatus;
  readonly XCircle = XCircle;

  getTenantName(payment: Payment): string {
    const tenant = payment.tenant;
    if (tenant?.name) return tenant.name;
    const fullName = `${tenant?.first_name ?? ''} ${tenant?.last_name ?? ''}`.trim();
    return fullName || `Inquilino #${payment.tenant_id}`;
  }

  getPropertyName(payment: Payment): string {
    return payment.property?.title || `ID ${payment.property_id}`;
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
}
