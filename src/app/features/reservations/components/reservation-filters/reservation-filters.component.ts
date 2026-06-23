import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';

import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { AppSelectComponent, AppSelectOption } from '../../../../shared/ui/select/select.component';

@Component({
  selector: 'app-reservation-filters',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoModule, AppButtonComponent, AppSelectComponent],
  templateUrl: './reservation-filters.component.html',
  styleUrl: '../../reservations.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationFiltersComponent {
  readonly form = input.required<FormGroup>();
  readonly propertyOptions = input.required<readonly AppSelectOption<number>[]>();
  readonly statusOptions = input.required<readonly AppSelectOption<string>[]>();

  readonly filtersCleared = output<void>();
}
