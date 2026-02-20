import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { PropertyService } from '../../core/services/property.service';
import { AuthService } from '../../core/services/auth.service';
import { Property, PropertyFilters, PropertyStatus, PropertyType, PropertySubtype } from '../../core/models/property.model';

@Component({
  selector: 'app-propiedades',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './propiedades.component.html',
  styleUrl: './propiedades.component.scss'
})
export class PropiedadesComponent implements OnInit {
  properties = signal<Property[]>([]);
  propertyTypes = signal<PropertyType[]>([]);
  propertySubtypes = signal<PropertySubtype[]>([]);
  filteredSubtypes = signal<PropertySubtype[]>([]);

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
    limit: 50
  };

  propertyForm: FormGroup;
  PropertyStatus = PropertyStatus;
  statusOptions = Object.values(PropertyStatus); // Para filtros de búsqueda

  constructor(
    private propertyService: PropertyService,
    private authService: AuthService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.propertyForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadProperties();
    this.loadPropertyTypes();
    this.loadPropertySubtypes();
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
      new_owners: this.fb.array([this.createOwnerGroup()])
    });
  }

  private createAddressGroup(): FormGroup {
    return this.fb.group({
      address_type: ['address_1'],
      street_address: ['', Validators.required],
      city: ['', Validators.required],
      state: [''],
      zip_code: [''],
      country: ['', Validators.required]
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
      is_primary: [true]
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
    console.log('🔍 Loading properties with filters:', this.filters);
    this.propertyService.getAdminProperties(this.filters).subscribe({
      next: (data) => {
        console.log('✅ Properties loaded successfully:', data);
        // Log detallado de cada propiedad para debug
        data.forEach((prop, index) => {
          const imagesLength = Array.isArray(prop.images) ? prop.images.length : (prop.images ? Object.keys(prop.images).length : 0);
          console.log(`Property ${index + 1} [ID:${prop.id}]:`, {
            title: prop.title,
            first_image: prop.first_image,
            images_length: imagesLength,
            images: prop.images
          });
        });
        this.properties.set(data);
        this.isListLoading.set(false);
      },
      error: (error) => {
        console.error('❌ Error loading properties:', error);
        this.isListLoading.set(false);
        alert('Error al cargar propiedades: ' + error.message);
      }
    });
  }

  loadPropertyTypes(): void {
    this.propertyService.getPropertyTypes().subscribe({
      next: (types) => {
        console.log('✅ Property types loaded:', types);
        this.propertyTypes.set(types);
      },
      error: (error) => console.error('❌ Error loading property types:', error)
    });
  }

  loadPropertySubtypes(): void {
    this.propertyService.getPropertySubtypes().subscribe({
      next: (subtypes) => {
        console.log('✅ Property subtypes loaded:', subtypes);
        this.propertySubtypes.set(subtypes);
      },
      error: (error) => console.error('❌ Error loading property subtypes:', error)
    });
  }

  onPropertyTypeChange(typeId: number): void {
    if (!typeId) {
      this.filteredSubtypes.set([]);
      this.propertyForm.patchValue({ property_subtype_id: '' });
      return;
    }
    const filtered = this.propertySubtypes().filter(st => st.property_type_id === +typeId);
    this.filteredSubtypes.set(filtered);
    this.propertyForm.patchValue({ property_subtype_id: '' });
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
      limit: 50
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

    console.log('✅ Form recreated - Addresses:', this.addresses?.length, 'Owners:', this.owners?.length);

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

    // Recrear el formulario completamente con los campos actualizados
    this.propertyForm = this.fb.group({
      title: [property.title, Validators.required],
      description: [property.description],
      property_type_id: [property.property_type_id, Validators.required],
      property_subtype_id: [property.property_subtype_id, Validators.required],
      active: [property.active],
      // Financial fields
      monthly_rent: [(property as any).monthly_rent || null],
      currency: [(property as any).currency || 'BOB'],
      security_deposit_amount: [property.security_deposit_amount],
      account_number: [property.account_number || ''],
      account_type: [property.account_type || ''],
      account_holder_name: [property.account_holder_name || ''],
      // Property details
      square_meters: [(property as any).square_meters || null],
      bedrooms: [(property as any).bedrooms || null],
      bathrooms: [(property as any).bathrooms || null],
      parking_spaces: [(property as any).parking_spaces || null],
      year_built: [(property as any).year_built || null],
      is_furnished: [(property as any).is_furnished || false],
      // Rules (extract from property_rules object)
      pets_allowed: [(property as any).property_rules?.pets_allowed || false],
      smoking_allowed: [(property as any).property_rules?.smoking_allowed || false],
      max_occupants: [(property as any).property_rules?.max_occupants || null],
      min_lease_months: [(property as any).property_rules?.min_lease_months || null],
      amenities: [property.amenities || []],
      included_items: [property.included_items || []],
      // Location
      latitude: [property.latitude],
      longitude: [property.longitude],
      // Relations
      addresses: this.fb.array(
        property.addresses && property.addresses.length > 0
          ? property.addresses.map(addr => this.fb.group({
            address_type: [addr.address_type || 'address_1'],
            street_address: [addr.street_address, Validators.required],
            city: [addr.city, Validators.required],
            state: [addr.state || ''],
            zip_code: [addr.zip_code || ''],
            country: [addr.country, Validators.required]
          }))
          : [this.createAddressGroup()]
      ),
      new_owners: this.fb.array([this.createOwnerGroup()])
    });

    this.onPropertyTypeChange(property.property_type_id);

    // Pequeño delay para asegurar que el DOM esté listo
    setTimeout(() => {
      this.showModal.set(true);
      console.log('✅ Edit modal opened');
    }, 10);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedProperty = null;
    this.selectedImages = []; // Limpiar imágenes seleccionadas
  }

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const filesArray = Array.from(input.files);
      // Validar máximo 10 imágenes
      if (filesArray.length > 10) {
        alert('Máximo 10 imágenes permitidas');
        this.selectedImages = filesArray.slice(0, 10);
      } else {
        this.selectedImages = filesArray;
      }

      // Validar tamaño y formato
      const invalidFiles = this.selectedImages.filter(file => {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB
        return !validTypes.includes(file.type) || file.size > maxSize;
      });

      if (invalidFiles.length > 0) {
        alert('Algunos archivos no son válidos. Solo se permiten imágenes JPG, PNG, GIF, WebP menores a 5MB');
        this.selectedImages = this.selectedImages.filter(file => !invalidFiles.includes(file));
      }

      console.log('✅ Images selected:', this.selectedImages.length);
    }
  }

  saveProperty(): void {
    // Marcar todos los campos como touched para mostrar errores
    this.markFormGroupTouched(this.propertyForm);

    if (this.propertyForm.invalid) {
      // Encontrar y enfocar el primer campo con error
      this.scrollToFirstError();
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.propertyForm.value;

    // Convertir valores a tipos correctos
    const property_type_id = formValue.property_type_id ? +formValue.property_type_id : null;
    const property_subtype_id = formValue.property_subtype_id ? +formValue.property_subtype_id : null;

    // Validar campos requeridos
    if (!formValue.title || !property_type_id || !property_subtype_id) {
      alert('Por favor complete los campos requeridos');
      this.isSubmitting.set(false);
      return;
    }

    // Validar que haya al menos una dirección (REQUERIDO por el backend)
    if (!formValue.addresses || formValue.addresses.length === 0) {
      alert('Debe agregar al menos una dirección');
      this.isSubmitting.set(false);
      return;
    }

    // Crear FormData para multipart/form-data
    const formData = new FormData();

    // Campos requeridos
    formData.append('title', formValue.title);
    formData.append('property_type_id', property_type_id.toString());
    formData.append('property_subtype_id', property_subtype_id.toString());

    // Addresses - NestJS con multipart/form-data necesita notación especial para arrays
    // En lugar de JSON.stringify, enviamos cada campo con notación de índice
    formValue.addresses.forEach((addr: any, index: number) => {
      formData.append(`addresses[${index}][address_type]`, addr.address_type || 'address_1');
      formData.append(`addresses[${index}][street_address]`, addr.street_address);
      formData.append(`addresses[${index}][city]`, addr.city);
      formData.append(`addresses[${index}][country]`, addr.country);
      if (addr.state) formData.append(`addresses[${index}][state]`, addr.state);
      if (addr.zip_code) formData.append(`addresses[${index}][zip_code]`, addr.zip_code);
    });

    console.log('🏠 Total addresses added:', formValue.addresses.length);

    // Campos opcionales - Solo agregar si tienen valor
    if (formValue.description) {
      formData.append('description', formValue.description);
    }

    // Financial fields
    if (formValue.monthly_rent) {
      formData.append('monthly_rent', formValue.monthly_rent.toString());
    }
    if (formValue.currency) {
      formData.append('currency', formValue.currency);
    }
    if (formValue.security_deposit_amount) {
      formData.append('security_deposit_amount', formValue.security_deposit_amount.toString());
    }
    if (formValue.account_number) {
      formData.append('account_number', formValue.account_number);
    }
    if (formValue.account_type) {
      formData.append('account_type', formValue.account_type);
    }
    if (formValue.account_holder_name) {
      formData.append('account_holder_name', formValue.account_holder_name);
    }

    // Property details
    if (formValue.square_meters) {
      formData.append('square_meters', formValue.square_meters.toString());
    }
    if (formValue.bedrooms) {
      formData.append('bedrooms', formValue.bedrooms.toString());
    }
    if (formValue.bathrooms) {
      formData.append('bathrooms', formValue.bathrooms.toString());
    }
    if (formValue.parking_spaces) {
      formData.append('parking_spaces', formValue.parking_spaces.toString());
    }
    if (formValue.year_built) {
      formData.append('year_built', formValue.year_built.toString());
    }
    if (formValue.is_furnished !== null && formValue.is_furnished !== undefined) {
      formData.append('is_furnished', formValue.is_furnished.toString());
    }

    // Property rules - construir objeto desde campos individuales
    const propertyRules: any = {};
    if (formValue.pets_allowed !== null && formValue.pets_allowed !== undefined) {
      propertyRules.pets_allowed = formValue.pets_allowed;
    }
    if (formValue.smoking_allowed !== null && formValue.smoking_allowed !== undefined) {
      propertyRules.smoking_allowed = formValue.smoking_allowed;
    }
    if (formValue.max_occupants) {
      propertyRules.max_occupants = formValue.max_occupants;
    }
    if (formValue.min_lease_months) {
      propertyRules.min_lease_months = formValue.min_lease_months;
    }

    // Solo agregar property_rules si hay al menos una regla definida
    if (Object.keys(propertyRules).length > 0) {
      formData.append('property_rules', JSON.stringify(propertyRules));
      console.log('📋 Property rules:', propertyRules);
    }

    // Location
    if (formValue.latitude) {
      formData.append('latitude', formValue.latitude.toString());
    }
    if (formValue.longitude) {
      formData.append('longitude', formValue.longitude.toString());
    }

    // Amenities y included_items como JSON string
    if (formValue.amenities && formValue.amenities.length > 0) {
      formData.append('amenities', JSON.stringify(formValue.amenities));
    }
    if (formValue.included_items && formValue.included_items.length > 0) {
      formData.append('included_items', JSON.stringify(formValue.included_items));
    }

    // NOTA: El endpoint /with-images NO acepta new_owners
    // Los owners deben agregarse después de crear la propiedad usando otro endpoint
    // Owners - solo si tienen datos completos
    // if (formValue.new_owners && formValue.new_owners.length > 0) {
    //   const validOwners = formValue.new_owners.filter((owner: any) =>
    //     owner.name && owner.primary_email && owner.phone_number
    //   );
    //   if (validOwners.length > 0) {
    //     formData.append('new_owners', JSON.stringify(validOwners));
    //   }
    // }

    // Agregar imágenes
    if (this.selectedImages.length > 0) {
      this.selectedImages.forEach(image => {
        formData.append('images', image);
      });
      console.log('✅ Added', this.selectedImages.length, 'images to FormData');
    }

    // Log FormData contents (debugging)
    console.log('📤 Sending FormData with:');
    formData.forEach((value, key) => {
      if (value instanceof File) {
        console.log(`  ${key}: [File] ${value.name} (${(value.size / 1024).toFixed(1)} KB)`);
      } else {
        console.log(`  ${key}:`, value);
      }
    });

    // Usar el nuevo endpoint para crear con imágenes
    const operation = this.modalMode === 'create'
      ? this.propertyService.createPropertyWithImages(formData)
      : this.propertyService.updateProperty(this.selectedProperty!.id, formValue);

    operation.subscribe({
      next: () => {
        this.loadProperties();
        this.closeModal();
        this.isSubmitting.set(false);
        alert(`Propiedad ${this.modalMode === 'create' ? 'creada' : 'actualizada'} exitosamente`);
      },
      error: (error) => {
        console.error('Error saving property:', error);
        this.isSubmitting.set(false);
        const errorMessage = error.error?.message || error.message || 'Error desconocido';
        alert(`Error al ${this.modalMode === 'create' ? 'crear' : 'actualizar'} propiedad: ${errorMessage}`);
      }
    });
  }

  viewPropertyDetail(property: Property): void {
    const tenantSlug = this.authService.getTenantSlug() || 'soft-prueba';
    this.router.navigate([`/${tenantSlug}/admin/propiedades`, property.id]);
  }

  deleteProperty(property: Property): void {
    if (!confirm(`¿Está seguro de eliminar la propiedad "${property.title}"?`)) {
      return;
    }

    this.isSubmitting.set(true); // Usamos isSubmitting para bloquear la UI globalmente o localmente
    this.propertyService.deleteProperty(property.id).subscribe({
      next: () => {
        this.loadProperties();
        this.isSubmitting.set(false);
        alert('Propiedad eliminada exitosamente');
      },
      error: (error) => {
        console.error('Error deleting property:', error);
        this.isSubmitting.set(false);
        alert(`Error al eliminar propiedad: ${error.message}`);
      }
    });
  }

  toggleStatus(property: Property): void {
    const newStatus = property.active ? PropertyStatus.INACTIVO : PropertyStatus.DISPONIBLE;
    const newActive = !property.active;

    this.propertyService.updatePropertyStatus(property.id, newStatus, newActive).subscribe({
      next: () => {
        this.loadProperties();
        alert(`Propiedad ${newActive ? 'activada' : 'desactivada'} exitosamente`);
      },
      error: (error) => {
        console.error('Error updating property status:', error);
        alert(`Error al actualizar estado: ${error.message}`);
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup | FormArray): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }
  private scrollToFirstError(): void {
    // Buscar el primer elemento con la clase de error
    setTimeout(() => {
      const firstError = document.querySelector('.border-red-500');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Intentar hacer foco si es un input
        if (firstError instanceof HTMLInputElement || firstError instanceof HTMLSelectElement) {
          firstError.focus();
        }
      }
    }, 100);
  }
  getPropertyAddress(property: Property): string {
    if (property && property.addresses && property.addresses.length > 0) {
      const addr = property.addresses[0];
      return `${addr.street_address || ''}, ${addr.city || ''}, ${addr.country || ''}`;
    }
    return 'Sin dirección';
  }

  getPropertyImage(property: Property): string {
    let imagePath: string | null = null;

    // Intentar obtener first_image del listado (prioridad)
    if (property.first_image) {
      imagePath = property.first_image;
      console.log('📸 Using first_image:', imagePath);
    }
    // Si no, intentar con images array
    else if (property.images && Array.isArray(property.images) && property.images.length > 0) {
      imagePath = property.images[0];
      console.log('📸 Using images[0]:', imagePath);
    }

    if (imagePath) {
      // Si la imagen ya tiene la URL completa, usarla directamente
      if (imagePath.startsWith('http')) {
        return imagePath;
      }

      // Construir URL completa
      // El path viene como: storage/properties/soft-prueba/8/filename.jpg
      // Y necesitamos: http://localhost:3000/storage/properties/soft-prueba/8/filename.jpg
      const fullUrl = `http://localhost:3000/${imagePath}`;

      console.log('📸 Full URL:', fullUrl);
      return fullUrl;
    }

    console.log('⚠️ No image found for property:', property.id, property.title);
    return '';
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
    if (!status) {
      return 'bg-gray-100 text-gray-800';
    }
    const classes: Record<PropertyStatus, string> = {
      [PropertyStatus.DISPONIBLE]: 'bg-green-100 text-green-800',
      [PropertyStatus.OCUPADO]: 'bg-blue-100 text-blue-800',
      [PropertyStatus.MANTENIMIENTO]: 'bg-yellow-100 text-yellow-800',
      [PropertyStatus.RESERVADO]: 'bg-purple-100 text-purple-800',
      [PropertyStatus.INACTIVO]: 'bg-gray-100 text-gray-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
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
