import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import {
  Property,
  PropertyType,
  PropertySubtype,
  PropertyStatus,
  PropertyFilters,
  RentalApplication,
  TenantInfo,
  PaginatedResponse
} from '../models/property.model';
import { ApiHttpService } from './api-http.service';
import { SlugService } from './slug.service';

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private favoritesSubject = new BehaviorSubject<Set<number>>(new Set());
  public favorites$ = this.favoritesSubject.asObservable();

  private apiHttp = inject(ApiHttpService);
  private slugService = inject(SlugService);

  constructor() {
    this.loadFavoritesFromStorage();
  }

  /**
   * Configurar el slug del tenant/organización
   */
  setTenantSlug(slug: string): void {
    this.slugService.setSlug(slug);
  }

  /**
   * Obtener el slug del tenant actual
   */
  getTenantSlug(): string {
    return this.slugService.getSlug() || '';
  }

  /**
   * Obtener información del tenant/organización
   */
  getTenantInfo(slug?: string): Observable<TenantInfo> {
    const tenantSlug = slug || this.slugService.getSlug();
    if (!tenantSlug) {
      throw new Error('No tenant slug available');
    }
    return this.apiHttp.get<TenantInfo>(`tenants/slug/${tenantSlug}`);
  }

  /**
   * Obtener propiedades disponibles con filtros
   */
  getFilteredProperties(filters: PropertyFilters): Observable<Property[]> {
    const params: any = {};

    // Mapear filtros al formato del backend
    if (filters.status) params.status = filters.status;
    if (filters.property_type_id) params.property_type_id = filters.property_type_id;
    if (filters.property_subtype_id) params.property_subtype_id = filters.property_subtype_id;
    if (filters.city) params.city = filters.city;
    if (filters.country) params.country = filters.country;
    if (filters.search) params.search = filters.search;
    if (filters.sort_by) params.sort_by = filters.sort_by;
    if (filters.sort_order) params.sort_order = filters.sort_order;
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;

    const endpoint = this.slugService.buildApiEndpoint('catalog/properties');

    console.log('PropertyService - Cargando propiedades');
    console.log('  Slug actual:', this.slugService.getSlug());
    console.log('  Endpoint:', endpoint);
    console.log('  Filtros:', params);

    return this.apiHttp.get<PaginatedResponse<Property>>(endpoint, params).pipe(
      tap(response => {
        console.log('PropertyService - Respuesta recibida:', response);
        console.log('PropertyService - Total de propiedades:', response.total);
      }),
      map(response => response.items.map(p => this.transformProperty(p))),
      catchError(error => {
        console.error('PropertyService - Error loading properties:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener todas las propiedades disponibles
   */
  getProperties(): Observable<Property[]> {
    return this.getFilteredProperties({ status: PropertyStatus.DISPONIBLE });
  }

  /**
   * Obtener detalle de una propiedad por ID
   */
  getPropertyById(id: number): Observable<Property | undefined> {
    const endpoint = this.slugService.buildApiEndpoint(`catalog/properties/${id}`);

    return this.apiHttp.get<Property>(endpoint).pipe(
      map(property => this.transformProperty(property)),
      catchError(error => {
        console.error(`Error loading property ${id}:`, error);
        return of(undefined);
      })
    );
  }

  /**
   * Obtener tipos de propiedad
   */
  getPropertyTypes(): Observable<PropertyType[]> {
    const endpoint = this.slugService.buildApiEndpoint('admin/property-types');
    return this.apiHttp.get<PropertyType[]>(endpoint).pipe(
      catchError(error => {
        console.error('Error loading property types:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener subtipos de propiedad
   */
  getPropertySubtypes(typeId?: number): Observable<PropertySubtype[]> {
    const params = typeId ? { typeId } : {};
    const endpoint = this.slugService.buildApiEndpoint('admin/property-subtypes');
    return this.apiHttp.get<PropertySubtype[]>(endpoint, params).pipe(
      catchError(error => {
        console.error('Error loading property subtypes:', error);
        return of([]);
      })
    );
  }

  /**
   * Enviar solicitud de alquiler
   */
  submitApplication(application: RentalApplication): Observable<{ success: boolean; message: string }> {
    // TODO: Implementar endpoint para enviar solicitudes
    // Por ahora retornamos un Observable simulado
    console.log('Application submitted:', application);

    return of({
      success: true,
      message: 'Su solicitud ha sido enviada correctamente. Nos pondremos en contacto pronto.'
    }).pipe(
      map(response => response),
      catchError(error => {
        console.error('Error submitting application:', error);
        return of({
          success: false,
          message: 'Error al enviar la solicitud. Por favor intente nuevamente.'
        });
      })
    );
  }

  /**
   * Alternar favorito
   */
  toggleFavorite(propertyId: number): void {
    const currentFavorites = new Set(this.favoritesSubject.value);
    if (currentFavorites.has(propertyId)) {
      currentFavorites.delete(propertyId);
    } else {
      currentFavorites.add(propertyId);
    }
    this.favoritesSubject.next(currentFavorites);
    this.saveFavoritesToStorage(currentFavorites);
  }

  /**
   * Verificar si una propiedad es favorita
   */
  isFavorite(propertyId: number): Observable<boolean> {
    return this.favorites$.pipe(
      map(favorites => favorites.has(propertyId))
    );
  }

  /**
   * Obtener favoritos
   */
  getFavorites(): Observable<Set<number>> {
    return this.favorites$;
  }

  /**
   * Transformar propiedad del backend al formato local si es necesario
   */
  private transformProperty(property: any): Property {
    // Asegurar que las fechas sean objetos Date
    if (typeof property.created_at === 'string') {
      property.created_at = new Date(property.created_at);
    }
    if (typeof property.updated_at === 'string') {
      property.updated_at = new Date(property.updated_at);
    }
    if (property.availability_date && typeof property.availability_date === 'string') {
      property.availability_date = new Date(property.availability_date);
    }

    // Normalizar images según el formato que venga del backend
    if (typeof property.images === 'string') {
      // Puede venir como JSON string: '["url1","url2"]' o comma-separated: 'url1,url2'
      try {
        const parsed = JSON.parse(property.images);
        property.images = Array.isArray(parsed) ? parsed : [];
      } catch {
        property.images = property.images ? property.images.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
      }
    } else if (property.images && typeof property.images === 'object' && !Array.isArray(property.images)) {
      // Objeto {0: "path", 1: "path"}
      const imagesObj = property.images as Record<string, string>;
      property.images = Object.keys(imagesObj).sort().map(key => imagesObj[key]);
    }

    // Asegurar que arrays existan
    if (!property.images || !Array.isArray(property.images)) property.images = [];
    if (!property.amenities || !Array.isArray(property.amenities)) property.amenities = [];
    if (!property.included_items || !Array.isArray(property.included_items)) property.included_items = [];

    // Asegurar addresses - agregar una dirección por defecto si no existe
    if (!property.addresses || !Array.isArray(property.addresses) || property.addresses.length === 0) {
      property.addresses = [{
        address_type: 'primary',
        street_address: 'Dirección no disponible',
        city: 'N/A',
        state: '',
        zip_code: '',
        country: ''
      }];
      console.warn('Propiedad sin direcciones, usando dirección por defecto:', property.id, property.title);
    }

    // Asegurar owners - agregar un owner por defecto si no existe
    if (!property.owners || !Array.isArray(property.owners) || property.owners.length === 0) {
      property.owners = [{
        id: 0,
        name: 'No disponible',
        company_name: '',
        is_company: false,
        primary_email: '',
        phone_number: '',
        secondary_email: '',
        secondary_phone: '',
        notes: '',
        ownership_percentage: 100,
        is_primary: true,
        created_at: new Date()
      }];
      console.warn('Propiedad sin owners, usando owner por defecto:', property.id, property.title);
    }

    // Si la respuesta tiene property_type_name/code en lugar del objeto, construirlo
    if (!property.property_type || !property.property_type.name) {
      if (property.property_type_name) {
        property.property_type = {
          id: property.property_type_id,
          name: property.property_type_name,
          description: property.property_type_code || ''
        };
      } else {
        // Crear objeto por defecto
        property.property_type = {
          id: property.property_type_id || 0,
          name: 'Tipo no especificado',
          description: ''
        };
      }
    }

    // Si la respuesta tiene property_subtype_name/code en lugar del objeto, construirlo
    if (!property.property_subtype || !property.property_subtype.name) {
      if (property.property_subtype_name) {
        property.property_subtype = {
          id: property.property_subtype_id,
          name: property.property_subtype_name,
          description: property.property_subtype_code || '',
          property_type_id: property.property_type_id
        };
      } else {
        // Crear objeto por defecto
        property.property_subtype = {
          id: property.property_subtype_id || 0,
          name: 'Subtipo no especificado',
          description: '',
          property_type_id: property.property_type_id
        };
      }
    }

    // Asegurar que active tenga un valor
    if (property.active === undefined) {
      property.active = property.status === 'DISPONIBLE';
    }

    // Asegurar description tenga un valor
    if (!property.description) {
      property.description = 'Sin descripción disponible';
    }

    return property as Property;
  }

  /**
   * Guardar favoritos en localStorage
   */
  private saveFavoritesToStorage(favorites: Set<number>): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('property_favorites', JSON.stringify(Array.from(favorites)));
      }
    } catch (error) {
      console.error('Error saving favorites to storage:', error);
    }
  }

  /**
   * Cargar favoritos desde localStorage
   */
  private loadFavoritesFromStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('property_favorites');
        if (stored) {
          const favArray = JSON.parse(stored) as number[];
          this.favoritesSubject.next(new Set(favArray));
        }
      }
    } catch (error) {
      console.error('Error loading favorites from storage:', error);
    }
  }

  // ==================== ADMIN CRUD METHODS ====================

  /**
   * Listar todas las propiedades (admin) con filtros
   */
  getAdminProperties(filters?: PropertyFilters): Observable<Property[]> {
    const params: any = {};

    if (filters) {
      if (filters.status) params.status = filters.status;
      if (filters.property_type_id) params.property_type_id = filters.property_type_id;
      if (filters.property_subtype_id) params.property_subtype_id = filters.property_subtype_id;
      if (filters.city) params.city = filters.city;
      if (filters.country) params.country = filters.country;
      if (filters.search) params.search = filters.search;
      if (filters.sort_by) params.sort_by = filters.sort_by;
      if (filters.sort_order) params.sort_order = filters.sort_order;
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;
    }

    const endpoint = this.slugService.buildApiEndpoint('admin/properties');

    // El backend devuelve {items: [], total, page, limit, pages}
    return this.apiHttp.get<{ items: Property[], total: number, page: number, limit: number, pages: number }>(endpoint, params).pipe(
      map(response => response.items.map(p => this.transformProperty(p))),
      catchError(error => {
        console.error('Error loading admin properties:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener detalle de una propiedad (admin)
   */
  getAdminPropertyById(id: number): Observable<Property | undefined> {
    const endpoint = this.slugService.buildApiEndpoint(`admin/properties/${id}`);

    return this.apiHttp.get<Property>(endpoint).pipe(
      map(property => this.transformProperty(property)),
      catchError(error => {
        console.error(`Error loading admin property ${id}:`, error);
        return of(undefined);
      })
    );
  }

  /**
   * Crear nueva propiedad (admin)
   */
  createProperty(propertyData: any): Observable<Property> {
    const endpoint = this.slugService.buildApiEndpoint('admin/properties');

    return this.apiHttp.post<Property>(endpoint, propertyData).pipe(
      map(property => this.transformProperty(property)),
      tap(() => console.log('Property created successfully')),
      catchError(error => {
        console.error('Error creating property:', error);
        throw error;
      })
    );
  }

  /**
   * Subir una imagen para una propiedad (admin) - multipart/form-data
   */
  uploadPropertyImage(propertyId: number, file: File): Observable<any> {
    const endpoint = this.slugService.buildApiEndpoint(`admin/properties/${propertyId}/images`);
    const formData = new FormData();
    formData.append('file', file);

    return this.apiHttp.post<any>(endpoint, formData).pipe(
      tap(() => console.log(`Image uploaded for property ${propertyId}`)),
      catchError(error => {
        console.error(`Error uploading image for property ${propertyId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Actualizar propiedad existente (admin)
   */
  updateProperty(id: number, propertyData: any): Observable<Property> {
    const endpoint = this.slugService.buildApiEndpoint(`admin/properties/${id}`);

    return this.apiHttp.patch<Property>(endpoint, propertyData).pipe(
      map(property => this.transformProperty(property)),
      tap(() => console.log(`Property ${id} updated successfully`)),
      catchError(error => {
        console.error(`Error updating property ${id}:`, error);
        throw error;
      })
    );
  }

  /**
   * Eliminar propiedad (admin)
   */
  deleteProperty(id: number): Observable<void> {
    const endpoint = this.slugService.buildApiEndpoint(`admin/properties/${id}`);

    return this.apiHttp.delete<void>(endpoint).pipe(
      tap(() => console.log(`Property ${id} deleted successfully`)),
      catchError(error => {
        console.error(`Error deleting property ${id}:`, error);
        throw error;
      })
    );
  }

  /**
   * Actualizar estado de una propiedad (admin)
   */
  updatePropertyStatus(id: number, status: PropertyStatus, active: boolean): Observable<Property> {
    return this.updateProperty(id, { status, active });
  }
}

