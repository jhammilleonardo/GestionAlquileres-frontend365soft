import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';

import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { AppDatePickerComponent } from '../../../../shared/ui/date-picker/date-picker.component';
import { AppDialogComponent } from '../../../../shared/ui/dialog/dialog.component';
import { AppSelectComponent, AppSelectOption } from '../../../../shared/ui/select/select.component';

@Component({
  selector: 'app-inspection-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslocoModule,
    AppButtonComponent,
    AppDatePickerComponent,
    AppDialogComponent,
    AppSelectComponent,
  ],
  templateUrl: './inspection-form-dialog.component.html',
  styleUrl: '../../inspections.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InspectionFormDialogComponent {
  readonly open = input.required<boolean>();
  readonly form = input.required<FormGroup>();
  readonly propertyOptions = input.required<readonly AppSelectOption<number>[]>();
  readonly typeOptions = input.required<readonly AppSelectOption<string>[]>();
  readonly inspectorOptions = input.required<readonly AppSelectOption<number>[]>();
  readonly saving = input.required<boolean>();

  readonly closed = output<void>();
  readonly saved = output<void>();
}
