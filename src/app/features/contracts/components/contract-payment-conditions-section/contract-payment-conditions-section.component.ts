import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';

import { AppTextFieldComponent } from '../../../../shared/ui/text-field/text-field.component';

@Component({
  selector: 'app-contract-payment-conditions-section',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoModule, AppTextFieldComponent],
  templateUrl: './contract-payment-conditions-section.component.html',
  styleUrl: './contract-payment-conditions-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContractPaymentConditionsSectionComponent {
  readonly form = input.required<FormGroup>();
}
