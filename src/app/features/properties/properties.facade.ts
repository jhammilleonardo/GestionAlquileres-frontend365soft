import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { forkJoin } from 'rxjs';

import { PropertyService } from '../../core/services/admin/property.service';
import { SlugService } from '../../core/services/slug.service';
import {
  Property,
  PropertyFilters,
  PropertyStatus,
  PropertySubtype,
  PropertyType,
  SortOption,
} from '../../core/models/property.model';
import { getApiErrorMessage } from '../../core/http/http-error.util';
import { AppSelectOption } from '../../shared/ui/select/select.component';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { buildPropertySavePayloads } from './mappers/property-save.mapper';
import { PropertyFormValue } from './models/property-form.model';

/**
 * Rangos alineados con la precisión de las columnas numeric en PostgreSQL.
 * Sin estos límites, un valor demasiado grande provoca "numeric field overflow" (500) en el backend.
 */
const MONEY_MAX = 99_999_999.99; // numeric(10,2)
const COORD_LAT = [Validators.min(-90), Validators.max(90)]; // numeric(10,8)
const COORD_LNG = [Validators.min(-180), Validators.max(180)]; // numeric(11,8)
const MONEY = [Validators.min(0), Validators.max(MONEY_MAX)];
const COUNT = [Validators.min(0), Validators.max(999)];
const YEAR = [Validators.min(1800), Validators.max(2100)];

