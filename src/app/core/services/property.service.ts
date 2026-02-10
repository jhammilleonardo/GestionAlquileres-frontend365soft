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

    // Asegurar que arrays existan
    if (!property.images) property.images = [];
    if (!property.amenities) property.amenities = [];
    if (!property.included_items) property.included_items = [];
    if (!property.addresses || property.addresses.length === 0) {
      property.addresses = [];
      console.warn('Propiedad sin direcciones:', property.id, property.title);
    }

    // Si la respuesta tiene property_type_name/code en lugar del objeto, construirlo
    if (property.property_type_name && !property.property_type) {
      property.property_type = {
        id: property.property_type_id,
        name: property.property_type_name,
        description: property.property_type_code
      };
    }

    if (property.property_subtype_name && !property.property_subtype) {
      property.property_subtype = {
        id: property.property_subtype_id,
        name: property.property_subtype_name,
        description: property.property_subtype_code
      };
    }

    // Asegurar que active tenga un valor
    if (property.active === undefined) {
      property.active = property.status === 'DISPONIBLE';
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
}
