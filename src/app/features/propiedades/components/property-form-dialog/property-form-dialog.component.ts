import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import {
  Building2,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Home,
  Image as LucideImage,
  LucideAngularModule,
  MapPin,
  Maximize2,
  PawPrint,
  Users,
  X,
  XCircle,
} from 'lucide-angular';

import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { AppFileUploadComponent } from '../../../../shared/ui/file-upload/file-upload.component';
import { AppSelectComponent, AppSelectOption } from '../../../../shared/ui/select/select.component';
import { AppTextareaComponent } from '../../../../shared/ui/textarea/textarea.component';
import { AppTextFieldComponent } from '../../../../shared/ui/text-field/text-field.component';

@Component({
  selector: 'app-property-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslocoModule,
    LucideAngularModule,
    AppButtonComponent,
    AppFileUploadComponent,
    AppSelectComponent,
    AppTextareaComponent,
    AppTextFieldComponent,
  ],
  templateUrl: './property-form-dialog.component.html',
  styleUrl: './property-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyFormDialogComponent {
  readonly Building2 = Building2;
  readonly CheckCircle2 = CheckCircle2;
  readonly CreditCard = CreditCard;
  readonly DollarSign = DollarSign;
  readonly Home = Home;
  readonly LucideImage = LucideImage;
  readonly MapPin = MapPin;
  readonly Maximize2 = Maximize2;
  readonly PawPrint = PawPrint;
  readonly Users = Users;
  readonly X = X;
  readonly XCircle = XCircle;

  readonly form = input.required<FormGroup>();
  readonly mode = input.required<'create' | 'edit'>();
  readonly isSubmitting = input(false);
  readonly propertyTypeOptions = input.required<readonly AppSelectOption<number>[]>();
  readonly propertySubtypeOptions = input.required<readonly AppSelectOption<number>[]>();
  readonly currencyOptions = input.required<readonly AppSelectOption<string>[]>();
  readonly selectedImages = input<readonly File[]>([]);
  readonly validationErrors = input<readonly string[]>([]);

  readonly closed = output<void>();
  readonly saved = output<void>();
  readonly propertyTypeChanged = output<number>();
  readonly imagesSelected = output<File[]>();

  get addresses(): FormArray {
    return this.form().get('addresses') as FormArray;
  }

  get owners(): FormArray {
    return this.form().get('new_owners') as FormArray;
  }

  getButtonText(): string {
    if (this.isSubmitting()) return 'Guardando...';
    return this.mode() === 'create' ? 'Crear Propiedad' : 'Guardar Cambios';
  }

  hasError(fieldName: string): boolean {
    const field = this.form().get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getAddressError(index: number, fieldName: string): string {
    const addressArray = this.addresses;
    if (!addressArray || addressArray.length === 0 || index >= addressArray.length) {
      return '';
    }

    const field = addressArray.at(index)?.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    if (field.errors['required']) return 'Este campo es requerido';
    return 'Campo inválido';
  }
}
