import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
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
import { AppCheckboxComponent } from '../../../../shared/ui/checkbox/checkbox.component';
import { AppImageUploaderComponent } from '../../../../shared/ui/image-uploader/image-uploader.component';
import { AppSelectComponent, AppSelectOption } from '../../../../shared/ui/select/select.component';
import { AppStepperComponent } from '../../../../shared/ui/stepper/stepper.component';
import { AppTextareaComponent } from '../../../../shared/ui/textarea/textarea.component';
import { AppTextFieldComponent } from '../../../../shared/ui/text-field/text-field.component';

/** Clave de un paso del wizard. "owner" solo aplica al crear. */
type WizardStepKey = 'basic' | 'images' | 'financial' | 'details' | 'address' | 'owner';

/**
 * Controles a validar al avanzar cada paso (requeridos y con rango).
 * Así un valor fuera de rango se detecta en su paso y no explota como 500 en el backend.
 */
const STEP_FIELDS: Partial<Record<WizardStepKey, readonly string[]>> = {
  basic: ['title', 'property_type_id', 'property_subtype_id'],
  financial: ['monthly_rent', 'security_deposit_amount'],
  details: [
    'square_meters',
    'bedrooms',
    'bathrooms',
    'parking_spaces',
    'year_built',
    'latitude',
    'longitude',
    'max_occupants',
    'min_lease_months',
  ],
};

const CREATE_STEPS: readonly WizardStepKey[] = [
  'basic',
  'images',
  'financial',
  'details',
  'address',
  'owner',
];
const EDIT_STEPS: readonly WizardStepKey[] = ['basic', 'images', 'financial', 'details', 'address'];

@Component({
  selector: 'app-property-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslocoModule,
    LucideAngularModule,
    AppButtonComponent,
    AppCheckboxComponent,
    AppImageUploaderComponent,
    AppSelectComponent,
    AppStepperComponent,
    AppTextareaComponent,
    AppTextFieldComponent,
  ],
  templateUrl: './property-form-dialog.component.html',
  styleUrl: './property-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyFormDialogComponent {
  private readonly transloco = inject(TranslocoService);

  readonly Building2 = Building2;
  readonly CheckCircle2 = CheckCircle2;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
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
  readonly images = input<readonly File[]>([]);
  readonly existingImages = input<readonly { url: string; path: string }[]>([]);
  readonly validationErrors = input<readonly string[]>([]);

  readonly closed = output<void>();
  readonly saved = output<void>();
  readonly propertyTypeChanged = output<number>();
  readonly imagesChanged = output<File[]>();
  readonly existingImageRemoved = output<number>();

  protected readonly currentStep = signal(0);

  private readonly activeLang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  protected readonly stepKeys = computed<readonly WizardStepKey[]>(() =>
    this.mode() === 'create' ? CREATE_STEPS : EDIT_STEPS,
  );

  protected readonly stepLabels = computed<readonly string[]>(() => {
    this.activeLang();
    return this.stepKeys().map((key) => this.transloco.translate(`propertySteps.${key}`));
  });

  protected readonly activeStep = computed<WizardStepKey>(
    () => this.stepKeys()[this.currentStep()],
  );
  protected readonly isFirstStep = computed(() => this.currentStep() === 0);
  protected readonly isLastStep = computed(() => this.currentStep() === this.stepKeys().length - 1);

  protected goBack(): void {
    if (!this.isFirstStep()) this.currentStep.update((step) => step - 1);
  }

  protected goNext(): void {
    if (!this.validateCurrentStep()) return;
    if (!this.isLastStep()) this.currentStep.update((step) => step + 1);
  }

  protected submit(): void {
    this.saved.emit();
  }

  get addresses(): FormArray {
    return this.form().get('addresses') as FormArray;
  }

  get owners(): FormArray {
    return this.form().get('new_owners') as FormArray;
  }

  hasError(fieldName: string): boolean {
    const field = this.form().get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getAddressError(index: number, fieldName: string): boolean {
    const field = this.addresses?.at(index)?.get(fieldName);
    return !!(field && field.errors && field.touched);
  }

  /** Valida los controles del paso activo, marcándolos como tocados para mostrar errores. */
  private validateCurrentStep(): boolean {
    const key = this.activeStep();

    if (key === 'address') {
      return this.validateGroup(this.addresses);
    }

    const fields = STEP_FIELDS[key];
    if (!fields) return true;

    // Evalúa todos los campos antes de cortocircuitar, para marcarlos y mostrar cada error.
    return fields.reduce(
      (allValid, fieldName) => this.validateControl(this.form().get(fieldName)) && allValid,
      true,
    );
  }

  private validateControl(control: AbstractControl | null): boolean {
    if (!control) return true;
    control.markAsTouched();
    control.updateValueAndValidity();
    return control.valid;
  }

  private validateGroup(group: AbstractControl): boolean {
    group.markAllAsTouched();
    group.updateValueAndValidity();
    return group.valid;
  }
}
