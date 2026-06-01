import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';

import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { AppDialogComponent } from '../../../../shared/ui/dialog/dialog.component';
import { AppSelectComponent, AppSelectOption } from '../../../../shared/ui/select/select.component';
import { AppTextareaComponent } from '../../../../shared/ui/textarea/textarea.component';
import { AppTextFieldComponent } from '../../../../shared/ui/text-field/text-field.component';

@Component({
  selector: 'app-vendor-form-dialog',
  standalone: true,
  imports: [
    AppButtonComponent,
    AppDialogComponent,
    AppSelectComponent,
    AppTextareaComponent,
    AppTextFieldComponent,
    ReactiveFormsModule,
    TranslocoModule,
  ],
  templateUrl: './vendor-form-dialog.component.html',
  styleUrl: '../../vendors.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorFormDialogComponent {
  readonly open = input(false);
  readonly editing = input(false);
  readonly form = input.required<FormGroup>();
  readonly specialtyOptions = input.required<readonly AppSelectOption<string>[]>();
  readonly saving = input(false);
  readonly closed = output<void>();
  readonly saved = output<void>();
}
