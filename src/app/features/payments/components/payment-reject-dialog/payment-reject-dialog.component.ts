import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';

import { Payment } from '../../../../core/models/payment.model';
import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { AppDialogComponent } from '../../../../shared/ui/dialog/dialog.component';
import { AppTextareaComponent } from '../../../../shared/ui/textarea/textarea.component';

@Component({
  selector: 'app-payment-reject-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslocoModule,
    AppButtonComponent,
    AppDialogComponent,
    AppTextareaComponent,
  ],
  templateUrl: './payment-reject-dialog.component.html',
  styleUrl: './payment-reject-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentRejectDialogComponent {
  readonly payment = input.required<Payment>();
  readonly form = input.required<FormGroup>();

  readonly closed = output<void>();
  readonly submitted = output<void>();
}
