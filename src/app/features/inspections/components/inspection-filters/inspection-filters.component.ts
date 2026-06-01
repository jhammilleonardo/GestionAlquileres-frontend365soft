import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';

import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { AppSelectComponent, AppSelectOption } from '../../../../shared/ui/select/select.component';

@Component({
  selector: 'app-inspection-filters',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoModule, AppButtonComponent, AppSelectComponent],
  templateUrl: './inspection-filters.component.html',
  styleUrl: '../../inspections.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InspectionFiltersComponent {
  readonly form = input.required<FormGroup>();
  readonly propertyOptions = input.required<readonly AppSelectOption<number>[]>();
  readonly statusOptions = input.required<readonly AppSelectOption<string>[]>();
  readonly typeOptions = input.required<readonly AppSelectOption<string>[]>();

  readonly filtersApplied = output<void>();
  readonly filtersCleared = output<void>();
}
