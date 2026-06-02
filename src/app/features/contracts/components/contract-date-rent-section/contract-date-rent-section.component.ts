import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';

import { AppDatePickerComponent } from '../../../../shared/ui/date-picker/date-picker.component';
import { AppTextFieldComponent } from '../../../../shared/ui/text-field/text-field.component';

@Component({
  selector: 'app-contract-date-rent-section',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoModule, AppDatePickerComponent, AppTextFieldComponent],
  templateUrl: './contract-date-rent-section.component.html',
  styleUrl: './contract-date-rent-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContractDateRentSectionComponent {
  readonly form = input.required<FormGroup>();
  readonly showTitle = input(true);

  hasError(controlName: string): boolean {
    const control = this.form().get(controlName);
    return Boolean(control?.invalid && control?.touched);
  }
}
