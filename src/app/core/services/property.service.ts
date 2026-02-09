import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import {
  Property,
  PropertyType,
  PropertySubtype,
  PropertyStatus,
  PropertyFilters,
  RentalApplication,
  TenantInfo
} from '../models/property.model';
import { ApiHttpService } from './api-http.service';

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private favoritesSubject = new BehaviorSubject<Set<number>>(new Set());
  public favorites$ = this.favoritesSubject.asObservable();

  // Default tenant slug - puede ser configurado dinámicamente
  private tenantSlug = 'mi-inmobiliaria';

  constructor(private apiHttp: ApiHttpService) {
    this.loadFavoritesFromStorage();
  }

  /**
   * Configurar el slug del tenant/organización
   */
  setTenantSlug(slug: string): void {
    this.tenantSlug = slug;
  }

  /**
   * Obtener el slug del tenant actual
   */
  getTenantSlug(): string {
    return this.tenantSlug;
  }

  /**
   * Obtener información del tenant/organización
   */
  getTenantInfo(slug?: string): Observable<TenantInfo> {
    const tenantSlug = slug || this.tenantSlug;
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

    const endpoint = `${this.tenantSlug}/catalog/properties`;
    
    return this.apiHttp.get<Property[]>(endpoint, params).pipe(
      map(properties => properties.map(p => this.transformProperty(p))),
      catchError(error => {
        console.error('Error loading properties:', error);
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
    const endpoint = `${this.tenantSlug}/catalog/properties/${id}`;
    
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
    return this.apiHttp.get<PropertyType[]>(`${this.tenantSlug}/admin/property-types`).pipe(
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
    return this.apiHttp.get<PropertySubtype[]>(`${this.tenantSlug}/admin/property-subtypes`, params).pipe(
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
    if (!property.addresses) property.addresses = [];

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
