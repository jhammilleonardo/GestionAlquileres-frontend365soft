import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TenantAuthService } from './tenant-auth.service';
import { SlugService } from './slug.service';

export interface Property {
    id: number;
    title: string;
    description?: string;
    address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    bedrooms?: number;
    bathrooms?: number;
    area_sqm?: number;
    furnished?: boolean;
    parking_spaces?: number;
    floor?: number;
    building_name?: string;
    property_type?: string;
    property_subtype?: string;
    status?: string;
    monthly_rent?: number;
    currency?: string;
    images?: PropertyImage[];
    amenities?: string[];
    created_at: Date;
    updated_at: Date;
}

export interface PropertyImage {
    id: number;
    property_id: number;
    image_url: string;
    is_primary: boolean;
    display_order: number;
}

@Injectable({
    providedIn: 'root'
})
export class TenantPropertyService {
    private http = inject(HttpClient);
    private authService = inject(TenantAuthService);
    private slugService = inject(SlugService);

    // Signal-based reactive state
    private propertiesSignal = signal<Property[]>([]);
    private isLoadingSignal = signal(false);
    private errorSignal = signal<string | null>(null);

    // Public readonly signals
    properties = this.propertiesSignal.asReadonly();
    isLoading = this.isLoadingSignal.asReadonly();
    error = this.errorSignal.asReadonly();

    private get slug(): string {
        return this.slugService.getSlug() || '';
    }

    private get headers(): HttpHeaders {
        const token = this.authService.getToken();
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        });
    }

    /**
     * Cargar todas las propiedades asignadas al inquilino
     */
    loadMyProperties(): void {
        if (!this.slug) return;

        this.isLoadingSignal.set(true);
        this.errorSignal.set(null);

        this.http.get<Property[]>(
            `${environment.apiUrl}${this.slug}/tenant/properties`,
            { headers: this.headers }
        ).pipe(
            tap(properties => {
                const processedProperties = properties.map(p => this.processProperty(p));
                this.propertiesSignal.set(processedProperties);
                this.isLoadingSignal.set(false);
            }),
            catchError(error => {
                this.errorSignal.set('Error al cargar las propiedades');
                this.isLoadingSignal.set(false);
                console.error('Error loading properties:', error);
                return of([]);
            })
        ).subscribe();
    }

    /**
     * Obtener una propiedad específica por ID
     */
    getProperty(id: number): Observable<Property> {
        return this.http.get<Property>(
            `${environment.apiUrl}${this.slug}/tenant/properties/${id}`,
            { headers: this.headers }
        ).pipe(
            tap(property => {
                const processedProperty = this.processProperty(property);

                // Actualizar en la lista si existe
                this.propertiesSignal.update(properties =>
                    properties.map(p => p.id === processedProperty.id ? processedProperty : p)
                );
            })
        );
    }

    /**
     * Limpiar error
     */
    clearError(): void {
        this.errorSignal.set(null);
    }

    /**
     * Procesar fechas de la propiedad
     */
    private processProperty(property: Property): Property {
        return {
            ...property,
            created_at: new Date(property.created_at),
            updated_at: new Date(property.updated_at)
        };
    }
}
