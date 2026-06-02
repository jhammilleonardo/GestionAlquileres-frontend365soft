import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { DollarSign, LucideAngularModule } from 'lucide-angular';

import { Payment } from '../../../../core/models/payment.model';
import { FormatService } from '../../../../core/services/format.service';
import { AppLoadingStateComponent } from '../../../../shared/ui/loading-state/loading-state.component';
import { PaymentTableComponent } from '../payment-table/payment-table.component';

@Component({
  selector: 'app-payment-list-section',
  standalone: true,
  imports: [LucideAngularModule, TranslocoModule, AppLoadingStateComponent, PaymentTableComponent],
  templateUrl: './payment-list-section.component.html',
  styleUrl: './payment-list-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentListSectionComponent {
  readonly payments = input<readonly Payment[]>([]);
  readonly selectedIds = input<readonly number[]>([]);
  readonly pendingPaymentIds = input<readonly number[]>([]);
  readonly loading = input(false);

  readonly rowSelected = output<Payment>();
  readonly selectionToggled = output<Payment>();
  readonly selectAllToggled = output<boolean>();
  readonly approved = output<Payment>();
  readonly rejected = output<Payment>();

  readonly DollarSign = DollarSign;

  readonly totalAmount = computed(() =>
    this.payments().reduce((sum, payment) => sum + payment.amount, 0),
  );

  constructor(private readonly formatService: FormatService) {}

  formatCurrency(amount: number): string {
    return this.formatService.formatCurrency(amount);
  }
}
