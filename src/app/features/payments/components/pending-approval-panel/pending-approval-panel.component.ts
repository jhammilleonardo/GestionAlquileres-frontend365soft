import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { CheckCircle2, ExternalLink, LucideAngularModule } from 'lucide-angular';

import {
  Currency,
  Payment,
  PaymentMethod,
  PaymentMethodLabels,
  PaymentStatus,
  PaymentStatusLabels,
} from '../../../../core/models/payment.model';
import { FormatService } from '../../../../core/services/format.service';
import { TenantDatePipe } from '../../../../shared/pipes/tenant-date.pipe';
import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { AppDatePickerComponent } from '../../../../shared/ui/date-picker/date-picker.component';
import { AppSelectComponent, AppSelectOption } from '../../../../shared/ui/select/select.component';
import {
  AppStatusBadgeComponent,
  AppStatusTone,
} from '../../../../shared/ui/status-badge/status-badge.component';

@Component({
  selector: 'app-pending-approval-panel',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslocoModule,
    LucideAngularModule,
    TenantDatePipe,
    AppButtonComponent,
    AppDatePickerComponent,
    AppSelectComponent,
    AppStatusBadgeComponent,
  ],
  templateUrl: './pending-approval-panel.component.html',
  styleUrl: './pending-approval-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingApprovalPanelComponent {
  readonly payments = input<readonly Payment[]>([]);
  readonly form = input.required<FormGroup>();
  readonly propertyOptions = input.required<readonly AppSelectOption<number>[]>();

  readonly filtersApplied = output<void>();
  readonly filtersCleared = output<void>();
  readonly proofOpened = output<Payment>();
  readonly approved = output<Payment>();
  readonly rejected = output<Payment>();

  readonly CheckCircle2 = CheckCircle2;
  readonly ExternalLink = ExternalLink;

  constructor(private readonly formatService: FormatService) {}

  getTenantName(payment: Payment): string {
    const tenant = payment.tenant;
    if (tenant?.name) return tenant.name;
    const fullName = `${tenant?.first_name ?? ''} ${tenant?.last_name ?? ''}`.trim();
    return fullName || `Inquilino #${payment.tenant_id}`;
  }

  getPropertyName(payment: Payment): string {
    return payment.property?.title || `ID ${payment.property_id}`;
  }

  getUnitName(payment: Payment): string {
    const metadataUnit = payment.metadata?.['unit_number'];
    const metadataUnitStr = typeof metadataUnit === 'string' ? metadataUnit : '';
    return (
      payment.unit?.unit_number || payment.contract?.unit?.unit_number || metadataUnitStr || 'N/A'
    );
  }

  getRegisteredDate(payment: Payment): Date {
    return this.parseDate(payment.created_at) ?? this.parseDate(payment.payment_date) ?? new Date();
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

  getMethodLabel(method: PaymentMethod): string {
    return PaymentMethodLabels[method];
  }

  formatCurrency(amount: number, currency?: Currency): string {
    return this.formatService.formatCurrency(amount, currency);
  }

  private parseDate(dateValue?: string | Date): Date | null {
    if (!dateValue) return null;
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    return Number.isNaN(date.getTime()) ? null : date;
  }
}
