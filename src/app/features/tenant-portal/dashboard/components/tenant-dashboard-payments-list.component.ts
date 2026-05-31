import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { ArrowRight, CreditCard, LucideAngularModule } from 'lucide-angular';

import { Payment, PaymentStatus } from '../../../../core/models/payment.model';
import { TenantCurrencyPipe } from '../../../../shared/pipes/tenant-currency.pipe';
import { TenantDatePipe } from '../../../../shared/pipes/tenant-date.pipe';
import {
  AppStatusBadgeComponent,
  AppStatusTone,
} from '../../../../shared/ui/status-badge/status-badge.component';

@Component({
  selector: 'app-tenant-dashboard-payments-list',
  standalone: true,
  imports: [
    RouterModule,
    LucideAngularModule,
    TranslocoModule,
    TenantDatePipe,
    TenantCurrencyPipe,
    AppStatusBadgeComponent,
  ],
  templateUrl: './tenant-dashboard-payments-list.component.html',
  styleUrl: './tenant-dashboard-payments-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantDashboardPaymentsListComponent {
  readonly loading = input(false);
  readonly payments = input<readonly Payment[]>([]);
  readonly viewAllUrl = input.required<string>();
  readonly statusLabels = input.required<Record<PaymentStatus, string>>();
  readonly statusTone = input.required<(status: PaymentStatus) => AppStatusTone>();

  readonly CreditCard = CreditCard;
  readonly ArrowRight = ArrowRight;
}