@Injectable()
export class PropertiesFacade {
  private readonly propertyService = inject(PropertyService);
  private readonly slugService = inject(SlugService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly validationErrors = signal<string[]>([]);
  readonly deleteConfirmProperty = signal<Property | null>(null);
  readonly properties = signal<Property[]>([]);
  readonly propertyTypes = signal<PropertyType[]>([]);
  readonly propertySubtypes = signal<PropertySubtype[]>([]);
  readonly filteredSubtypes = signal<PropertySubtype[]>([]);
  private readonly propertyImageMap = signal<Map<number, string>>(new Map());

  readonly isListLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly showModal = signal(false);

  modalMode: 'create' | 'edit' = 'create';
  selectedProperty: Property | null = null;
  readonly selectedImages = signal<File[]>([]);
  /** Imágenes ya guardadas en el servidor (modo edición): url para mostrar, path para borrar. */
  readonly existingImages = signal<{ url: string; path: string }[]>([]);

  filters: PropertyFilters = this.createDefaultFilters();
  propertyForm: FormGroup = this.createForm();

  readonly statusOptions = Object.values(PropertyStatus);
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
    this.openEditFromQueryParam();
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
        this.toast.error(this.transloco.translate('propiedades.actions.loadError'));
      },
    });
  }

  loadPropertyTypes(): void {
    this.propertyService.getPropertyTypes().subscribe({
      next: (types) => this.propertyTypes.set(types),
      error: () => {
        this.toast.error(this.transloco.translate('propiedades.actions.loadTypesError'));
      },
    });
  }

  loadPropertySubtypes(): void {
    this.propertyService.getPropertySubtypes().subscribe({
      next: (subtypes) => this.propertySubtypes.set(subtypes),
      error: () =>
        this.toast.error(this.transloco.translate('propiedades.actions.loadSubtypesError')),
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
    this.filters = this.createDefaultFilters();
    this.loadProperties();
  }

  openCreateModal(): void {
    this.modalMode = 'create';
    this.selectedProperty = null;
    this.selectedImages.set([]);
    this.existingImages.set([]);
    this.filteredSubtypes.set([]);
    this.showModal.set(false);
    this.propertyForm = this.createForm();
    setTimeout(() => this.showModal.set(true), 10);
  }

  openEditModal(property: Property): void {
    this.modalMode = 'edit';
    this.selectedProperty = property;
    this.selectedImages.set([]);
    this.existingImages.set([]);
    this.showModal.set(false);

    this.propertyService.getAdminPropertyById(property.id).subscribe({
      next: (fullProperty) => {
        const p = fullProperty || property;
        this.selectedProperty = p;
        this.populateEditForm(p);
      },
      error: () => this.populateEditForm(property),
    });
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedProperty = null;
    this.selectedImages.set([]);
    this.existingImages.set([]);
    this.validationErrors.set([]);
  }

  /**
   * Recibe la lista completa de imágenes ya validadas y editadas por el uploader.
   * La validación de tipo, tamaño y cantidad vive en el componente AppImageUploader.
   */
  onImagesChanged(files: File[]): void {
    this.selectedImages.set(files);
  }

  saveProperty(): void {
    this.markFormGroupTouched(this.propertyForm);

    if (this.propertyForm.invalid) {
      this.validationErrors.set(this.collectValidationErrors());
      this.scrollToValidationErrors();
      return;
    }

    this.validationErrors.set([]);
    this.isSubmitting.set(true);
    const formValue = this.propertyForm.getRawValue() as PropertyFormValue;
    const propertyTypeId = formValue.property_type_id ? +formValue.property_type_id : null;
    const propertySubtypeId = formValue.property_subtype_id ? +formValue.property_subtype_id : null;

    if (!formValue.title || !propertyTypeId || !propertySubtypeId) {
      const missing: string[] = [];
      if (!formValue.title)
        missing.push(this.transloco.translate('propiedades.validation.fields.title'));
      if (!propertyTypeId)
        missing.push(this.transloco.translate('propiedades.validation.fields.propertyType'));
      if (!propertySubtypeId)
        missing.push(this.transloco.translate('propiedades.validation.fields.subtype'));
      this.validationErrors.set(missing);
      this.isSubmitting.set(false);
      this.scrollToValidationErrors();
      return;
    }

    if (!formValue.addresses || formValue.addresses.length === 0) {
      this.validationErrors.set([
        this.transloco.translate('propiedades.validation.addressRequired'),
      ]);
      this.isSubmitting.set(false);
      this.scrollToValidationErrors();
      return;
    }

    const { createDto, updateDto } = buildPropertySavePayloads(formValue);
    const operation =
      this.modalMode === 'create'
        ? this.propertyService.createProperty(createDto as unknown as Record<string, unknown>)
        : this.propertyService.updateProperty(
            this.selectedProperty!.id,
            updateDto as unknown as Record<string, unknown>,
          );

    operation.subscribe({
      next: (savedProperty) => this.uploadImagesOrFinish(savedProperty.id),
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        const errorMessage = getApiErrorMessage(
          error,
          this.transloco.translate('common.unknownError'),
        );
        const key =
          this.modalMode === 'create'
            ? 'propiedades.actions.createError'
            : 'propiedades.actions.updateError';
        this.toast.error(this.transloco.translate(key, { message: errorMessage }));
      },
    });
  }

  viewPropertyDetail(property: Property): void {
    const tenantSlug = this.slugService.getSlug() || 'soft-prueba';
    void this.router.navigate([`/${tenantSlug}/propiedades`, property.id]);
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
        this.toast.success(this.transloco.translate('propiedades.actions.deleted'));
      },
      error: (error: unknown) => {
        const message = getApiErrorMessage(error, this.transloco.translate('common.unknownError'));
        this.toast.error(this.transloco.translate('propiedades.actions.deleteError', { message }));
      },
    });
  }

  cancelDelete(): void {
    this.deleteConfirmProperty.set(null);
  }

  toggleStatus(property: Property): void {
    const newStatus = property.active ? PropertyStatus.INACTIVO : PropertyStatus.DISPONIBLE;
    const newActive = !property.active;

    this.propertyService.updatePropertyStatus(property.id, newStatus, newActive).subscribe({
      next: () => {
        this.loadProperties();
        const key = newActive ? 'propiedades.actions.activated' : 'propiedades.actions.deactivated';
        this.toast.success(this.transloco.translate(key));
      },
      error: (error: unknown) => {
        const message = getApiErrorMessage(error, this.transloco.translate('common.unknownError'));
        this.toast.error(this.transloco.translate('propiedades.actions.statusError', { message }));
      },
    });
  }

  getPropertyImage(property: Property): string {
    return this.propertyImageMap().get(property.id) ?? '';
  }

  onImageError(property: Property): void {
    this.propertyImageMap.update((map) => {
      const next = new Map(map);
      next.delete(property.id);
      return next;
    });
  }

  private createDefaultFilters(): PropertyFilters {
    return {
      search: '',
      status: undefined,
      property_type_id: undefined,
      sort_by: SortOption.CREATED_AT,
      sort_order: 'DESC',
      page: 1,
      limit: 50,
    };
  }

  private createForm(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      description: [''],
      property_type_id: ['', Validators.required],
      property_subtype_id: ['', Validators.required],
      active: [true],
      monthly_rent: [null, MONEY],
      currency: ['BOB'],
      security_deposit_amount: [null, MONEY],
      account_number: [''],
      account_type: [''],
      account_holder_name: [''],
      square_meters: [null, MONEY],
      bedrooms: [null, COUNT],
      bathrooms: [null, COUNT],
      parking_spaces: [null, COUNT],
      year_built: [null, YEAR],
      is_furnished: [false],
      pets_allowed: [false],
      smoking_allowed: [false],
      max_occupants: [null, COUNT],
      min_lease_months: [null, COUNT],
      amenities: [[]],
      included_items: [[]],
      latitude: [null, COORD_LAT],
      longitude: [null, COORD_LNG],
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

  private get addresses(): FormArray {
    return this.propertyForm.get('addresses') as FormArray;
  }

  private populateEditForm(p: Property): void {
    this.propertyForm = this.fb.group({
      title: [p.title, Validators.required],
      description: [p.description],
      property_type_id: [p.property_type_id, Validators.required],
      property_subtype_id: [p.property_subtype_id, Validators.required],
      active: [p.active],
      monthly_rent: [p.monthly_rent ?? null, MONEY],
      currency: [p.currency || 'BOB'],
      security_deposit_amount: [p.security_deposit_amount ?? null, MONEY],
      account_number: [p.account_number || ''],
      account_type: [p.account_type || ''],
      account_holder_name: [p.account_holder_name || ''],
      square_meters: [p.square_meters ?? null, MONEY],
      bedrooms: [p.bedrooms ?? null, COUNT],
      bathrooms: [p.bathrooms ?? null, COUNT],
      parking_spaces: [p.parking_spaces ?? null, COUNT],
      year_built: [p.year_built ?? null, YEAR],
      is_furnished: [p.is_furnished ?? false],
      pets_allowed: [p.property_rules?.pets_allowed ?? false],
      smoking_allowed: [p.property_rules?.smoking_allowed ?? false],
      max_occupants: [p.property_rules?.max_occupants ?? null, COUNT],
      min_lease_months: [p.property_rules?.min_lease_months ?? null, COUNT],
      amenities: [p.amenities || []],
      included_items: [p.included_items || []],
      latitude: [p.latitude, COORD_LAT],
      longitude: [p.longitude, COORD_LNG],
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

    const paths = Array.isArray(p.images) ? p.images : [];
    this.existingImages.set(paths.map((path) => ({ path, url: this.toImageUrl(path) })));

    this.onPropertyTypeChange(p.property_type_id, true);
    setTimeout(() => this.showModal.set(true), 10);
  }

  /**
   * Quita una imagen ya guardada en el servidor y refresca la galería del modal.
   * Recibe el índice porque el backend borra por ruta una sola ocurrencia: si
   * hubiera rutas repetidas, debemos quitar exactamente la misma entrada en la UI.
   */
  removeExistingImage(index: number): void {
    const property = this.selectedProperty;
    const target = this.existingImages()[index];
    if (!property || !target) return;

    this.propertyService.deletePropertyImage(property.id, target.path).subscribe({
      next: () => {
        this.existingImages.update((images) => images.filter((_, i) => i !== index));
        this.loadProperties();
        this.toast.success(this.transloco.translate('propiedades.actions.imageRemoved'));
      },
      error: (error: unknown) => {
        const message = getApiErrorMessage(error, this.transloco.translate('common.unknownError'));
        this.toast.error(
          this.transloco.translate('propiedades.actions.imageRemoveError', { message }),
        );
      },
    });
  }

  /** Construye la URL completa de una imagen a partir de su ruta almacenada. */
  private toImageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `http://localhost:3000${normalized}`;
  }

  private uploadImagesOrFinish(savedPropertyId: number): void {
    const images = this.selectedImages();
    if (images.length === 0) {
      this.finishSave(this.modalMode);
      return;
    }

    const uploads = images.map((img) =>
      this.propertyService.uploadPropertyImage(savedPropertyId, img),
    );

    forkJoin(uploads).subscribe({
      next: () => this.finishSave(this.modalMode),
      error: () => {
        this.isSubmitting.set(false);
        const key =
          this.modalMode === 'create'
            ? 'propiedades.actions.createdImagesFailed'
            : 'propiedades.actions.updatedImagesFailed';
        this.toast.warning(this.transloco.translate(key));
        this.loadProperties();
        this.closeModal();
      },
    });
  }

  private finishSave(mode: 'create' | 'edit'): void {
    this.loadProperties();
    this.closeModal();
    this.isSubmitting.set(false);
    const key = mode === 'create' ? 'propiedades.actions.created' : 'propiedades.actions.updated';
    this.toast.success(this.transloco.translate(key));
  }

  private collectValidationErrors(): string[] {
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

    return errorKeys.map((key) => this.translateFieldKey(key));
  }

  private translateFieldKey(key: string): string {
    const addrMatch = key.match(/^addresses\[(\d+)\]\.(.+)$/);
    if (addrMatch) {
      const addrFieldLabels: Record<string, string> = {
        street_address: this.transloco.translate('propiedades.validation.fields.streetAddress'),
        city: this.transloco.translate('propiedades.validation.fields.city'),
        country: this.transloco.translate('propiedades.validation.fields.country'),
      };
      const idx = +addrMatch[1] + 1;
      const fieldName = addrFieldLabels[addrMatch[2]] || addrMatch[2];
      return this.transloco.translate('propiedades.validation.addressField', {
        index: idx,
        field: fieldName,
      });
    }
    const labelKey = this.getFieldLabelKey(key);
    return labelKey ? this.transloco.translate(labelKey) : key;
  }

  private getFieldLabelKey(key: string): string | null {
    switch (key) {
      case 'title':
        return 'propiedades.validation.fields.title';
      case 'property_type_id':
        return 'propiedades.validation.fields.propertyType';
      case 'property_subtype_id':
        return 'propiedades.validation.fields.subtype';
      case 'monthly_rent':
        return 'propiedades.validation.fields.monthlyRent';
      default:
        return null;
    }
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

  private buildImageUrl(property: Property): string {
    let imagePath: string | null = null;

    if (property.first_image) {
      imagePath = property.first_image;
    } else if (property.images && Array.isArray(property.images) && property.images.length > 0) {
      imagePath = property.images[0];
    }

    return imagePath ? this.toImageUrl(imagePath) : '';
  }

  private openEditFromQueryParam(): void {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const editId = params['edit'] as string | undefined;
      if (!editId) return;

      const id = parseInt(editId, 10);
      this.propertyService.getAdminPropertyById(id).subscribe({
        next: (property) => {
          if (property) this.openEditModal(property);
        },
      });
      void this.router.navigate([], { relativeTo: this.route, queryParams: {} });
    });
  }
}
