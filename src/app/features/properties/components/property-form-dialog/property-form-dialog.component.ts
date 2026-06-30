import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import {
  Building2,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  Bath,
  BedDouble,
  Car,
  Clock3,
  Home,
  Image as LucideImage,
  LucideAngularModule,
  MapPin,
  Maximize2,
  PawPrint,
  Ruler,
  ShieldCheck,
  Sofa,
  Users,
  X,
  XCircle,
} from 'lucide-angular';

import {
  GeocodingSearchResult,
  GeocodingService,
} from '../../../../core/services/geocoding.service';
import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { AppCheckboxComponent } from '../../../../shared/ui/checkbox/checkbox.component';
import { AppImageUploaderComponent } from '../../../../shared/ui/image-uploader/image-uploader.component';
import { AppInfoHintComponent } from '../../../../shared/ui/info-hint/info-hint.component';
import {
  AppLocationPickerComponent,
  PickedAddress,
  PickedLocation,
} from '../../../../shared/ui/location-picker/location-picker.component';
import { AppSelectComponent, AppSelectOption } from '../../../../shared/ui/select/select.component';
import { AppStepperComponent } from '../../../../shared/ui/stepper/stepper.component';
import { AppTextareaComponent } from '../../../../shared/ui/textarea/textarea.component';
import { AppTextFieldComponent } from '../../../../shared/ui/text-field/text-field.component';
import { BOLIVIA_MUNICIPALITIES_BY_DEPARTMENT } from './bolivia-municipalities.data';

/** Clave de un paso del wizard. "owner" solo aplica al crear; "mode" sólo en
 *  tenants BOTH al crear (elegir corto/largo plazo). */
type WizardStepKey = 'mode' | 'basic' | 'images' | 'financial' | 'details' | 'address' | 'owner';

type TenantRentalType = 'SHORT_TERM' | 'LONG_TERM' | 'BOTH';

interface AddressRegion {
  value: string;
  label: string;
}

interface AddressCountry {
  value: string;
  labelEs: string;
  labelEn: string;
  regions: readonly AddressRegion[];
}

interface LocalityOption {
  value: string;
  title: string;
  subtitle: string;
  lat?: string;
  lon?: string;
}

