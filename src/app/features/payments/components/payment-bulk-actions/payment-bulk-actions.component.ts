import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { CheckCircle2, LucideAngularModule, Trash2, X, XCircle } from 'lucide-angular';

import { AppButtonComponent } from '../../../../shared/ui/button/button.component';

export type PaymentBulkAction = 'approve' | 'reject' | 'delete';

@Component({
  selector: 'app-payment-bulk-actions',
  standalone: true,
  imports: [LucideAngularModule, TranslocoModule, AppButtonComponent],
  templateUrl: './payment-bulk-actions.component.html',
  styleUrl: './payment-bulk-actions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentBulkActionsComponent {
  readonly selectedCount = input(0);

  readonly actionSelected = output<PaymentBulkAction>();
  readonly selectionCleared = output<void>();

  readonly CheckCircle2 = CheckCircle2;
  readonly Trash2 = Trash2;
  readonly X = X;
  readonly XCircle = XCircle;
}
