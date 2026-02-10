import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TenantAuthService } from './tenant-auth.service';
import { SlugService } from './slug.service';
import {
    MaintenanceRequest,
    MaintenanceMessage,
    MaintenanceCategory,
    MaintenanceRequestType,
    PermissionToEnter
} from '../models/maintenance-request.model';

export interface TenantMaintenanceStats {
    total: number;
    active: number;
    completed: number;
}

export interface CreateTenantMaintenanceDto {
    request_type: MaintenanceRequestType;
    category?: MaintenanceCategory;
    title: string;
    description: string;
    permission_to_enter?: PermissionToEnter;
    has_pets?: boolean;
    entry_notes?: string;
    files?: string[];
}

export interface CreateTenantMessageDto {
    message: string;
    files?: string[];
}

@Injectable({
    providedIn: 'root'
})
export class TenantMaintenanceService {
    private http = inject(HttpClient);
    private authService = inject(TenantAuthService);
    private slugService = inject(SlugService);

    // Signal-based reactive state
    private requestsSignal = signal<MaintenanceRequest[]>([]);
    private statsSignal = signal<TenantMaintenanceStats | null>(null);
    private isLoadingSignal = signal(false);
    private errorSignal = signal<string | null>(null);

    // Public computed values
    requests = this.requestsSignal.asReadonly();
    stats = this.statsSignal.asReadonly();
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
     * Load all requests for the current tenant
     */
    loadMyRequests(): void {
        if (!this.slug) return;

        this.isLoadingSignal.set(true);
        this.errorSignal.set(null);

        this.http.get<MaintenanceRequest[]>(
            `${environment.apiUrl}${this.slug}/tenant/maintenance/my-requests`,
            { headers: this.headers }
        ).pipe(
            map(requests => requests.map(req => this.processRequest(req))),
            catchError(error => {
                this.errorSignal.set('Error al cargar las solicitudes');
                this.isLoadingSignal.set(false);
                throw error;
            })
        ).subscribe(requests => {
            this.requestsSignal.set(requests);
            this.isLoadingSignal.set(false);
        });
    }

    /**
     * Load statistics for current tenant
     */
    loadStats(): void {
        if (!this.slug) return;

        this.http.get<TenantMaintenanceStats>(
            `${environment.apiUrl}${this.slug}/tenant/maintenance/stats`,
            { headers: this.headers }
        ).pipe(
            catchError(error => {
                console.error('Error loading stats:', error);
                throw error;
            })
        ).subscribe(stats => {
            this.statsSignal.set(stats);
        });
    }

    /**
     * Get a single request by ID
     */
    getRequestById(id: number): Observable<MaintenanceRequest> {
        return this.http.get<MaintenanceRequest>(
            `${environment.apiUrl}${this.slug}/tenant/maintenance/${id}`,
            { headers: this.headers }
        ).pipe(
            map(req => this.processRequest(req))
        );
    }

    /**
     * Create a new maintenance request
     */
    createRequest(dto: CreateTenantMaintenanceDto): Observable<MaintenanceRequest> {
        this.isLoadingSignal.set(true);

        return this.http.post<MaintenanceRequest>(
            `${environment.apiUrl}${this.slug}/tenant/maintenance`,
            dto,
            { headers: this.headers }
        ).pipe(
            map(req => this.processRequest(req)),
            tap(() => {
                this.loadMyRequests();
                this.loadStats();
                this.isLoadingSignal.set(false);
            }),
            catchError(error => {
                this.isLoadingSignal.set(false);
                const message = error.error?.message || 'Error al crear la solicitud';
                this.errorSignal.set(message);
                throw error;
            })
        );
    }

    /**
     * Get messages for a request
     */
    getMessages(requestId: number): Observable<MaintenanceMessage[]> {
        return this.http.get<MaintenanceMessage[]>(
            `${environment.apiUrl}${this.slug}/tenant/maintenance/${requestId}/messages`,
            { headers: this.headers }
        ).pipe(
            map(messages => messages.map(msg => ({
                ...msg,
                created_at: new Date(msg.created_at)
            })))
        );
    }

    /**
     * Send a message to a request
     */
    sendMessage(requestId: number, dto: CreateTenantMessageDto): Observable<MaintenanceMessage> {
        return this.http.post<MaintenanceMessage>(
            `${environment.apiUrl}${this.slug}/tenant/maintenance/${requestId}/messages`,
            dto,
            { headers: this.headers }
        ).pipe(
            map(msg => ({
                ...msg,
                created_at: new Date(msg.created_at)
            }))
        );
    }

    /**
     * Refresh data
     */
    refresh(): void {
        this.loadMyRequests();
        this.loadStats();
    }

    /**
     * Clear error
     */
    clearError(): void {
        this.errorSignal.set(null);
    }

    /**
     * Process request dates
     */
    private processRequest(req: MaintenanceRequest): MaintenanceRequest {
        return {
            ...req,
            created_at: new Date(req.created_at),
            updated_at: new Date(req.updated_at),
            due_date: req.due_date ? new Date(req.due_date) : null
        };
    }
}
