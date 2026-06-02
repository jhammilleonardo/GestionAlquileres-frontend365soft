import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';

import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { AppDatePickerComponent } from '../../../../shared/ui/date-picker/date-picker.component';
import { AppSelectComponent, AppSelectOption } from '../../../../shared/ui/select/select.component';

@Component({
  selector: 'app-payment-filters',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslocoModule,
    AppButtonComponent,
    AppDatePickerComponent,
    AppSelectComponent,
  ],
  templateUrl: './payment-filters.component.html',
  styleUrl: './payment-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentFiltersComponent {
  readonly form = input.required<FormGroup>();
  readonly statusOptions = input.required<readonly AppSelectOption[]>();
  readonly typeOptions = input.required<readonly AppSelectOption[]>();
  readonly methodOptions = input.required<readonly AppSelectOption[]>();
  readonly currencyOptions = input.required<readonly AppSelectOption[]>();

  readonly filtersApplied = output<void>();
  readonly filtersCleared = output<void>();
}
