import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  Property,
  PropertyType,
  PropertySubtype,
  PropertyStatus,
  PropertyFilters,
  RentalApplication,
  TenantInfo,
  SortOption,
} from '../../models/property.model';
import { ApiClientService } from '../../http/api-client.service';
import { SlugService } from '../slug.service';
import { PropertyFavoritesService } from './property-favorites.service';

@Injectable({
  providedIn: 'root',
})
export class PropertyService {
  private favoritesSubject = new BehaviorSubject<Set<number>>(new Set());
  public favorites$ = this.favoritesSubject.asObservable();

  private apiClient = inject(ApiClientService);
  private slugService = inject(SlugService);
  private propertyFavorites = inject(PropertyFavoritesService);

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
    return this.apiClient.get<TenantInfo>(`tenants/slug/${tenantSlug}`);
  }

  /**
   * Obtener propiedades del catálogo público con filtros, orden y paginación.
   */
  getFilteredProperties(
    filters: PropertyFilters,
  ): Observable<{ items: Property[]; total: number }> {
    const params: Record<string, string | number> = {};

    // Mapear filtros al formato del catálogo público
    if (filters.status) params['status'] = filters.status;
    if (filters.city) params['city'] = filters.city;
    if (filters.country) params['country'] = filters.country;
    if (filters.search) params['search'] = filters.search;
    if (filters.min_price) params['min_price'] = filters.min_price;
    if (filters.max_price) params['max_price'] = filters.max_price;
    if (filters.bedrooms) params['bedrooms'] = filters.bedrooms;
    if (filters.rental_type && filters.rental_type !== 'any')
      params['rental_type'] = filters.rental_type;

    // Mapear ordenamiento
    if (filters.sort_by === SortOption.PRICE) {
      params['sort'] = filters.sort_order === 'ASC' ? 'price_asc' : 'price_desc';
    } else if (filters.sort_by === SortOption.CREATED_AT) {
      params['sort'] = 'newest';
    } else if (filters.sort_by === SortOption.AVAILABILITY) {
      params['sort'] = 'available';
    }

    if (filters.page) params['page'] = filters.page;
    if (filters.limit) params['limit'] = filters.limit;

    const endpoint = this.slugService.buildApiEndpoint('catalog/properties');

    return this.apiClient.get<unknown>(endpoint, { params }).pipe(
      map((response) => {
        // El backend puede devolver { data: [], total }, { items: [] } o un arreglo directo
        const body = this.asRecord(response);
        const rawItems = Array.isArray(response)
          ? (response as unknown[])
          : this.asArray(body['data'] ?? body['items']);
        const total = typeof body['total'] === 'number' ? body['total'] : rawItems.length;

        return {
          items: rawItems.map((item) => this.transformProperty(item)),
          total,
        };
      }),
      catchError(() => {
        return of({ items: [], total: 0 });
      }),
    );
  }

  /**
   * Obtener todas las propiedades disponibles
   */
  getProperties(): Observable<Property[]> {
    return this.getFilteredProperties({ status: PropertyStatus.DISPONIBLE }).pipe(
      map((result) => result.items),
    );
  }

  getPropertyById(id: number): Observable<Property | undefined> {
    const endpoint = this.slugService.buildApiEndpoint(`catalog/properties/${id}`);

    return this.apiClient.get<Property>(endpoint).pipe(
      map((property) => this.transformProperty(property)),
      catchError((_e) => {
        return of(undefined);
      }),
    );
  }

  /**
   * Obtener detalle de una propiedad por Slug (Público)
   */
  getPropertyBySlug(slug: string): Observable<Property | undefined> {
    const endpoint = this.slugService.buildApiEndpoint(`catalog/properties/${slug}`);

    return this.apiClient.get<Property>(endpoint).pipe(
      map((property) => this.transformProperty(property)),
      catchError(() => {
        return of(undefined);
      }),
    );
  }

  /**
   * Obtener tipos de propiedad
   */
  getPropertyTypes(): Observable<PropertyType[]> {
    const endpoint = this.slugService.buildApiEndpoint('admin/property-types');
    return this.apiClient.get<PropertyType[]>(endpoint);
  }

  getPropertySubtypes(typeId?: number): Observable<PropertySubtype[]> {
    const params = typeId ? { typeId } : {};
    const endpoint = this.slugService.buildApiEndpoint('admin/property-subtypes');
    return this.apiClient.get<PropertySubtype[]>(endpoint, { params });
  }

  /**
   * Enviar contacto de interés para una propiedad
   */
  submitPropertyContact(
    propertyId: number,
    contactData: { name: string; email: string; phone: string; message: string },
  ): Observable<unknown> {
    const endpoint = this.slugService.buildApiEndpoint(`catalog/properties/${propertyId}/contact`);
    return this.apiClient.post<unknown>(endpoint, contactData);
  }

  /**
   * Enviar solicitud de alquiler
   */
  submitApplication(
    application: RentalApplication,
  ): Observable<{ success: boolean; message: string }> {
    const endpoint = this.slugService.buildApiEndpoint('applications');
    const payload = this.toApplicationPayload(application);

    return this.apiClient.post<unknown>(endpoint, payload).pipe(
      map(() => ({
        success: true,
        message: 'Su solicitud ha sido enviada correctamente. Nos pondremos en contacto pronto.',
      })),
      catchError(() => {
        return of({
          success: false,
          message: 'Error al enviar la solicitud. Por favor intente nuevamente.',
        });
      }),
    );
  }

  private toApplicationPayload(application: RentalApplication): {
    property_id: number;
    personal_data: {
      full_name: string;
      phone: string;
      identity_document: string;
      current_address: string;
    };
    employment_data: {
      employer_name: string;
      position: string;
      monthly_income: number;
      employment_duration: string;
      employer_phone: string;
    };
    rental_history: {
      previous_address: string;
      previous_landlord_name: string;
      previous_landlord_phone: string;
      reason_for_leaving: string;
      previous_rent_amount: number;
    }[];
    references: { name: string; relationship: string; phone: string }[];
    additional_notes?: string;
  } {
    const applicant = application.applicantInfo;

    return {
      property_id: application.propertyId,
      personal_data: {
        full_name: `${applicant.firstName} ${applicant.lastName}`.trim(),
        phone: applicant.phone,
        identity_document: applicant.email,
        current_address: applicant.currentAddress,
      },
      employment_data: {
        employer_name: applicant.employmentStatus || 'No especificado',
        position: applicant.employmentStatus || 'No especificado',
        monthly_income: Number(applicant.monthlyIncome) || 0,
        employment_duration: 'No especificado',
        employer_phone: applicant.phone,
      },
      rental_history: [],
      references: [],
      additional_notes: application.additionalInfo || undefined,
    };
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
    return this.favorites$.pipe(map((favorites) => favorites.has(propertyId)));
  }

  /**
   * Obtener favoritos
   */
  getFavorites(): Observable<Set<number>> {
    return this.favorites$;
  }

  /**
   * Transformar propiedad del backend al formato local si es necesario.
   * El backend devuelve formatos variables (images como string/array/objeto,
   * montos como string), por eso se normaliza aquí en el borde del sistema.
   */
  private transformProperty(input: unknown): Property {
    const raw = this.asRecord(input);

    // Se preservan los campos originales (...raw) y se sobrescriben los que
    // requieren normalización por venir en formatos variables del backend.
    return {
      ...raw,
      created_at: this.toDate(raw['created_at']),
      updated_at: this.toDate(raw['updated_at']),
      availability_date: raw['availability_date']
        ? this.toDate(raw['availability_date'])
        : raw['availability_date'],
      images: this.normalizeImages(raw['images']),
      amenities: this.asArray(raw['amenities']),
      included_items: this.asArray(raw['included_items']),
      addresses: this.normalizeAddresses(raw['addresses']),
      owners: this.normalizeOwners(raw['owners']),
      units: this.normalizeUnits(raw['units']),
      property_type: this.normalizePropertyType(raw),
      property_subtype: this.normalizePropertySubtype(raw),
      active: raw['active'] === undefined ? raw['status'] === 'DISPONIBLE' : raw['active'],
      description: this.asString(raw['description']) || 'Sin descripción disponible',
    } as unknown as Property;
  }

  // ---- Helpers de normalización (borde del sistema: datos sin tipar) ----

  private asRecord(value: unknown): Record<string, unknown> {
    return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  }

  private asArray(value: unknown): unknown[] {
    return Array.isArray(value) ? (value as unknown[]) : [];
  }

  private asString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
  }

  private toDate(value: unknown): unknown {
    return typeof value === 'string' ? new Date(value) : value;
  }

  /** Normaliza images: array, JSON string, CSV string u objeto indexado → string[]. */
  private normalizeImages(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string');
    }
    if (typeof value === 'string') {
      try {
        const parsed: unknown = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.filter((item): item is string => typeof item === 'string');
        }
      } catch {
        /* no es JSON: se trata como CSV abajo */
      }
      return value
        .split(',')
        .map((segment) => segment.trim())
        .filter(Boolean);
    }
    if (value !== null && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      return Object.keys(obj)
        .sort()
        .map((key) => obj[key])
        .filter((item): item is string => typeof item === 'string');
    }
    return [];
  }

  private normalizeAddresses(value: unknown): unknown[] {
    const addresses = this.asArray(value);
    if (addresses.length > 0) {
      return addresses;
    }
    return [
      {
        address_type: 'primary',
        street_address: 'Dirección no disponible',
        city: 'N/A',
        state: '',
        zip_code: '',
        country: '',
      },
    ];
  }

  private normalizeOwners(value: unknown): unknown[] {
    const owners = this.asArray(value);
    if (owners.length > 0) {
      // Flatten: si el owner tiene rental_owner anidado, traer sus campos arriba
      return owners.map((item) => {
        const owner = this.asRecord(item);
        const rentalOwner = this.asRecord(owner['rental_owner']);
        return {
          ...owner,
          name:
            this.asString(owner['name']) || this.asString(rentalOwner['name']) || 'No disponible',
          primary_email:
            this.asString(owner['primary_email']) ||
            this.asString(rentalOwner['primary_email']) ||
            '',
          phone_number:
            this.asString(owner['phone_number']) ||
            this.asString(rentalOwner['phone_number']) ||
            '',
        };
      });
    }
    return [
      {
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
        created_at: new Date(),
      },
    ];
  }

  private normalizeUnits(value: unknown): unknown[] {
    return this.asArray(value).map((item) => {
      const unit = this.asRecord(item);
      return {
        ...unit,
        price_per_night: this.toNumberOrNull(unit['price_per_night']),
        cleaning_fee: this.toNumberOrNull(unit['cleaning_fee']),
        min_nights: this.toNumberOrNull(unit['min_nights']),
        max_nights: this.toNumberOrNull(unit['max_nights']),
      };
    });
  }

  private toNumberOrNull(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private normalizePropertyType(raw: Record<string, unknown>): unknown {
    const existing = this.asRecord(raw['property_type']);
    if (this.asString(existing['name'])) {
      return existing;
    }
    const name = this.asString(raw['property_type_name']);
    if (name) {
      return {
        id: raw['property_type_id'],
        name,
        description: this.asString(raw['property_type_code']) || '',
      };
    }
    return {
      id: raw['property_type_id'] || 0,
      name: 'Tipo no especificado',
      description: '',
    };
  }

  private normalizePropertySubtype(raw: Record<string, unknown>): unknown {
    const existing = this.asRecord(raw['property_subtype']);
    if (this.asString(existing['name'])) {
      return existing;
    }
    const name = this.asString(raw['property_subtype_name']);
    if (name) {
      return {
        id: raw['property_subtype_id'],
        name,
        description: this.asString(raw['property_subtype_code']) || '',
        property_type_id: raw['property_type_id'],
      };
    }
    return {
      id: raw['property_subtype_id'] || 0,
      name: 'Subtipo no especificado',
      description: '',
      property_type_id: raw['property_type_id'],
    };
  }

  /**
   * Guardar favoritos en localStorage
   */
  private saveFavoritesToStorage(favorites: Set<number>): void {
    this.propertyFavorites.save(favorites);
  }

  /**
   * Cargar favoritos desde localStorage
   */
  private loadFavoritesFromStorage(): void {
    this.favoritesSubject.next(this.propertyFavorites.load());
  }

  // ==================== SHARED HELPERS ====================

  /**
   * Construye la URL completa de una imagen de propiedad.
   */
  getPropertyImageUrl(property: Property, index: number = 0): string {
    let imagePath: string | null = null;

    if (property.images && Array.isArray(property.images) && property.images.length > index) {
      imagePath = property.images[index];
    } else if (
      property.images &&
      typeof property.images === 'object' &&
      Object.keys(property.images).length > index
    ) {
      const imagesRecord = property.images as unknown as Record<string, string>;
      const keys = Object.keys(imagesRecord);
      imagePath = imagesRecord[keys[index]];
    } else if (property.first_image && index === 0) {
      imagePath = property.first_image;
    }

    if (imagePath) {
      if (imagePath.startsWith('http')) return imagePath;
      const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
      // Usar host del backend
      return `http://localhost:3000${normalizedPath}`;
    }

    return '';
  }

  /**
   * Formatea la dirección completa de una propiedad.
   */
  getPropertyAddress(property: Property): string {
    if (property.addresses && property.addresses.length > 0) {
      const addr = property.addresses[0];
      return `${addr.street_address}, ${addr.city}${addr.state ? ', ' + addr.state : ''}`;
    }
    return '';
  }

  /**
   * Obtiene el nombre legible del tipo de propiedad.
   */
  getPropertyTypeName(property: Property): string {
    return property.property_type?.name || 'N/A';
  }

  /**
   * Obtiene el área formateada.
   */
  getPropertyArea(property: Property): string {
    const area = property.square_meters || property.total_area;
    return area ? `${area} m²` : 'N/A';
  }

  /**
   * Obtiene el precio formateado con moneda.
   */
  getPropertyPrice(property: Property): string {
    const price = property.monthly_rent || property.monthly_rent_amount;
    if (!price) return 'N/A';
    const currency = property.currency || 'BOB';
    return `${currency} ${price.toLocaleString()}`;
  }

  // ==================== ADMIN CRUD METHODS ====================

  /**
   * Listar todas las propiedades (admin) con filtros
   */
  getAdminProperties(filters?: PropertyFilters): Observable<Property[]> {
    const params: Record<string, string | number> = {};

    if (filters) {
      if (filters.status) params['status'] = filters.status;
      if (filters.property_type_id) params['property_type_id'] = filters.property_type_id;
      if (filters.property_subtype_id) params['property_subtype_id'] = filters.property_subtype_id;
      if (filters.city) params['city'] = filters.city;
      if (filters.country) params['country'] = filters.country;
      if (filters.search) params['search'] = filters.search;
      if (filters.sort_by) params['sort_by'] = filters.sort_by;
      if (filters.sort_order) params['sort_order'] = filters.sort_order;
      if (filters.page) params['page'] = filters.page;
      if (filters.limit) params['limit'] = filters.limit;
    }

    const endpoint = this.slugService.buildApiEndpoint('admin/properties');

    // El backend devuelve {items: [], total, page, limit, pages}
    return this.apiClient
      .get<{
        items: Property[];
        total: number;
        page: number;
        limit: number;
        pages: number;
      }>(endpoint, { params })
      .pipe(
        map((response) => response.items.map((p) => this.transformProperty(p))),
        catchError((_e) => {
          return of([]);
        }),
      );
  }

  /**
   * Obtener detalle de una propiedad (admin)
   */
  getAdminPropertyById(id: number): Observable<Property | undefined> {
    const endpoint = this.slugService.buildApiEndpoint(`admin/properties/${id}`);

    return this.apiClient.get<Property>(endpoint).pipe(
      map((property) => this.transformProperty(property)),
      catchError((_e) => {
        return of(undefined);
      }),
    );
  }

  /**
   * Crear nueva propiedad (admin)
   */
  createProperty(propertyData: Record<string, unknown>): Observable<Property> {
    const endpoint = this.slugService.buildApiEndpoint('admin/properties');

    return this.apiClient.post<Property>(endpoint, propertyData).pipe(
      map((property) => this.transformProperty(property)),
      catchError((error) => {
        throw error;
      }),
    );
  }

  /**
   * Subir una imagen para una propiedad (admin) - multipart/form-data
   */
  uploadPropertyImage(propertyId: number, file: File): Observable<Record<string, unknown>> {
    const endpoint = this.slugService.buildApiEndpoint(`admin/properties/${propertyId}/images`);
    const formData = new FormData();
    formData.append('file', file);

    return this.apiClient.post<Record<string, unknown>>(endpoint, formData).pipe(
      catchError((error) => {
        throw error;
      }),
    );
  }

  /**
   * Actualizar propiedad existente (admin)
   */
  updateProperty(id: number, propertyData: Record<string, unknown>): Observable<Property> {
    const endpoint = this.slugService.buildApiEndpoint(`admin/properties/${id}`);

    return this.apiClient.patch<Property>(endpoint, propertyData).pipe(
      map((property) => this.transformProperty(property)),
      catchError((error) => {
        throw error;
      }),
    );
  }

  /**
   * Eliminar propiedad (admin)
   */
  deleteProperty(id: number): Observable<void> {
    const endpoint = this.slugService.buildApiEndpoint(`admin/properties/${id}`);

    return this.apiClient.delete<void>(endpoint).pipe(
      catchError((error) => {
        throw error;
      }),
    );
  }

  /**
   * Actualizar estado de una propiedad (admin)
   */
  updatePropertyStatus(id: number, status: PropertyStatus, active: boolean): Observable<Property> {
    return this.updateProperty(id, { status, active });
  }
}
