import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';

import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { AppSelectComponent, AppSelectOption } from '../../../../shared/ui/select/select.component';

@Component({
  selector: 'app-violation-filters',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoModule, AppButtonComponent, AppSelectComponent],
  templateUrl: './violation-filters.component.html',
  styleUrl: '../../violations.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViolationFiltersComponent {
  readonly form = input.required<FormGroup>();
  readonly propertyOptions = input.required<readonly AppSelectOption<number>[]>();
  readonly statusOptions = input.required<readonly AppSelectOption<string>[]>();
  readonly typeOptions = input.required<readonly AppSelectOption<string>[]>();

  readonly filtersCleared = output<void>();
}