const ADDRESS_COUNTRIES: readonly AddressCountry[] = [
  {
    value: 'BO',
    labelEs: 'Bolivia',
    labelEn: 'Bolivia',
    regions: [
      { value: 'Beni', label: 'Beni' },
      { value: 'Chuquisaca', label: 'Chuquisaca' },
      { value: 'Cochabamba', label: 'Cochabamba' },
      { value: 'La Paz', label: 'La Paz' },
      { value: 'Oruro', label: 'Oruro' },
      { value: 'Pando', label: 'Pando' },
      { value: 'Potosi', label: 'Potosí' },
      { value: 'Santa Cruz', label: 'Santa Cruz' },
      { value: 'Tarija', label: 'Tarija' },
    ],
  },
  {
    value: 'US',
    labelEs: 'Estados Unidos',
    labelEn: 'United States',
    regions: [
      { value: 'Alabama', label: 'Alabama' },
      { value: 'Alaska', label: 'Alaska' },
      { value: 'Arizona', label: 'Arizona' },
      { value: 'Arkansas', label: 'Arkansas' },
      { value: 'California', label: 'California' },
      { value: 'Colorado', label: 'Colorado' },
      { value: 'Connecticut', label: 'Connecticut' },
      { value: 'Delaware', label: 'Delaware' },
      { value: 'District of Columbia', label: 'District of Columbia' },
      { value: 'Florida', label: 'Florida' },
      { value: 'Georgia', label: 'Georgia' },
      { value: 'Hawaii', label: 'Hawaii' },
      { value: 'Idaho', label: 'Idaho' },
      { value: 'Illinois', label: 'Illinois' },
      { value: 'Indiana', label: 'Indiana' },
      { value: 'Iowa', label: 'Iowa' },
      { value: 'Kansas', label: 'Kansas' },
      { value: 'Kentucky', label: 'Kentucky' },
      { value: 'Louisiana', label: 'Louisiana' },
      { value: 'Maine', label: 'Maine' },
      { value: 'Maryland', label: 'Maryland' },
      { value: 'Massachusetts', label: 'Massachusetts' },
      { value: 'Michigan', label: 'Michigan' },
      { value: 'Minnesota', label: 'Minnesota' },
      { value: 'Mississippi', label: 'Mississippi' },
      { value: 'Missouri', label: 'Missouri' },
      { value: 'Montana', label: 'Montana' },
      { value: 'Nebraska', label: 'Nebraska' },
      { value: 'Nevada', label: 'Nevada' },
      { value: 'New Hampshire', label: 'New Hampshire' },
      { value: 'New Jersey', label: 'New Jersey' },
      { value: 'New Mexico', label: 'New Mexico' },
      { value: 'New York', label: 'New York' },
      { value: 'North Carolina', label: 'North Carolina' },
      { value: 'North Dakota', label: 'North Dakota' },
      { value: 'Ohio', label: 'Ohio' },
      { value: 'Oklahoma', label: 'Oklahoma' },
      { value: 'Oregon', label: 'Oregon' },
      { value: 'Pennsylvania', label: 'Pennsylvania' },
      { value: 'Rhode Island', label: 'Rhode Island' },
      { value: 'South Carolina', label: 'South Carolina' },
      { value: 'South Dakota', label: 'South Dakota' },
      { value: 'Tennessee', label: 'Tennessee' },
      { value: 'Texas', label: 'Texas' },
      { value: 'Utah', label: 'Utah' },
      { value: 'Vermont', label: 'Vermont' },
      { value: 'Virginia', label: 'Virginia' },
      { value: 'Washington', label: 'Washington' },
      { value: 'West Virginia', label: 'West Virginia' },
      { value: 'Wisconsin', label: 'Wisconsin' },
      { value: 'Wyoming', label: 'Wyoming' },
    ],
  },
  {
    value: 'GT',
    labelEs: 'Guatemala',
    labelEn: 'Guatemala',
    regions: [
      { value: 'Alta Verapaz', label: 'Alta Verapaz' },
      { value: 'Baja Verapaz', label: 'Baja Verapaz' },
      { value: 'Chimaltenango', label: 'Chimaltenango' },
      { value: 'Chiquimula', label: 'Chiquimula' },
      { value: 'El Progreso', label: 'El Progreso' },
      { value: 'Escuintla', label: 'Escuintla' },
      { value: 'Guatemala', label: 'Guatemala' },
      { value: 'Huehuetenango', label: 'Huehuetenango' },
      { value: 'Izabal', label: 'Izabal' },
      { value: 'Jalapa', label: 'Jalapa' },
      { value: 'Jutiapa', label: 'Jutiapa' },
      { value: 'Peten', label: 'Petén' },
      { value: 'Quetzaltenango', label: 'Quetzaltenango' },
      { value: 'Quiche', label: 'Quiché' },
      { value: 'Retalhuleu', label: 'Retalhuleu' },
      { value: 'Sacatepequez', label: 'Sacatepéquez' },
      { value: 'San Marcos', label: 'San Marcos' },
      { value: 'Santa Rosa', label: 'Santa Rosa' },
      { value: 'Solola', label: 'Sololá' },
      { value: 'Suchitepequez', label: 'Suchitepéquez' },
      { value: 'Totonicapan', label: 'Totonicapán' },
      { value: 'Zacapa', label: 'Zacapa' },
    ],
  },
  {
    value: 'HN',
    labelEs: 'Honduras',
    labelEn: 'Honduras',
    regions: [
      { value: 'Atlantida', label: 'Atlántida' },
      { value: 'Choluteca', label: 'Choluteca' },
      { value: 'Colon', label: 'Colón' },
      { value: 'Comayagua', label: 'Comayagua' },
      { value: 'Copan', label: 'Copán' },
      { value: 'Cortes', label: 'Cortés' },
      { value: 'El Paraiso', label: 'El Paraíso' },
      { value: 'Francisco Morazan', label: 'Francisco Morazán' },
      { value: 'Gracias a Dios', label: 'Gracias a Dios' },
      { value: 'Intibuca', label: 'Intibucá' },
      { value: 'Islas de la Bahia', label: 'Islas de la Bahía' },
      { value: 'La Paz', label: 'La Paz' },
      { value: 'Lempira', label: 'Lempira' },
      { value: 'Ocotepeque', label: 'Ocotepeque' },
      { value: 'Olancho', label: 'Olancho' },
      { value: 'Santa Barbara', label: 'Santa Bárbara' },
      { value: 'Valle', label: 'Valle' },
      { value: 'Yoro', label: 'Yoro' },
    ],
  },
];

