import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';

import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { AppCheckboxComponent } from '../../../../shared/ui/checkbox/checkbox.component';
import { AppDatePickerComponent } from '../../../../shared/ui/date-picker/date-picker.component';
import { AppDialogComponent } from '../../../../shared/ui/dialog/dialog.component';
import { AppSelectOption, AppSelectComponent } from '../../../../shared/ui/select/select.component';
import { AppTextareaComponent } from '../../../../shared/ui/textarea/textarea.component';
import { AppTextFieldComponent } from '../../../../shared/ui/text-field/text-field.component';

@Component({
  selector: 'app-expense-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslocoModule,
    AppButtonComponent,
    AppCheckboxComponent,
    AppDatePickerComponent,
    AppDialogComponent,
    AppSelectComponent,
    AppTextareaComponent,
    AppTextFieldComponent,
  ],
  templateUrl: './expense-form-dialog.component.html',
  styleUrl: '../../expenses.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseFormDialogComponent {
  readonly open = input.required<boolean>();
  readonly editing = input.required<boolean>();
  readonly form = input.required<FormGroup>();
  readonly propertyOptions = input.required<readonly AppSelectOption<number>[]>();
  readonly categoryOptions = input.required<readonly AppSelectOption<string>[]>();
  readonly scopeOptions = input.required<readonly AppSelectOption<string>[]>();
  readonly responsibilityOptions = input.required<readonly AppSelectOption<string>[]>();
  readonly paymentStatusOptions = input.required<readonly AppSelectOption<string>[]>();
  readonly vendorOptions = input.required<readonly AppSelectOption<number>[]>();
  readonly saving = input.required<boolean>();
  readonly selectedReceipt = input<File | null>(null);
  readonly receiptError = input<string | null>(null);

  readonly closed = output<void>();
  readonly saved = output<void>();
  readonly receiptSelected = output<File | null>();

  onReceiptChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.receiptSelected.emit(inputElement.files?.item(0) ?? null);
    inputElement.value = '';
  }
}
