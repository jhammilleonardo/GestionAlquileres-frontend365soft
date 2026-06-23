import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, from, map, switchMap, tap } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import { environment } from '../../../../environments/environment';
import { TenantAuthService } from './tenant-auth.service';
import { SlugService } from '../slug.service';
import { ImageOptimizationService } from '../image-optimization.service';
import {
  MaintenanceRequest,
  MaintenanceMessage,
  MaintenanceAttachment,
  MaintenanceCategory,
  MaintenanceRequestType,
  PermissionToEnter,
} from '../../models/maintenance-request.model';

import { getApiErrorMessage } from '../../http/http-error.util';
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
  providedIn: 'root',
})
export class TenantMaintenanceService {
  private http = inject(HttpClient);
  private authService = inject(TenantAuthService);
  private slugService = inject(SlugService);
  private imageOptimization = inject(ImageOptimizationService);
  private transloco = inject(TranslocoService);

  // Signal-based reactive state
  private requestsSignal = signal<MaintenanceRequest[]>([]);
  private statsSignal = signal<TenantMaintenanceStats | null>(null);
  private isLoadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);
  private messageCountsSignal = signal<Record<number, number>>({});

  // Public computed values
  requests = this.requestsSignal.asReadonly();
  stats = this.statsSignal.asReadonly();
  isLoading = this.isLoadingSignal.asReadonly();
  error = this.errorSignal.asReadonly();
  messageCounts = this.messageCountsSignal.asReadonly();

  private get slug(): string {
    return this.slugService.getSlug() || '';
  }

  /**
   * Load all requests for the current tenant
   */
  loadMyRequests(): void {
    if (!this.slug) return;

    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.http
      .get<MaintenanceRequest[]>(`${environment.apiUrl}${this.slug}/tenant/maintenance/my-requests`)
      .pipe(
        map((requests) => requests.map((req) => this.processRequest(req))),
        catchError((error) => {
          this.errorSignal.set(this.transloco.translate('common.errors.loadRequests'));
          this.isLoadingSignal.set(false);
          throw error;
        }),
      )
      .subscribe((requests) => {
        this.requestsSignal.set(requests);
        this.isLoadingSignal.set(false);
        this.loadMessageCounts();
      });
  }

  /**
   * Load statistics for current tenant
   */
  loadStats(): void {
    if (!this.slug) return;

    this.http
      .get<TenantMaintenanceStats>(`${environment.apiUrl}${this.slug}/tenant/maintenance/stats`)
      .pipe(
        catchError((error) => {
          throw error;
        }),
      )
      .subscribe((stats) => {
        this.statsSignal.set(stats);
      });
  }

  /**
   * Load admin message counts (only messages NOT sent by the tenant)
   */
  loadMessageCounts(): void {
    const requests = this.requestsSignal();
    const currentUserId = this.authService.currentUser()?.id;
    requests.forEach((req) => {
      this.getMessages(req.id).subscribe((messages) => {
        // Solo mensajes del admin visibles al inquilino (no los del propio inquilino)
        const adminCount = messages.filter(
          (m) => m.send_to_resident && m.user_id !== currentUserId,
        ).length;
        this.messageCountsSignal.update((counts) => ({ ...counts, [req.id]: adminCount }));
      });
    });
  }

  /**
   * Get a single request by ID
   */
  getRequestById(id: number): Observable<MaintenanceRequest> {
    return this.http
      .get<MaintenanceRequest>(`${environment.apiUrl}${this.slug}/tenant/maintenance/${id}`)
      .pipe(map((req) => this.processRequest(req)));
  }

  /**
   * Create a new maintenance request
   */
  createRequest(dto: CreateTenantMaintenanceDto): Observable<MaintenanceRequest> {
    this.isLoadingSignal.set(true);

    return this.http
      .post<MaintenanceRequest>(`${environment.apiUrl}${this.slug}/tenant/maintenance`, dto)
      .pipe(
        map((req) => this.processRequest(req)),
        tap(() => {
          this.loadMyRequests();
          this.loadStats();
          this.isLoadingSignal.set(false);
        }),
        catchError((error) => {
          this.isLoadingSignal.set(false);
          const message = getApiErrorMessage(error, 'Error al crear la solicitud');
          this.errorSignal.set(message);
          throw error;
        }),
      );
  }

  /**
   * Get messages for a request
   */
  getMessages(requestId: number): Observable<MaintenanceMessage[]> {
    return this.http
      .get<
        MaintenanceMessage[]
      >(`${environment.apiUrl}${this.slug}/tenant/maintenance/${requestId}/messages`)
      .pipe(
        map((messages) =>
          messages.map((msg) => ({
            ...msg,
            created_at: new Date(msg.created_at),
          })),
        ),
      );
  }

  /**
   * Send a message to a request
   */
  sendMessage(requestId: number, dto: CreateTenantMessageDto): Observable<MaintenanceMessage> {
    return this.http
      .post<MaintenanceMessage>(
        `${environment.apiUrl}${this.slug}/tenant/maintenance/${requestId}/messages`,
        dto,
      )
      .pipe(
        map((msg) => ({
          ...msg,
          created_at: new Date(msg.created_at),
        })),
      );
  }

  /**
   * Upload files to a maintenance request (max 3, 10MB each)
   */
  uploadFiles(requestId: number, files: File[]): Observable<MaintenanceAttachment[]> {
    return from(this.imageOptimization.filesToFormData(files, 'files')).pipe(
      switchMap((formData) =>
        this.http.post<MaintenanceAttachment[]>(
          `${environment.apiUrl}${this.slug}/tenant/maintenance/${requestId}/upload`,
          formData,
        ),
      ),
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
      due_date: req.due_date ? new Date(req.due_date) : null,
    };
  }
}
