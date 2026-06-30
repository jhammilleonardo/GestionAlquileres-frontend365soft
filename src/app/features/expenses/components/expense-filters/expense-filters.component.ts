import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';

import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { AppDatePickerComponent } from '../../../../shared/ui/date-picker/date-picker.component';
import { AppSelectOption, AppSelectComponent } from '../../../../shared/ui/select/select.component';

@Component({
  selector: 'app-expense-filters',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslocoModule,
    AppButtonComponent,
    AppDatePickerComponent,
    AppSelectComponent,
  ],
  templateUrl: './expense-filters.component.html',
  styleUrl: '../../expenses.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseFiltersComponent {
  readonly form = input.required<FormGroup>();
  readonly propertyOptions = input.required<readonly AppSelectOption<number>[]>();
  readonly categoryOptions = input.required<readonly AppSelectOption<string>[]>();
  readonly scopeOptions = input.required<readonly AppSelectOption<string>[]>();
  readonly responsibilityOptions = input.required<readonly AppSelectOption<string>[]>();
  readonly paymentStatusOptions = input.required<readonly AppSelectOption<string>[]>();
  readonly reimbursableOptions = input.required<readonly AppSelectOption<string>[]>();

  readonly filtersApplied = output<void>();
  readonly filtersCleared = output<void>();
}
