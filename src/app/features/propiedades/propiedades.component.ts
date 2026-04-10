import {
  Component,
  OnInit,
  signal,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
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
import { PropertyService } from '../../core/services/admin/property.service';
import { AuthService } from '../../core/services/auth.service';
import { SlugService } from '../../core/services/slug.service';
import {
  Property,
  PropertyFilters,
  PropertyStatus,
  PropertyType,
  PropertySubtype,
} from '../../core/models/property.model';

@Component({
  selector: 'app-propiedades',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    LucideAngularModule,
  ],
  templateUrl: './propiedades.component.html',
  styleUrl: './propiedades.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropiedadesComponent implements OnInit {
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

  // Validation & confirmation state
  validationErrors = signal<string[]>([]);
  deleteConfirmProperty = signal<Property | null>(null);

  // Mapa de campos a etiquetas legibles
  private readonly fieldLabels: Record<string, string> = {
    title: 'Título',
    property_type_id: 'Tipo de Propiedad',
    property_subtype_id: 'Subtipo',
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
  propertyImageMap = new Map<number, string>();

  isLoading = signal(false); // Deprecated, split into isListLoading and isSubmitting
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
    sort_by: 'created_at' as any,
    sort_order: 'DESC',
    page: 1,
    limit: 50,
  };

  propertyForm: FormGroup;
  PropertyStatus = PropertyStatus;
  statusOptions = Object.values(PropertyStatus); // Para filtros de búsqueda

  constructor(
    private propertyService: PropertyService,
    private authService: AuthService,
    private slugService: SlugService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
  ) {
    this.propertyForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadProperties();
    this.loadPropertyTypes();
    this.loadPropertySubtypes();

    // Handle edit query param from property detail page
    this.route.queryParams.subscribe((params) => {
      const editId = params['edit'];
      if (editId) {
        const id = parseInt(editId, 10);
        this.propertyService.getAdminPropertyById(id).subscribe({
          next: (property) => {
            if (property) {
              this.openEditModal(property);
            }
          },
        });
        // Clean up the query param
        this.router.navigate([], { relativeTo: this.route, queryParams: {} });
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
      monthly_rent: [null],
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
        // Pre-computar URLs de imágenes para evitar cálculos en cada ciclo de change detection
        this.propertyImageMap.clear();
        data.forEach((prop) => this.propertyImageMap.set(prop.id, this.buildImageUrl(prop)));
        this.isListLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('❌ Error loading properties:', error);
        this.isListLoading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  loadPropertyTypes(): void {
    this.propertyService.getPropertyTypes().subscribe({
      next: (types) => {
        this.propertyTypes.set(types);
      },
      error: (error) => console.error('❌ Error loading property types:', error),
    });
  }

  loadPropertySubtypes(): void {
    this.propertyService.getPropertySubtypes().subscribe({
      next: (subtypes) => {
        this.propertySubtypes.set(subtypes);
      },
      error: (error) => console.error('❌ Error loading property subtypes:', error),
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

  clearFilters(): void {
    this.filters = {
      search: '',
      status: undefined,
      property_type_id: undefined,
      sort_by: 'created_at' as any,
      sort_order: 'DESC',
      page: 1,
      limit: 50,
    };
    this.loadProperties();
  }

  openCreateModal(): void {
    console.log('🔵 openCreateModal called');
    this.modalMode = 'create';
    this.selectedProperty = null;
    this.filteredSubtypes.set([]);

    // Cerrar modal primero si estaba abierto
    this.showModal.set(false);

    // Recrear el formulario completamente para evitar problemas con FormArrays
    this.propertyForm = this.createForm();

    console.log(
      '✅ Form recreated - Addresses:',
      this.addresses?.length,
      'Owners:',
      this.owners?.length,
    );

    // Pequeño delay para asegurar que el DOM esté listo
    setTimeout(() => {
      this.showModal.set(true);
      console.log('✅ Modal opened');
    }, 10);
  }

  openEditModal(property: Property): void {
    console.log('🔵 openEditModal called for property:', property.id);
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
        this.cdr.markForCheck();
      },
      error: () => {
        // Si falla, usar los datos del listado
        this.populateEditForm(property);
        this.cdr.markForCheck();
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
      monthly_rent: [p.monthly_rent ?? null],
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

    // Pequeño delay para asegurar que el DOM esté listo
    setTimeout(() => {
      this.showModal.set(true);
      console.log('✅ Edit modal opened with full data');
    }, 10);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedProperty = null;
    this.selectedImages = [];
    this.validationErrors.set([]);
  }

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const filesArray = Array.from(input.files);
      // Validar máximo 10 imágenes
      if (filesArray.length > 10) {
        this.snackBar.open('Máximo 10 imágenes permitidas', 'Cerrar', { duration: 4000 });
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
        this.snackBar.open(
          'Solo se permiten imágenes JPG, PNG, GIF, WebP menores a 5MB',
          'Cerrar',
          { duration: 5000 },
        );
        this.selectedImages = this.selectedImages.filter((file) => !invalidFiles.includes(file));
      }

      console.log('✅ Images selected:', this.selectedImages.length);
    }
  }

  saveProperty(): void {
    console.log('🔵 saveProperty() ejecutado');

    // Marcar todos los campos como touched para mostrar errores
    this.markFormGroupTouched(this.propertyForm);

    // Mostrar estado del formulario
    console.log('📋 Form valid:', this.propertyForm.valid);
    console.log('📋 Form value:', this.propertyForm.value);

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

    console.log('✅ Formulario válido, procediendo a enviar...');

    this.isSubmitting.set(true);
    const formValue = this.propertyForm.value;

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

    console.log('✅ Validaciones pasadas, construyendo objeto JSON...');

    // Construir objeto JSON con los campos que acepta el backend (CreatePropertyDto)
    const createDto: any = {
      title: formValue.title,
      property_type_id: property_type_id,
      property_subtype_id: property_subtype_id,
      addresses: formValue.addresses.map((addr: any) => ({
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
    const propertyRules: any = {};
    if (formValue.pets_allowed !== undefined) propertyRules.pets_allowed = formValue.pets_allowed;
    if (formValue.smoking_allowed !== undefined)
      propertyRules.smoking_allowed = formValue.smoking_allowed;
    if (formValue.max_occupants) propertyRules.max_occupants = +formValue.max_occupants;
    if (formValue.min_lease_months) propertyRules.min_lease_months = +formValue.min_lease_months;
    if (Object.keys(propertyRules).length > 0) createDto.property_rules = propertyRules;

    // Owners - solo si tienen datos completos
    if (formValue.new_owners && formValue.new_owners.length > 0) {
      const validOwners = formValue.new_owners.filter(
        (o: any) => o.name && o.primary_email && o.phone_number,
      );
      if (validOwners.length > 0) createDto.new_owners = validOwners;
    }

    console.log('📤 Enviando JSON:', createDto);
    console.log('🚀 Enviando request...');

    // Para edición, copiar createDto sin campos exclusivos de create
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { new_owners, existing_owners, ...updateDto } = createDto;

    const operation =
      this.modalMode === 'create'
        ? this.propertyService.createProperty(createDto)
        : this.propertyService.updateProperty(this.selectedProperty!.id, updateDto);

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
              this.snackBar.open(
                `Propiedad ${action}, pero algunas imágenes no se pudieron subir`,
                'Cerrar',
                { duration: 6000 },
              );
              this.loadProperties();
              this.closeModal();
              this.cdr.markForCheck();
            },
          });
        } else {
          this.finishSave(this.modalMode);
        }
      },
      error: (error) => {
        this.isSubmitting.set(false);
        const errorMessage = error.message || 'Error desconocido';
        const action = this.modalMode === 'create' ? 'crear' : 'actualizar';
        this.snackBar.open(`Error al ${action} propiedad: ${errorMessage}`, 'Cerrar', {
          duration: 6000,
          panelClass: 'snack-error',
        });
        this.cdr.markForCheck();
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
        this.snackBar.open('Propiedad eliminada exitosamente', 'Cerrar', {
          duration: 4000,
          panelClass: 'snack-success',
        });
      },
      error: (error) => {
        this.snackBar.open(`Error al eliminar: ${error.message}`, 'Cerrar', {
          duration: 5000,
          panelClass: 'snack-error',
        });
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
    this.snackBar.open(msg, 'Cerrar', { duration: 4000, panelClass: 'snack-success' });
  }

  toggleStatus(property: Property): void {
    const newStatus = property.active ? PropertyStatus.INACTIVO : PropertyStatus.DISPONIBLE;
    const newActive = !property.active;

    this.propertyService.updatePropertyStatus(property.id, newStatus, newActive).subscribe({
      next: () => {
        this.loadProperties();
        const msg = newActive ? 'Propiedad activada exitosamente' : 'Propiedad desactivada';
        this.snackBar.open(msg, 'Cerrar', { duration: 3000, panelClass: 'snack-success' });
      },
      error: (error) => {
        this.snackBar.open(`Error al actualizar estado: ${error.message}`, 'Cerrar', {
          duration: 5000,
          panelClass: 'snack-error',
        });
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
    return this.propertyImageMap.get(property.id) ?? '';
  }

  getPropertyPrice(property: Property): string {
    const price = property.monthly_rent || property.monthly_rent_amount;
    if (price) {
      const currency = property.currency || 'BOB';
      return `${currency} ${price.toLocaleString('es-BO')}`;
    }
    return 'N/A';
  }

  getPropertyArea(property: Property): string {
    const area = property.square_meters || property.total_area;
    return area ? `${area} m²` : 'N/A';
  }

  onImageLoad(property: Property): void {
    console.log('✅ Image loaded successfully for:', property.title);
  }

  onImageError(property: Property, url: string): void {
    console.error('❌ Error loading image for:', property.title, 'URL:', url);
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
