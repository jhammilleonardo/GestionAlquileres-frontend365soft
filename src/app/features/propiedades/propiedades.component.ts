import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
} from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LucideAngularModule,
  Building2,
  Plus,
  Search,
  Filter,
  Eye,
  Pencil,
  Trash2,
  MapPin,
  DollarSign,
  Maximize2,
  BedDouble,
  CheckCircle2,
  XCircle,
  X,
  Image as LucideImage,
  CreditCard,
  Globe,
  PawPrint,
  Users,
  Calendar,
  Home,
  Power,
  RefreshCw,
  AlertTriangle,
} from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { PropertyService } from '../../core/services/admin/property.service';
import { AuthService } from '../../core/services/auth.service';
import { SlugService } from '../../core/services/slug.service';
import { FormatService } from '../../core/services/format.service';
import {
  Property,
  PropertyFilters,
  PropertyStatus,
  PropertyType,
  PropertySubtype,
  SortOption,
} from '../../core/models/property.model';
import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { AppDialogComponent } from '../../shared/ui/dialog/dialog.component';
import { AppLoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { AppPageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { AppSelectComponent, AppSelectOption } from '../../shared/ui/select/select.component';
import {
  AppStatusBadgeComponent,
  AppStatusTone,
} from '../../shared/ui/status-badge/status-badge.component';
import { AppTextFieldComponent } from '../../shared/ui/text-field/text-field.component';
import { AppTextareaComponent } from '../../shared/ui/textarea/textarea.component';
import { AppFileUploadComponent } from '../../shared/ui/file-upload/file-upload.component';
import { ToastService } from '../../shared/ui/toast/toast.service';

interface PropertyFormAddressValue {
  address_type?: string;
  street_address: string;
  city: string;
  state?: string;
  zip_code?: string;
  country: string;
}

interface PropertyFormOwnerValue {
  name?: string;
  is_company?: boolean;
  company_name?: string;
  primary_email?: string;
  phone_number?: string;
  ownership_percentage?: number | string | null;
  is_primary?: boolean;
}

interface PropertyFormValue {
  title?: string;
  description?: string;
  property_type_id?: number | string | null;
  property_subtype_id?: number | string | null;
  active?: boolean;
  monthly_rent?: number | string | null;
  currency?: string;
  security_deposit_amount?: number | string | null;
  account_number?: string;
  account_type?: string;
  account_holder_name?: string;
  square_meters?: number | string | null;
  bedrooms?: number | string | null;
  bathrooms?: number | string | null;
  parking_spaces?: number | string | null;
  year_built?: number | string | null;
  is_furnished?: boolean;
  pets_allowed?: boolean;
  smoking_allowed?: boolean;
  max_occupants?: number | string | null;
  min_lease_months?: number | string | null;
  amenities?: string[];
  included_items?: string[];
  latitude?: number | string | null;
  longitude?: number | string | null;
  addresses?: PropertyFormAddressValue[];
  new_owners?: PropertyFormOwnerValue[];
}

interface PropertyRulesPayload {
  pets_allowed?: boolean;
  smoking_allowed?: boolean;
  max_occupants?: number;
  min_lease_months?: number;
}

interface PropertySavePayload {
  title: string;
  property_type_id: number;
  property_subtype_id: number;
  addresses: PropertyFormAddressValue[];
  description?: string;
  security_deposit_amount?: number;
  account_number?: string;
  account_type?: string;
  account_holder_name?: string;
  monthly_rent?: number;
  currency?: string;
  square_meters?: number;
  bedrooms?: number;
  bathrooms?: number;
  parking_spaces?: number;
  year_built?: number;
  is_furnished?: boolean;
  latitude?: number;
  longitude?: number;
  amenities?: string[];
  included_items?: string[];
  property_rules?: PropertyRulesPayload;
  new_owners?: PropertyFormOwnerValue[];
}

@Component({
  selector: 'app-propiedades',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    TranslocoModule,
    AppButtonComponent,
    AppDialogComponent,
    AppLoadingStateComponent,
    AppPageHeaderComponent,
    AppSelectComponent,
    AppStatusBadgeComponent,
    AppTextFieldComponent,
    AppTextareaComponent,
    AppFileUploadComponent,
  ],
  templateUrl: './propiedades.component.html',
  styleUrl: './propiedades.component.scss',
  providers: [provideTranslocoScope({ scope: 'propiedades', alias: 'properties' })],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropiedadesComponent {
  // Icons
  readonly Building2 = Building2;
  readonly Plus = Plus;
  readonly Search = Search;
  readonly Filter = Filter;
  readonly Eye = Eye;
  readonly Pencil = Pencil;
  readonly Trash2 = Trash2;
  readonly MapPin = MapPin;
  readonly DollarSign = DollarSign;
  readonly Maximize2 = Maximize2;
  readonly BedDouble = BedDouble;
  readonly CheckCircle2 = CheckCircle2;
  readonly XCircle = XCircle;
  readonly X = X;
  readonly LucideImage = LucideImage;
  readonly CreditCard = CreditCard;
  readonly Globe = Globe;
  readonly PawPrint = PawPrint;
  readonly Users = Users;
  readonly Calendar = Calendar;
  readonly Home = Home;
  readonly Power = Power;
  readonly RefreshCw = RefreshCw;
  readonly AlertTriangle = AlertTriangle;

  private propertyService = inject(PropertyService);
  private authService = inject(AuthService);
  private slugService = inject(SlugService);
  private fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  private formatService = inject(FormatService);

  // Validation & confirmation state
  validationErrors = signal<string[]>([]);
  deleteConfirmProperty = signal<Property | null>(null);

  // Mapa de campos a etiquetas legibles
  private readonly fieldLabels: Record<string, string> = {
    title: 'Título',
    property_type_id: 'Tipo de Propiedad',
    property_subtype_id: 'Subtipo',
    monthly_rent: 'Renta mensual',
  };

  private translateFieldKey(key: string): string {
    const addrMatch = key.match(/^addresses\[(\d+)\]\.(.+)$/);
    if (addrMatch) {
      const addrFieldLabels: Record<string, string> = {
        street_address: 'Calle / Dirección',
        city: 'Ciudad',
        country: 'País',
      };
      const idx = +addrMatch[1] + 1;
      const fieldName = addrFieldLabels[addrMatch[2]] || addrMatch[2];
      return `Dirección ${idx} — ${fieldName}`;
    }
    return this.fieldLabels[key] ?? key;
  }

  properties = signal<Property[]>([]);
  propertyTypes = signal<PropertyType[]>([]);
  propertySubtypes = signal<PropertySubtype[]>([]);
  filteredSubtypes = signal<PropertySubtype[]>([]);
  private readonly propertyImageMap = signal<Map<number, string>>(new Map());

  isListLoading = signal(false);
  isSubmitting = signal(false);
  showModal = signal(false);
  modalMode: 'create' | 'edit' = 'create';
  selectedProperty: Property | null = null;
  selectedImages: File[] = []; // Archivos de imagen seleccionados

  // Filters
  filters: PropertyFilters = {
    search: '',
    status: undefined,
    property_type_id: undefined,
    sort_by: SortOption.CREATED_AT,
    sort_order: 'DESC',
    page: 1,
    limit: 50,
  };

  propertyForm: FormGroup = this.createForm();
  PropertyStatus = PropertyStatus;
  statusOptions = Object.values(PropertyStatus);
  readonly statusSelectOptions: readonly AppSelectOption<PropertyStatus>[] = this.statusOptions.map(
    (status) => ({ value: status, label: status }),
  );
  readonly propertyTypeOptions = computed<readonly AppSelectOption<number>[]>(() =>
    this.propertyTypes().map((type) => ({ value: type.id, label: type.name })),
  );
  readonly propertySubtypeOptions = computed<readonly AppSelectOption<number>[]>(() =>
    this.filteredSubtypes().map((subtype) => ({ value: subtype.id, label: subtype.name })),
  );
  readonly currencyOptions: readonly AppSelectOption<string>[] = [
    { value: 'BOB', label: 'BOB - Bolivia' },
    { value: 'USD', label: 'USD - Estados Unidos' },
    { value: 'EUR', label: 'EUR - Euro' },
  ];

  constructor() {
    this.loadProperties();
    this.loadPropertyTypes();
    this.loadPropertySubtypes();

    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const editId = params['edit'];
      if (editId) {
        const id = parseInt(editId, 10);
        this.propertyService.getAdminPropertyById(id).subscribe({
          next: (property) => {
            if (property) this.openEditModal(property);
          },
        });
        void this.router.navigate([], { relativeTo: this.route, queryParams: {} });
      }
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      description: [''],
      property_type_id: ['', Validators.required],
      property_subtype_id: ['', Validators.required],
      active: [true],
      // Financial fields
      monthly_rent: [null, [Validators.min(0)]],
      currency: ['BOB'],
      security_deposit_amount: [null],
      account_number: [''],
      account_type: [''],
      account_holder_name: [''],
      // Property details
      square_meters: [null],
      bedrooms: [null],
      bathrooms: [null],
      parking_spaces: [null],
      year_built: [null],
      is_furnished: [false],
      // Rules (individual fields for intuitive UI)
      pets_allowed: [false],
      smoking_allowed: [false],
      max_occupants: [null],
      min_lease_months: [null],
      amenities: [[]],
      included_items: [[]],
      // Location
      latitude: [null],
      longitude: [null],
      // Relations
      addresses: this.fb.array([this.createAddressGroup()]),
      new_owners: this.fb.array([this.createOwnerGroup()]),
    });
  }

  private createAddressGroup(): FormGroup {
    return this.fb.group({
      address_type: ['address_1'],
      street_address: ['', Validators.required],
      city: ['', Validators.required],
      state: [''],
      zip_code: [''],
      country: ['', Validators.required],
    });
  }

  private createOwnerGroup(): FormGroup {
    return this.fb.group({
      name: [''],
      is_company: [false],
      company_name: [''],
      primary_email: ['', [Validators.email]],
      phone_number: [''],
      ownership_percentage: [100, [Validators.min(0), Validators.max(100)]],
      is_primary: [true],
    });
  }

  get addresses(): FormArray {
    if (!this.propertyForm) {
      return this.fb.array([]);
    }
    return this.propertyForm.get('addresses') as FormArray;
  }

  get owners(): FormArray {
    if (!this.propertyForm) {
      return this.fb.array([]);
    }
    return this.propertyForm.get('new_owners') as FormArray;
  }

  getButtonText(): string {
    if (this.isSubmitting()) return 'Guardando...';
    return this.modalMode === 'create' ? 'Crear Propiedad' : 'Guardar Cambios';
  }

  loadProperties(): void {
    this.isListLoading.set(true);
    this.propertyService.getAdminProperties(this.filters).subscribe({
      next: (data) => {
        this.properties.set(data);
        const imageMap = new Map<number, string>();
        data.forEach((prop) => imageMap.set(prop.id, this.buildImageUrl(prop)));
        this.propertyImageMap.set(imageMap);
        this.isListLoading.set(false);
      },
      error: () => {
        this.isListLoading.set(false);
        this.toast.error('Error al cargar las propiedades');
      },
    });
  }

  loadPropertyTypes(): void {
    this.propertyService.getPropertyTypes().subscribe({
      next: (types) => {
        this.propertyTypes.set(types);
      },
      error: () => {
        this.toast.error('No se pudieron cargar los tipos de propiedad. Recarga la página.');
      },
    });
  }

  loadPropertySubtypes(): void {
    this.propertyService.getPropertySubtypes().subscribe({
      next: (subtypes) => {
        this.propertySubtypes.set(subtypes);
      },
      error: () => {
        this.toast.error('No se pudieron cargar los subtipos de propiedad');
      },
    });
  }

  onPropertyTypeChange(typeId: number, keepSubtype: boolean = false): void {
    if (!typeId) {
      this.filteredSubtypes.set([]);
      this.propertyForm.patchValue({ property_subtype_id: '' });
      return;
    }
    const filtered = this.propertySubtypes().filter((st) => st.property_type_id === +typeId);
    this.filteredSubtypes.set(filtered);
    if (!keepSubtype) {
      this.propertyForm.patchValue({ property_subtype_id: '' });
    }
  }

  applyFilters(): void {
    this.loadProperties();
  }

  setStatusFilter(status: PropertyStatus | null): void {
    this.filters.status = status ?? undefined;
    this.applyFilters();
  }

  setPropertyTypeFilter(propertyTypeId: number | null): void {
    this.filters.property_type_id = propertyTypeId ?? undefined;
    this.applyFilters();
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      status: undefined,
      property_type_id: undefined,
      sort_by: SortOption.CREATED_AT,
      sort_order: 'DESC',
      page: 1,
      limit: 50,
    };
    this.loadProperties();
  }

  openCreateModal(): void {
    this.modalMode = 'create';
    this.selectedProperty = null;
    this.filteredSubtypes.set([]);
    this.showModal.set(false);
    this.propertyForm = this.createForm();
    setTimeout(() => {
      this.showModal.set(true);
    }, 10);
  }

  openEditModal(property: Property): void {
    this.modalMode = 'edit';
    this.selectedProperty = property;

    // Cerrar modal primero
    this.showModal.set(false);

    // Cargar datos completos de la propiedad desde el backend
    this.propertyService.getAdminPropertyById(property.id).subscribe({
      next: (fullProperty) => {
        const p = fullProperty || property;
        this.selectedProperty = p;
        this.populateEditForm(p);
      },
      error: () => {
        // Si falla, usar los datos del listado
        this.populateEditForm(property);
      },
    });
  }

  private populateEditForm(p: Property): void {
    // Recrear el formulario completamente con los campos actualizados
    this.propertyForm = this.fb.group({
      title: [p.title, Validators.required],
      description: [p.description],
      property_type_id: [p.property_type_id, Validators.required],
      property_subtype_id: [p.property_subtype_id, Validators.required],
      active: [p.active],
      // Financial fields
      monthly_rent: [p.monthly_rent ?? null, [Validators.min(0)]],
      currency: [p.currency || 'BOB'],
      security_deposit_amount: [p.security_deposit_amount ?? null],
      account_number: [p.account_number || ''],
      account_type: [p.account_type || ''],
      account_holder_name: [p.account_holder_name || ''],
      // Property details
      square_meters: [p.square_meters ?? null],
      bedrooms: [p.bedrooms ?? null],
      bathrooms: [p.bathrooms ?? null],
      parking_spaces: [p.parking_spaces ?? null],
      year_built: [p.year_built ?? null],
      is_furnished: [p.is_furnished ?? false],
      // Rules (extract from property_rules object)
      pets_allowed: [p.property_rules?.pets_allowed ?? false],
      smoking_allowed: [p.property_rules?.smoking_allowed ?? false],
      max_occupants: [p.property_rules?.max_occupants ?? null],
      min_lease_months: [p.property_rules?.min_lease_months ?? null],
      amenities: [p.amenities || []],
      included_items: [p.included_items || []],
      // Location
      latitude: [p.latitude],
      longitude: [p.longitude],
      // Relations
      addresses: this.fb.array(
        p.addresses && p.addresses.length > 0
          ? p.addresses.map((addr) =>
              this.fb.group({
                address_type: [addr.address_type || 'address_1'],
                street_address: [addr.street_address, Validators.required],
                city: [addr.city, Validators.required],
                state: [addr.state || ''],
                zip_code: [addr.zip_code || ''],
                country: [addr.country, Validators.required],
              }),
            )
          : [this.createAddressGroup()],
      ),
      new_owners: this.fb.array([this.createOwnerGroup()]),
    });

    // Cargar subtipos sin resetear el subtipo ya seleccionado
    this.onPropertyTypeChange(p.property_type_id, true);

    setTimeout(() => {
      this.showModal.set(true);
    }, 10);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedProperty = null;
    this.selectedImages = [];
    this.validationErrors.set([]);
  }

  onImagesSelected(files: File[]): void {
    if (files.length > 0) {
      const filesArray = files;
      // Validar máximo 10 imágenes
      if (filesArray.length > 10) {
        this.toast.warning('Máximo 10 imágenes permitidas');
        this.selectedImages = filesArray.slice(0, 10);
      } else {
        this.selectedImages = filesArray;
      }

      const invalidFiles = this.selectedImages.filter((file) => {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 5 * 1024 * 1024;
        return !validTypes.includes(file.type) || file.size > maxSize;
      });

      if (invalidFiles.length > 0) {
        this.toast.warning('Solo se permiten imágenes JPG, PNG, GIF, WebP menores a 5MB');
        this.selectedImages = this.selectedImages.filter((file) => !invalidFiles.includes(file));
      }
    }
  }

  saveProperty(): void {
    this.markFormGroupTouched(this.propertyForm);

    if (this.propertyForm.invalid) {
      const errorKeys: string[] = [];

      Object.keys(this.propertyForm.controls).forEach((key) => {
        const control = this.propertyForm.get(key);
        if (control && control.invalid && !(control instanceof FormArray)) {
          errorKeys.push(key);
        }
      });

      const addressesArray = this.addresses;
      if (addressesArray.length === 0) {
        errorKeys.push('addresses');
      } else {
        addressesArray.controls.forEach((addr, index) => {
          Object.keys((addr as FormGroup).controls).forEach((field) => {
            const fc = addr.get(field);
            if (fc && fc.invalid) {
              errorKeys.push(`addresses[${index}].${field}`);
            }
          });
        });
      }

      const readableErrors = errorKeys.map((k) => this.translateFieldKey(k));
      this.validationErrors.set(readableErrors);
      this.scrollToValidationErrors();
      return;
    }

    this.validationErrors.set([]);
    this.isSubmitting.set(true);
    const formValue = this.propertyForm.getRawValue() as PropertyFormValue;

    // Convertir valores a tipos correctos
    const property_type_id = formValue.property_type_id ? +formValue.property_type_id : null;
    const property_subtype_id = formValue.property_subtype_id
      ? +formValue.property_subtype_id
      : null;

    // Validar campos requeridos
    if (!formValue.title || !property_type_id || !property_subtype_id) {
      const missing: string[] = [];
      if (!formValue.title) missing.push('Título');
      if (!property_type_id) missing.push('Tipo de Propiedad');
      if (!property_subtype_id) missing.push('Subtipo');
      this.validationErrors.set(missing);
      this.isSubmitting.set(false);
      this.scrollToValidationErrors();
      return;
    }

    if (!formValue.addresses || formValue.addresses.length === 0) {
      this.validationErrors.set(['Se requiere al menos una dirección']);
      this.isSubmitting.set(false);
      this.scrollToValidationErrors();
      return;
    }

    const createDto: PropertySavePayload = {
      title: formValue.title,
      property_type_id: property_type_id,
      property_subtype_id: property_subtype_id,
      addresses: formValue.addresses.map((addr) => ({
        address_type: addr.address_type || 'address_1',
        street_address: addr.street_address,
        city: addr.city,
        country: addr.country,
        ...(addr.state ? { state: addr.state } : {}),
        ...(addr.zip_code ? { zip_code: addr.zip_code } : {}),
      })),
    };

    if (formValue.description) createDto.description = formValue.description;
    if (formValue.security_deposit_amount)
      createDto.security_deposit_amount = +formValue.security_deposit_amount;
    if (formValue.account_number) createDto.account_number = formValue.account_number;
    if (formValue.account_type) createDto.account_type = formValue.account_type;
    if (formValue.account_holder_name)
      createDto.account_holder_name = formValue.account_holder_name;

    // Financial fields
    if (formValue.monthly_rent) createDto.monthly_rent = +formValue.monthly_rent;
    if (formValue.currency) createDto.currency = formValue.currency;

    // Property details
    if (formValue.square_meters) createDto.square_meters = +formValue.square_meters;
    if (formValue.bedrooms) createDto.bedrooms = +formValue.bedrooms;
    if (formValue.bathrooms) createDto.bathrooms = +formValue.bathrooms;
    if (formValue.parking_spaces) createDto.parking_spaces = +formValue.parking_spaces;
    if (formValue.year_built) createDto.year_built = +formValue.year_built;
    if (formValue.is_furnished !== undefined) createDto.is_furnished = formValue.is_furnished;

    // Location
    if (formValue.latitude) createDto.latitude = +formValue.latitude;
    if (formValue.longitude) createDto.longitude = +formValue.longitude;

    // Amenities
    if (formValue.amenities?.length) createDto.amenities = formValue.amenities;
    if (formValue.included_items?.length) createDto.included_items = formValue.included_items;

    // Property rules
    const propertyRules: PropertyRulesPayload = {};
    if (formValue.pets_allowed !== undefined) propertyRules.pets_allowed = formValue.pets_allowed;
    if (formValue.smoking_allowed !== undefined)
      propertyRules.smoking_allowed = formValue.smoking_allowed;
    if (formValue.max_occupants) propertyRules.max_occupants = +formValue.max_occupants;
    if (formValue.min_lease_months) propertyRules.min_lease_months = +formValue.min_lease_months;
    if (Object.keys(propertyRules).length > 0) createDto.property_rules = propertyRules;

    // Owners - solo si tienen datos completos
    if (formValue.new_owners && formValue.new_owners.length > 0) {
      const validOwners = formValue.new_owners.filter(
        (owner) => owner.name && owner.primary_email && owner.phone_number,
      );
      if (validOwners.length > 0) createDto.new_owners = validOwners;
    }

    // Para edición, copiar createDto sin campos exclusivos de create
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { new_owners, ...updateDto } = createDto;

    const operation =
      this.modalMode === 'create'
        ? this.propertyService.createProperty(createDto as unknown as Record<string, unknown>)
        : this.propertyService.updateProperty(
            this.selectedProperty!.id,
            updateDto as unknown as Record<string, unknown>,
          );

    operation.subscribe({
      next: (savedProperty) => {
        // Si hay imágenes seleccionadas, subirlas después (tanto en crear como en editar)
        if (this.selectedImages.length > 0) {
          const uploads = this.selectedImages.map((img) =>
            this.propertyService.uploadPropertyImage(savedProperty.id, img),
          );
          forkJoin(uploads).subscribe({
            next: () => this.finishSave(this.modalMode),
            error: () => {
              this.isSubmitting.set(false);
              const action = this.modalMode === 'create' ? 'creada' : 'actualizada';
              this.toast.warning(`Propiedad ${action}, pero algunas imágenes no se pudieron subir`);
              this.loadProperties();
              this.closeModal();
            },
          });
        } else {
          this.finishSave(this.modalMode);
        }
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        const errorMessage = this.resolveErrorMessage(error, 'Error desconocido');
        const action = this.modalMode === 'create' ? 'crear' : 'actualizar';
        this.toast.error(`Error al ${action} propiedad: ${errorMessage}`);
      },
    });
  }

  viewPropertyDetail(property: Property): void {
    const tenantSlug = this.slugService.getSlug() || 'soft-prueba';
    this.router.navigate([`/${tenantSlug}/propiedades`, property.id]);
  }

  deleteProperty(property: Property): void {
    this.deleteConfirmProperty.set(property);
  }

  confirmDelete(): void {
    const property = this.deleteConfirmProperty();
    if (!property) return;
    this.deleteConfirmProperty.set(null);

    this.propertyService.deleteProperty(property.id).subscribe({
      next: () => {
        this.loadProperties();
        this.toast.success('Propiedad eliminada exitosamente');
      },
      error: (error: unknown) => {
        this.toast.error(
          `Error al eliminar: ${this.resolveErrorMessage(error, 'Error desconocido')}`,
        );
      },
    });
  }

  cancelDelete(): void {
    this.deleteConfirmProperty.set(null);
  }

  private finishSave(mode: 'create' | 'edit'): void {
    this.loadProperties();
    this.closeModal();
    this.isSubmitting.set(false);
    const msg =
      mode === 'create' ? 'Propiedad creada exitosamente' : 'Propiedad actualizada exitosamente';
    this.toast.success(msg);
  }

  toggleStatus(property: Property): void {
    const newStatus = property.active ? PropertyStatus.INACTIVO : PropertyStatus.DISPONIBLE;
    const newActive = !property.active;

    this.propertyService.updatePropertyStatus(property.id, newStatus, newActive).subscribe({
      next: () => {
        this.loadProperties();
        const msg = newActive ? 'Propiedad activada exitosamente' : 'Propiedad desactivada';
        this.toast.success(msg);
      },
      error: (error: unknown) => {
        this.toast.error(
          `Error al actualizar estado: ${this.resolveErrorMessage(error, 'Error desconocido')}`,
        );
      },
    });
  }

  private markFormGroupTouched(formGroup: FormGroup | FormArray): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private resolveErrorMessage(error: unknown, fallback: string): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'error' in error &&
      typeof (error as { error?: { message?: unknown } }).error?.message === 'string'
    ) {
      return (error as { error: { message: string } }).error.message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return fallback;
  }

  private scrollToValidationErrors(): void {
    setTimeout(() => {
      const panel = document.querySelector('.validation-error-panel');
      if (panel) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 80);
  }
  getPropertyAddress(property: Property): string {
    if (property && property.addresses && property.addresses.length > 0) {
      const addr = property.addresses[0];
      return `${addr.street_address || ''}, ${addr.city || ''}, ${addr.country || ''}`;
    }
    return 'Sin dirección';
  }

  /** Construye la URL de imagen de una propiedad (uso interno, llamar solo al cargar datos) */
  private buildImageUrl(property: Property): string {
    let imagePath: string | null = null;

    if (property.first_image) {
      imagePath = property.first_image;
    } else if (property.images && Array.isArray(property.images) && property.images.length > 0) {
      imagePath = property.images[0];
    }

    if (imagePath) {
      if (imagePath.startsWith('http')) return imagePath;
      const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
      return `http://localhost:3000${normalizedPath}`;
    }

    return '';
  }

  /** Retorna la URL de imagen pre-computada (seguro llamar desde template) */
  getPropertyImage(property: Property): string {
    return this.propertyImageMap().get(property.id) ?? '';
  }

  getPropertyPrice(property: Property): string {
    const price = property.monthly_rent || property.monthly_rent_amount;
    if (price) return this.formatService.formatCurrency(price);
    return 'N/A';
  }

  getPropertyArea(property: Property): string {
    const area = property.square_meters || property.total_area;
    return area ? `${area} m²` : 'N/A';
  }

  onImageLoad(_property: Property): void {}

  onImageError(property: Property, _url: string): void {
    this.propertyImageMap.update((map) => {
      const next = new Map(map);
      next.delete(property.id);
      return next;
    });
  }

  getStatusBadgeClass(status: PropertyStatus | undefined): string {
    if (!status) return 'bg-gray-100 text-gray-800';
    const classes: Record<PropertyStatus, string> = {
      [PropertyStatus.DISPONIBLE]: 'bg-green-100 text-green-800',
      [PropertyStatus.OCUPADO]: 'bg-blue-100 text-blue-800',
      [PropertyStatus.MANTENIMIENTO]: 'bg-yellow-100 text-yellow-800',
      [PropertyStatus.RESERVADO]: 'bg-purple-100 text-purple-800',
      [PropertyStatus.INACTIVO]: 'bg-gray-100 text-gray-800',
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusBadgeKey(status: PropertyStatus | undefined): string {
    if (!status) return 'default';
    const map: Record<PropertyStatus, string> = {
      [PropertyStatus.DISPONIBLE]: 'disponible',
      [PropertyStatus.OCUPADO]: 'ocupado',
      [PropertyStatus.MANTENIMIENTO]: 'mantenimiento',
      [PropertyStatus.RESERVADO]: 'reservado',
      [PropertyStatus.INACTIVO]: 'inactivo',
    };
    return map[status] || 'default';
  }

  getStatusTone(status: PropertyStatus | undefined): AppStatusTone {
    switch (status) {
      case PropertyStatus.DISPONIBLE:
        return 'success';
      case PropertyStatus.OCUPADO:
      case PropertyStatus.RESERVADO:
        return 'info';
      case PropertyStatus.MANTENIMIENTO:
        return 'warning';
      case PropertyStatus.INACTIVO:
      default:
        return 'neutral';
    }
  }

  // Helper methods para validación visual
  hasError(fieldName: string): boolean {
    const field = this.propertyForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.propertyForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'Este campo es requerido';
    if (field.errors['email']) return 'Email inválido';
    if (field.errors['min']) return `Valor mínimo: ${field.errors['min'].min}`;
    if (field.errors['max']) return `Valor máximo: ${field.errors['max'].max}`;
    return 'Campo inválido';
  }

  getAddressError(index: number, fieldName: string): string {
    const addressArray = this.propertyForm.get('addresses') as FormArray;
    if (!addressArray || addressArray.length === 0 || index >= addressArray.length) {
      return '';
    }
    const field = addressArray.at(index)?.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    if (field.errors['required']) return 'Este campo es requerido';
    return 'Campo inválido';
  }

  trackByIndex(index: number): number {
    return index;
  }
}
