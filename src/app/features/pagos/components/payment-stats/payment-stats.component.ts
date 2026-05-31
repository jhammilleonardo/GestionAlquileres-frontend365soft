import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import {
  AlertCircle,
  CheckCircle2,
  DollarSign,
  LucideAngularModule,
  XCircle,
} from 'lucide-angular';

import { PaymentStats } from '../../../../core/models/payment.model';
import { FormatService } from '../../../../core/services/format.service';

@Component({
  selector: 'app-payment-stats',
  standalone: true,
  imports: [LucideAngularModule, TranslocoModule],
  templateUrl: './payment-stats.component.html',
  styleUrl: './payment-stats.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentStatsComponent {
  readonly stats = input.required<PaymentStats>();

  readonly DollarSign = DollarSign;
  readonly AlertCircle = AlertCircle;
  readonly CheckCircle2 = CheckCircle2;
  readonly XCircle = XCircle;

  private readonly formatService = inject(FormatService);

  formatCurrency(amount: number): string {
    return this.formatService.formatCurrency(amount);
  }
}
