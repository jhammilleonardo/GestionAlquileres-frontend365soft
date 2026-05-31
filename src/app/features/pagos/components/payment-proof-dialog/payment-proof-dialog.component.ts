import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { LucideAngularModule, Minus, Plus } from 'lucide-angular';

import { Payment } from '../../../../core/models/payment.model';
import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { AppDialogComponent } from '../../../../shared/ui/dialog/dialog.component';
import { AppLoadingStateComponent } from '../../../../shared/ui/loading-state/loading-state.component';

@Component({
  selector: 'app-payment-proof-dialog',
  standalone: true,
  imports: [
    TranslocoModule,
    LucideAngularModule,
    AppButtonComponent,
    AppDialogComponent,
    AppLoadingStateComponent,
  ],
  templateUrl: './payment-proof-dialog.component.html',
  styleUrl: './payment-proof-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentProofDialogComponent {
  readonly Minus = Minus;
  readonly Plus = Plus;

  readonly payment = input.required<Payment>();
  readonly objectUrl = input<string | null>(null);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly zoom = input(1);
  readonly isPdf = input(false);
  readonly canZoomIn = input(false);
  readonly canZoomOut = input(false);

  readonly closed = output<void>();
  readonly zoomedIn = output<void>();
  readonly zoomedOut = output<void>();
  readonly zoomReset = output<void>();
}
