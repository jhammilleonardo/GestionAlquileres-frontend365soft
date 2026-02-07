import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
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

  isLoading = signal(false);
  showModal = signal(false);
  modalMode: 'create' | 'edit' = 'create';
  selectedProperty: Property | null = null;

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
    private fb: FormBuilder
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
      monthly_rent_amount: [null],
      security_deposit_amount: [null],
      account_number: [''],
      account_type: [''],
      account_holder_name: [''],
      total_area: [null],
      built_area: [null],
      availability_date: [null],
      latitude: [null],
      longitude: [null],
      images: [[]],
      amenities: [[]],
      included_items: [[]],
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
    return this.propertyForm.get('addresses') as FormArray;
  }

  get owners(): FormArray {
    return this.propertyForm.get('new_owners') as FormArray;
  }

  loadProperties(): void {
    this.isLoading.set(true);
    console.log('🔍 Loading properties with filters:', this.filters);
    this.propertyService.getAdminProperties(this.filters).subscribe({
      next: (data) => {
        console.log('✅ Properties loaded successfully:', data);
        this.properties.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('❌ Error loading properties:', error);
        this.isLoading.set(false);
        alert('Error al cargar propiedades: ' + error.message);
      }
    });
  }

  loadPropertyTypes(): void {
    this.propertyService.getPropertyTypes().subscribe({
      next: (types) => this.propertyTypes.set(types),
      error: (error) => console.error('Error loading property types:', error)
    });
  }

  loadPropertySubtypes(): void {
    this.propertyService.getPropertySubtypes().subscribe({
      next: (subtypes) => this.propertySubtypes.set(subtypes),
      error: (error) => console.error('Error loading property subtypes:', error)
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
    this.modalMode = 'create';
    this.selectedProperty = null;
    this.propertyForm.reset({
      property_type_id: '',
      property_subtype_id: '',
      status: PropertyStatus.DISPONIBLE,
      active: true,
      images: [],
      amenities: [],
      included_items: []
    });
    this.filteredSubtypes.set([]);
    this.showModal.set(true);
  }

  openEditModal(property: Property): void {
    this.modalMode = 'edit';
    this.selectedProperty = property;

    // Populate form with property data
    this.propertyForm.patchValue({
      title: property.title,
      description: property.description,
      property_type_id: property.property_type_id,
      property_subtype_id: property.property_subtype_id,
      status: property.status,
      active: property.active,
      monthly_rent_amount: property.monthly_rent_amount,
      security_deposit_amount: property.security_deposit_amount,
      total_area: property.total_area,
      built_area: property.built_area,
      availability_date: property.availability_date,
      latitude: property.latitude,
      longitude: property.longitude,
      images: property.images || [],
      amenities: property.amenities || [],
      included_items: property.included_items || []
    });

    this.onPropertyTypeChange(property.property_type_id);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedProperty = null;
  }

  saveProperty(): void {
    // Marcar todos los campos como touched para mostrar errores
    this.markFormGroupTouched(this.propertyForm);

    if (this.propertyForm.invalid) {
      // Encontrar y enfocar el primer campo con error
      this.scrollToFirstError();
      return;
    }

    this.isLoading.set(true);
    const formData = this.propertyForm.value;

    // Convertir valores vacíos a tipos correctos
    const property_type_id = formData.property_type_id ? +formData.property_type_id : null;
    const property_subtype_id = formData.property_subtype_id ? +formData.property_subtype_id : null;

    // Validar campos requeridos manualmente
    if (!formData.title || !property_type_id || !property_subtype_id) {
      this.isLoading.set(false);
      return;
    }

    // Validar que haya al menos una dirección
    if (!formData.addresses || formData.addresses.length === 0) {
      alert('Debe agregar al menos una dirección');
      this.isLoading.set(false);
      return;
    }

    // Limpiar y validar direcciones
    const cleanedAddresses = formData.addresses.map((addr: any) => ({
      address_type: addr.address_type || 'address_1', // Asegurar que tenga un valor
      street_address: addr.street_address,
      city: addr.city,
      state: addr.state || null,
      zip_code: addr.zip_code || null,
      country: addr.country
    }));

    // Limpiar datos según formato de la API
    const cleanData: any = {
      title: formData.title,
      property_type_id: property_type_id,
      property_subtype_id: property_subtype_id,
      addresses: cleanedAddresses
    };

    // Campos opcionales
    if (formData.description) cleanData.description = formData.description;
    if (formData.monthly_rent_amount) cleanData.monthly_rent_amount = formData.monthly_rent_amount;
    if (formData.security_deposit_amount) cleanData.security_deposit_amount = formData.security_deposit_amount;
    if (formData.account_number) cleanData.account_number = formData.account_number;
    if (formData.account_type) cleanData.account_type = formData.account_type;
    if (formData.account_holder_name) cleanData.account_holder_name = formData.account_holder_name;
    if (formData.total_area) cleanData.total_area = formData.total_area;
    if (formData.built_area) cleanData.built_area = formData.built_area;
    if (formData.availability_date) cleanData.availability_date = formData.availability_date;
    if (formData.latitude) cleanData.latitude = formData.latitude;
    if (formData.longitude) cleanData.longitude = formData.longitude;
    if (formData.amenities && formData.amenities.length > 0) cleanData.amenities = formData.amenities;
    if (formData.included_items && formData.included_items.length > 0) cleanData.included_items = formData.included_items;

    // Agregar new_owners solo si tienen datos completos
    if (formData.new_owners && formData.new_owners.length > 0) {
      const validOwners = formData.new_owners.filter((owner: any) =>
        owner.name && owner.primary_email && owner.phone_number
      );
      if (validOwners.length > 0) {
        cleanData.new_owners = validOwners;
      }
    }

    const operation = this.modalMode === 'create'
      ? this.propertyService.createProperty(cleanData)
      : this.propertyService.updateProperty(this.selectedProperty!.id, cleanData);

    operation.subscribe({
      next: () => {
        this.loadProperties();
        this.closeModal();
        this.isLoading.set(false);
        alert(`Propiedad ${this.modalMode === 'create' ? 'creada' : 'actualizada'} exitosamente`);
      },
      error: (error) => {
        console.error('Error saving property:', error);
        this.isLoading.set(false);
        const errorMessage = error.error?.message || error.message || 'Error desconocido';
        alert(`Error al ${this.modalMode === 'create' ? 'crear' : 'actualizar'} propiedad: ${errorMessage}`);
      }
    });
  }

  deleteProperty(property: Property): void {
    if (!confirm(`¿Está seguro de eliminar la propiedad "${property.title}"?`)) {
      return;
    }

    this.isLoading.set(true);
    this.propertyService.deleteProperty(property.id).subscribe({
      next: () => {
        this.loadProperties();
        this.isLoading.set(false);
        alert('Propiedad eliminada exitosamente');
      },
      error: (error) => {
        console.error('Error deleting property:', error);
        this.isLoading.set(false);
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
    if (property.addresses && property.addresses.length > 0) {
      const addr = property.addresses[0];
      return `${addr.street_address}, ${addr.city}, ${addr.country}`;
    }
    return 'Sin dirección';
  }

  getStatusBadgeClass(status: PropertyStatus): string {
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
    const field = addressArray.at(index)?.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    if (field.errors['required']) return 'Este campo es requerido';
    return 'Campo inválido';
  }
}