/**
 * Controles a validar al avanzar cada paso (requeridos y con rango).
 * Así un valor fuera de rango se detecta en su paso y no explota como 500 en el backend.
 */
const STEP_FIELDS: Partial<Record<WizardStepKey, readonly string[]>> = {
  basic: ['title', 'property_type_id', 'property_subtype_id'],
  financial: ['monthly_rent', 'price_per_night', 'security_deposit_amount'],
  details: [
    'square_meters',
    'bedrooms',
    'bathrooms',
    'parking_spaces',
    'year_built',
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
    AppInfoHintComponent,
    AppLocationPickerComponent,
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly geocoding = inject(GeocodingService);

  readonly Building2 = Building2;
  readonly Bath = Bath;
  readonly BedDouble = BedDouble;
  readonly CalendarCheck = CalendarCheck;
  readonly CalendarDays = CalendarDays;
  readonly CheckCircle2 = CheckCircle2;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly CreditCard = CreditCard;
  readonly Car = Car;
  readonly Clock3 = Clock3;
  readonly DollarSign = DollarSign;
  readonly Home = Home;
  readonly LucideImage = LucideImage;
  readonly MapPin = MapPin;
  readonly Maximize2 = Maximize2;
  readonly PawPrint = PawPrint;
  readonly Ruler = Ruler;
  readonly ShieldCheck = ShieldCheck;
  readonly Sofa = Sofa;
  readonly Users = Users;
  readonly X = X;
  readonly XCircle = XCircle;

  readonly bookingModeOptions: AppSelectOption<string>[] = [
    { value: 'instant', label: this.transloco.translate('properties.units.bookingModes.instant') },
    { value: 'request', label: this.transloco.translate('properties.units.bookingModes.request') },
  ];

  readonly cancellationPolicyOptions: AppSelectOption<string>[] = [
    {
      value: 'flexible',
      label: this.transloco.translate('properties.units.cancellationPolicies.flexible'),
    },
    {
      value: 'moderate',
      label: this.transloco.translate('properties.units.cancellationPolicies.moderate'),
    },
    {
      value: 'strict',
      label: this.transloco.translate('properties.units.cancellationPolicies.strict'),
    },
    {
      value: 'non_refundable',
      label: this.transloco.translate('properties.units.cancellationPolicies.non_refundable'),
    },
  ];

  readonly form = input.required<FormGroup>();
  readonly mode = input.required<'create' | 'edit'>();
  /** Modo del tenant; en BOTH al crear se muestra el paso de elección corto/largo. */
  readonly tenantRentalType = input<TenantRentalType | null>(null);
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
  protected readonly localitySuggestions = signal<Record<number, readonly LocalityOption[]>>({});

  private readonly activeLang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });
  private readonly localityTimers = new Map<number, ReturnType<typeof setTimeout>>();
  private readonly localityAbortControllers = new Map<number, AbortController>();
  private readonly localityRequestIds = new Map<number, number>();

  constructor() {
    this.destroyRef.onDestroy(() => {
      for (const timer of this.localityTimers.values()) {
        clearTimeout(timer);
      }

      for (const controller of this.localityAbortControllers.values()) {
        controller.abort();
      }
    });
  }

  /** En tenants BOTH (sólo al crear) se antepone el paso de elección de modo. */
  protected readonly showModeStep = computed(
    () => this.mode() === 'create' && this.tenantRentalType() === 'BOTH',
  );

  protected readonly stepKeys = computed<readonly WizardStepKey[]>(() => {
    const base = this.mode() === 'create' ? CREATE_STEPS : EDIT_STEPS;
    return this.showModeStep() ? (['mode', ...base] as const) : base;
  });

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

  /** ¿El modo elegido para la propiedad incluye corto plazo? Controla qué
   *  campo financiero (precio/noche vs. renta mensual) se muestra al crear. */
  /**
   * Una propiedad se crea para UN modo: corto **o** largo. Aunque el tenant
   * gestione ambos (BOTH), el paso "mode" obliga a elegir uno, así que el
   * `rental_type` de la propiedad nunca es BOTH. Por eso largo plazo es
   * simplemente `!isShortTerm()`, y los campos de contrato (p.ej. meses mínimos)
   * se muestran sólo en largo (en corto no hay contratos, hay reservas).
   */
  protected isShortTerm(): boolean {
    return this.form().get('rental_type')?.value === 'SHORT_TERM';
  }

  protected setRentalType(value: 'SHORT_TERM' | 'LONG_TERM' | 'BOTH'): void {
    this.form().get('rental_type')?.setValue(value);
    this.applyPriceRequiredValidators();
  }

  /**
   * Exige precio según el modo: precio/noche en corto plazo, renta mensual en
   * largo. El validador de formato (rango) ya existe; aquí solo se suma/quita
   * el `required` en el campo visible para que no se pueda crear sin precio.
   */
  private applyPriceRequiredValidators(): void {
    const shortTerm = this.isShortTerm();
    const requireNightly = this.mode() === 'create' && shortTerm;
    const requireMonthly = !shortTerm;
    const monthlyRent = this.form().get('monthly_rent');
    const pricePerNight = this.form().get('price_per_night');

    monthlyRent?.removeValidators(Validators.required);
    pricePerNight?.removeValidators(Validators.required);

    if (requireMonthly) monthlyRent?.addValidators(Validators.required);
    if (requireNightly) pricePerNight?.addValidators(Validators.required);

    monthlyRent?.updateValueAndValidity({ emitEvent: false });
    pricePerNight?.updateValueAndValidity({ emitEvent: false });
  }

  /** True cuando el campo está vacío pero es requerido (mensaje distinto a rango). */
  hasRequiredError(fieldName: string): boolean {
    const field = this.form().get(fieldName);
    return !!(field && field.hasError('required') && (field.dirty || field.touched));
  }

  get addresses(): FormArray {
    return this.form().get('addresses') as FormArray;
  }

  /**
   * Coordenadas elegidas en el mapa → se vuelcan a los controles lat/lng y, si
   * el resultado de búsqueda trajo dirección, se autocompletan los campos de
   * dirección (el usuario luego puede refinar calle/número/referencias).
   */
  onLocationPicked(loc: PickedLocation): void {
    this.form().patchValue({ latitude: loc.lat, longitude: loc.lng });
    this.form().get('latitude')?.markAsDirty();
    this.form().get('longitude')?.markAsDirty();

    if (loc.address) {
      this.fillAddressFromMap(loc.address);
    }
  }

  /** Vuelca la dirección del geocoder al primer grupo de dirección del form. */
  private fillAddressFromMap(address: PickedAddress): void {
    const group = this.addresses?.at(0);
    if (!group) return;

    // La dirección completa siempre se actualiza al elegir una ubicación nueva.
    group.get('street_address')?.setValue(address.street || address.full);

    // Ciudad/depto/CP solo se rellenan si están vacíos, para no pisar lo que el
    // usuario ya eligió en el selector de localidad.
    this.fillIfEmpty(group, 'city', address.city);
    this.fillIfEmpty(group, 'state', address.state);
    this.fillIfEmpty(group, 'zip_code', address.zipCode);

    group.markAsDirty();
  }

  private fillIfEmpty(group: AbstractControl, controlName: string, value?: string): void {
    if (!value) return;
    const control = group.get(controlName);
    if (control && !`${control.value ?? ''}`.trim()) {
      control.setValue(value);
    }
  }

  /** Dirección compuesta del primer address, para prellenar el buscador del mapa. */
  protected countryLabel(index: number): string {
    this.activeLang();
    const current = this.addressField(index, 'country');
    const country = this.addressCountry(index);

    if (!country) {
      return current || '-';
    }

    return this.transloco.getActiveLang() === 'en' ? country.labelEn : country.labelEs;
  }

  protected regionLabel(index: number): string {
    const country = this.addressCountry(index);

    if (country && ['BO', 'GT', 'HN'].includes(country.value)) {
      return this.transloco.translate('properties.department');
    }

    return this.transloco.translate('properties.state');
  }

  protected regionOptions(index: number): readonly AppSelectOption<string>[] {
    const current = this.addressField(index, 'state');
    const country = this.addressCountry(index);
    const options =
      country?.regions.map((region) => ({ value: region.value, label: region.label })) ?? [];

    return this.withCurrentOption(options, current);
  }

  protected regionPlaceholder(index: number): string {
    const country = this.addressCountry(index);

    if (country && ['BO', 'GT', 'HN'].includes(country.value)) {
      return this.transloco.translate('properties.departmentPlaceholder');
    }

    return this.transloco.translate('properties.statePlaceholder');
  }

  protected localityLabel(index: number): string {
    const country = this.addressCountry(index);

    if (country && ['BO', 'GT', 'HN'].includes(country.value)) {
      return this.transloco.translate('properties.municipality');
    }

    return this.transloco.translate('properties.city');
  }

  protected localityPlaceholder(index: number): string {
    const country = this.addressCountry(index);

    if (country && ['BO', 'GT', 'HN'].includes(country.value)) {
      return this.transloco.translate('properties.municipalityPlaceholder');
    }

    return this.transloco.translate('properties.cityPlaceholder');
  }

  protected localitySuggestionsFor(index: number): readonly LocalityOption[] {
    return this.localitySuggestions()[index] ?? [];
  }

  protected localitySuggestionTitle(suggestion: LocalityOption): string {
    return suggestion.title;
  }

  protected localitySuggestionSubtitle(suggestion: LocalityOption): string {
    return suggestion.subtitle;
  }

  protected selectedAddressField(index: number, fieldName: string): string {
    return this.addressField(index, fieldName);
  }

  protected onAddressRegionChanged(index: number, value: string | number | null): void {
    const group = this.addresses.at(index) as FormGroup | null;
    if (!group || typeof value !== 'string') return;

    group.patchValue({ city: '' });
    this.clearLocalitySuggestions(index);
    void this.locateAddressSelection(index, false);
  }

  protected onLocalityInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const term = input?.value.trim() ?? '';

    this.queueLocalitySuggestions(index, term);
  }

  protected selectLocalitySuggestion(index: number, suggestion: LocalityOption): void {
    const group = this.addresses.at(index) as FormGroup | null;
    if (!group) return;

    group.patchValue({ city: suggestion.value });
    group.get('city')?.markAsDirty();
    group.get('city')?.markAsTouched();
    this.clearLocalitySuggestions(index);

    if (suggestion.lat && suggestion.lon) {
      this.applyLocationSuggestion(suggestion);
      return;
    }

    void this.locateAddressSelection(index, true);
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

    if (key === 'financial') {
      this.applyPriceRequiredValidators();
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

  private addressField(index: number, fieldName: string): string {
    const value: unknown = this.addresses.at(index)?.get(fieldName)?.value;
    return typeof value === 'string' ? value : '';
  }

  private addressCountry(index: number): AddressCountry | undefined {
    const value = this.addressField(index, 'country').toLowerCase();
    return ADDRESS_COUNTRIES.find(
      (country) =>
        country.value.toLowerCase() === value ||
        country.labelEs.toLowerCase() === value ||
        country.labelEn.toLowerCase() === value,
    );
  }

  /**
   * El código postal solo se muestra en países donde se usa. En Bolivia no
   * forma parte de las direcciones (iría siempre como "0000"), así que se omite.
   */
  protected addressUsesPostalCode(index: number): boolean {
    return this.addressCountry(index)?.value !== 'BO';
  }

  private addressRegion(index: number): AddressRegion | undefined {
    const country = this.addressCountry(index);
    const value = this.addressField(index, 'state');
    return country?.regions.find((region) => region.value === value || region.label === value);
  }

  private withCurrentOption(
    options: readonly AppSelectOption<string>[],
    current: string,
  ): readonly AppSelectOption<string>[] {
    if (!current || options.some((option) => option.value === current)) {
      return options;
    }

    return [{ value: current, label: current }, ...options];
  }

  private queueLocalitySuggestions(index: number, term: string): void {
    const existingTimer = this.localityTimers.get(index);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.localityTimers.delete(index);
    }

    this.localityAbortControllers.get(index)?.abort();
    this.localityAbortControllers.delete(index);

    const catalogOptions = this.localityCatalogOptions(index, term);
    if (catalogOptions) {
      this.localitySuggestions.update((current) => ({ ...current, [index]: catalogOptions }));
      return;
    }

    if (term.length < 2) {
      this.clearLocalitySuggestions(index);
      return;
    }

    this.localityTimers.set(
      index,
      setTimeout(() => void this.loadLocalitySuggestions(index, term), 300),
    );
  }

  private async loadLocalitySuggestions(index: number, term: string): Promise<void> {
    const requestId = (this.localityRequestIds.get(index) ?? 0) + 1;
    this.localityRequestIds.set(index, requestId);

    const region = this.addressRegion(index)?.label || this.addressField(index, 'state');
    const country = this.addressCountry(index);
    const countryLabel = country
      ? this.transloco.getActiveLang() === 'en'
        ? country.labelEn
        : country.labelEs
      : this.addressField(index, 'country');
    const q = [term, region, countryLabel].filter(Boolean).join(', ');
    if (!q) return;

    const results = await this.fetchLocationSuggestions(index, q, 6);
    if (this.localityRequestIds.get(index) === requestId) {
      this.localitySuggestions.update((current) => ({
        ...current,
        [index]: results.map((result) => this.geocodingResultToLocalityOption(result)),
      }));
    }
  }

  private async locateAddressSelection(index: number, includeLocality: boolean): Promise<void> {
    const country = this.addressCountry(index);
    const countryLabel = country
      ? this.transloco.getActiveLang() === 'en'
        ? country.labelEn
        : country.labelEs
      : this.addressField(index, 'country');
    const region = this.addressRegion(index)?.label || this.addressField(index, 'state');
    const locality = includeLocality ? this.addressField(index, 'city') : '';
    const q = [locality, region, countryLabel].filter(Boolean).join(', ');
    if (!q) return;

    const [result] = await this.fetchLocationSuggestions(index, q, 1);
    if (result) {
      this.applyLocationSuggestion(result);
    }
  }

  private async fetchLocationSuggestions(
    index: number,
    q: string,
    limit: number,
  ): Promise<readonly GeocodingSearchResult[]> {
    const controller = new AbortController();
    this.localityAbortControllers.get(index)?.abort();
    this.localityAbortControllers.set(index, controller);

    try {
      return await this.geocoding.search({
        query: q,
        limit,
        country: this.addressCountry(index)?.value ?? this.addressField(index, 'country'),
        signal: controller.signal,
      });
    } catch {
      return [];
    } finally {
      if (this.localityAbortControllers.get(index) === controller) {
        this.localityAbortControllers.delete(index);
      }
    }
  }

  private localityCatalogOptions(index: number, term: string): readonly LocalityOption[] | null {
    const country = this.addressCountry(index);
    const region = this.addressRegion(index);

    if (country?.value !== 'BO' || !region) {
      return null;
    }

    const municipalities = BOLIVIA_MUNICIPALITIES_BY_DEPARTMENT[region.value] ?? [];
    const normalizedTerm = this.normalizeText(term);
    const filtered = normalizedTerm
      ? municipalities.filter((municipality) =>
          this.normalizeText(this.catalogSearchText(region, municipality)).includes(normalizedTerm),
        )
      : municipalities;

    return filtered.map((municipality) => ({
      value: municipality,
      title: this.catalogTitle(region, municipality),
      subtitle: `${region.label}, ${country.labelEs}`,
    }));
  }

  private geocodingResultToLocalityOption(result: GeocodingSearchResult): LocalityOption {
    const title = result.display_name.split(',')[0]?.trim() || result.display_name;

    return {
      value: title,
      title,
      subtitle: result.display_name.split(',').slice(1).join(',').trim(),
      lat: result.lat,
      lon: result.lon,
    };
  }

  private applyLocationSuggestion(suggestion: Pick<LocalityOption, 'lat' | 'lon'>): void {
    const lat = suggestion.lat ? parseFloat(suggestion.lat) : Number.NaN;
    const lng = suggestion.lon ? parseFloat(suggestion.lon) : Number.NaN;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    this.form().patchValue({
      latitude: this.round8(lat),
      longitude: this.round8(lng),
    });
    this.form().get('latitude')?.markAsDirty();
    this.form().get('longitude')?.markAsDirty();
  }

  private clearLocalitySuggestions(index: number): void {
    this.localitySuggestions.update((current) => {
      if (!current[index]?.length) return current;
      const next = { ...current };
      delete next[index];
      return next;
    });
  }

  private round8(n: number): number {
    return Math.round(n * 1e8) / 1e8;
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private catalogTitle(region: AddressRegion, municipality: string): string {
    if (region.value === 'Cochabamba' && municipality === 'Cochabamba') {
      return 'Cochabamba (Cercado)';
    }

    return municipality;
  }

  private catalogSearchText(region: AddressRegion, municipality: string): string {
    return `${municipality} ${this.catalogTitle(region, municipality)}`;
  }
}
