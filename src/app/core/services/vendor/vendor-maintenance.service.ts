import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, from, map, switchMap } from 'rxjs';

import {
  CreateMessageDto,
  MaintenanceMessage,
  MaintenanceRequest,
  MaintenanceStatus,
} from '../../models/maintenance-request.model';
import { ApiClientService } from '../../http/api-client.service';
import { SlugService } from '../slug.service';
import { ImageOptimizationService } from '../image-optimization.service';

/**
 * Servicio del portal del proveedor externo. Opera exclusivamente sobre los
 * endpoints `/:slug/vendor/maintenance/*`, que el backend acota a las órdenes
 * asignadas al proveedor autenticado (por su `vendor_id` en el JWT).
 */
@Injectable({ providedIn: 'root' })
export class VendorMaintenanceService {
  private readonly apiClient = inject(ApiClientService);
  private readonly slugService = inject(SlugService);
  private readonly imageOptimization = inject(ImageOptimizationService);

  private readonly requestsSignal = signal<MaintenanceRequest[]>([]);
  private readonly loadingSignal = signal(false);

  readonly requests = this.requestsSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();

  loadAssigned(): void {
    const endpoint = this.slugService.buildApiEndpoint('vendor/maintenance');
    this.loadingSignal.set(true);
    this.apiClient.get<MaintenanceRequest[]>(endpoint).subscribe({
      next: (requests) => {
        this.requestsSignal.set(requests.map((req) => this.normalize(req)));
        this.loadingSignal.set(false);
      },
      error: () => {
        this.requestsSignal.set([]);
        this.loadingSignal.set(false);
      },
    });
  }

  getById(id: number): Observable<MaintenanceRequest> {
    const endpoint = this.slugService.buildApiEndpoint(`vendor/maintenance/${id}`);
    return this.apiClient.get<MaintenanceRequest>(endpoint).pipe(map((req) => this.normalize(req)));
  }

  /** Avanza la etapa (solo IN_PROGRESS o COMPLETED, validado en backend). */
  updateStatus(
    id: number,
    toStage: MaintenanceStatus,
    notes?: string,
  ): Observable<MaintenanceRequest> {
    const endpoint = this.slugService.buildApiEndpoint(`vendor/maintenance/${id}/stage`);
    return this.apiClient
      .patch<MaintenanceRequest>(endpoint, { to_stage: toStage, notes })
      .pipe(map((req) => this.normalize(req)));
  }

  getMessages(id: number): Observable<MaintenanceMessage[]> {
    const endpoint = this.slugService.buildApiEndpoint(`vendor/maintenance/${id}/messages`);
    return this.apiClient
      .get<MaintenanceMessage[]>(endpoint)
      .pipe(
        map((messages) =>
          messages.map((msg) => ({ ...msg, created_at: new Date(msg.created_at) })),
        ),
      );
  }

  addMessage(id: number, dto: CreateMessageDto): Observable<MaintenanceMessage> {
    const endpoint = this.slugService.buildApiEndpoint(`vendor/maintenance/${id}/messages`);
    return this.apiClient.post<MaintenanceMessage>(endpoint, dto);
  }

  /** Sube archivos como adjuntos de mensaje del chat; devuelve sus URLs. */
  uploadFiles(id: number, files: File[]): Observable<{ file_url: string }[]> {
    const endpoint = this.slugService.buildApiEndpoint(`vendor/maintenance/${id}/upload`);
    return from(this.imageOptimization.filesToFormData(files, 'files')).pipe(
      switchMap((formData) => this.apiClient.post<{ file_url: string }[]>(endpoint, formData)),
    );
  }

  countByStatus = computed(() => {
    const all = this.requestsSignal();
    return {
      total: all.length,
      new: all.filter((r) => r.status === MaintenanceStatus.NEW).length,
      inProgress: all.filter((r) => r.status === MaintenanceStatus.IN_PROGRESS).length,
      completed: all.filter((r) => r.status === MaintenanceStatus.COMPLETED).length,
    };
  });

  private normalize(req: MaintenanceRequest): MaintenanceRequest {
    return {
      ...req,
      created_at: new Date(req.created_at),
      updated_at: new Date(req.updated_at),
      due_date: req.due_date ? new Date(req.due_date) : null,
      messages: req.messages ?? [],
      attachments: req.attachments ?? [],
    };
  }
}
