import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';

import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { AppDialogComponent } from '../../../../shared/ui/dialog/dialog.component';
import { AppFileUploadComponent } from '../../../../shared/ui/file-upload/file-upload.component';
import { AppSelectComponent, AppSelectOption } from '../../../../shared/ui/select/select.component';
import { AppTextareaComponent } from '../../../../shared/ui/textarea/textarea.component';

@Component({
  selector: 'app-violation-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslocoModule,
    AppButtonComponent,
    AppDialogComponent,
    AppFileUploadComponent,
    AppSelectComponent,
    AppTextareaComponent,
  ],
  templateUrl: './violation-form-dialog.component.html',
  styleUrl: '../../violations.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViolationFormDialogComponent {
  readonly open = input.required<boolean>();
  readonly form = input.required<FormGroup>();
  readonly propertyOptions = input.required<readonly AppSelectOption<number>[]>();
  readonly tenantOptions = input.required<readonly AppSelectOption<number>[]>();
  readonly typeOptions = input.required<readonly AppSelectOption<string>[]>();
  readonly saving = input.required<boolean>();

  readonly closed = output<void>();
  readonly saved = output<void>();
  readonly filesSelected = output<File[]>();
}
