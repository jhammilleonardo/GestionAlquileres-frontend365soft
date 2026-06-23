import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, from, map, switchMap, tap } from 'rxjs';
import {
  MaintenanceRequest,
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceCategory,
  MaintenanceStats,
  UpdateMaintenanceDto,
  CreateMessageDto,
  MaintenanceMessage,
  MaintenanceAttachment,
  MaintenanceRequestType,
} from '../../models/maintenance-request.model';
import { ApiClientService } from '../../http/api-client.service';
import { SlugService } from '../slug.service';
import { ImageOptimizationService } from '../image-optimization.service';

@Injectable({
  providedIn: 'root',
})
export class MaintenanceService {
  private apiClient = inject(ApiClientService);
  private slugService = inject(SlugService);
  private imageOptimization = inject(ImageOptimizationService);

  /**
   * Get the current tenant slug dynamically from SlugService
   */
  private get tenantSlug(): string {
    return this.slugService.getSlug() || '';
  }

  // Signal-based reactive state
  private requestsSignal = signal<MaintenanceRequest[]>([]);
  private statsSignal = signal<MaintenanceStats | null>(null);
  private loadingSignal = signal(false);

  // Computed signals for filtered data
  requests = this.requestsSignal.asReadonly();
  stats = computed(() => this.statsSignal());
  /** true mientras loadAllRequests() tiene una petición en vuelo */
  isLoading = this.loadingSignal.asReadonly();

  // NOTE: Removed automatic data loading from constructor
  // The component will explicitly call loadAllRequests() and loadStats() in ngOnInit
  // This ensures the slug is already set by the authGuard before making API calls

  // ==================== CRUD Operations ====================

  /**
   * Load all maintenance requests with optional filters
   */
  loadAllRequests(filters?: {
    status?: MaintenanceStatus;
    priority?: MaintenancePriority;
    request_type?: MaintenanceRequestType;
    tenant_id?: number;
    property_id?: number;
    contract_id?: number;
  }): void {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
    }

    const endpoint = `${this.slugService.buildApiEndpoint('admin/maintenance')}${params.toString() ? '?' + params.toString() : ''}`;

    this.loadingSignal.set(true);
    this.apiClient.get<MaintenanceRequest[]>(endpoint).subscribe({
      next: (requests) => {
        const processedRequests = requests.map((req) => this.normalizeRequest(req));
        this.requestsSignal.set(processedRequests);
        this.loadingSignal.set(false);
      },
      error: (_e) => {
        this.requestsSignal.set([]);
        this.loadingSignal.set(false);
      },
    });
  }

  /**
   * Get all requests (returns signal value)
   */
  getAllRequests(): MaintenanceRequest[] {
    return this.requestsSignal();
  }

  /**
   * Get request by ID
   */
  getRequestById(id: number): Observable<MaintenanceRequest> {
    const endpoint = this.slugService.buildApiEndpoint(`admin/maintenance/${id}`);
    return this.apiClient
      .get<MaintenanceRequest>(endpoint)
      .pipe(map((req) => this.normalizeRequest(req)));
  }

  // NOTE: Admin cannot create maintenance requests
  // Only tenants can create requests through the tenant portal
  // The createRequest method has been removed from admin service

  /**
   * Update an existing request
   */
  updateRequest(id: number, dto: UpdateMaintenanceDto): Observable<MaintenanceRequest> {
    const endpoint = this.slugService.buildApiEndpoint(`admin/maintenance/${id}`);
    return this.apiClient.patch<MaintenanceRequest>(endpoint, dto).pipe(
      map((request) => this.normalizeRequest(request)),
      tap(() => {
        // Reload the list after updating
        this.loadAllRequests();
        this.loadStats();
      }),
    );
  }

  /**
   * Delete a request
   */
  deleteRequest(id: number): Observable<void> {
    const endpoint = this.slugService.buildApiEndpoint(`admin/maintenance/${id}`);
    return this.apiClient.delete<void>(endpoint).pipe(
      tap(() => {
        // Remove from local state
        this.requestsSignal.update((requests) => requests.filter((req) => req.id !== id));
        this.loadStats();
      }),
    );
  }

  // ==================== Status Management ====================

  /**
   * Update request status
   */
  updateStatus(id: number, status: MaintenanceStatus): Observable<MaintenanceRequest> {
    return this.updateRequest(id, { status });
  }

  /**
   * Update request priority
   */
  updatePriority(id: number, priority: MaintenancePriority): Observable<MaintenanceRequest> {
    return this.updateRequest(id, { priority });
  }

  /**
   * Update due date
   */
  updateDueDate(id: number, due_date: string): Observable<MaintenanceRequest> {
    return this.updateRequest(id, { due_date });
  }

  /**
   * Assign to staff
   */
  assignToStaff(id: number, staffId: number): Observable<MaintenanceRequest> {
    return this.updateRequest(id, {
      assigned_to: staffId,
      status: MaintenanceStatus.IN_PROGRESS,
    });
  }

  /**
   * Unassign staff
   */
  unassignStaff(id: number): Observable<MaintenanceRequest> {
    return this.updateRequest(id, { assigned_to: 0 });
  }

  /**
   * Asignar la orden a un técnico interno O a un proveedor externo (excluyentes).
   */
  assignVendor(
    id: number,
    payload: { vendor_id?: number | null; assigned_to?: number | null },
  ): Observable<MaintenanceRequest> {
    const endpoint = this.slugService.buildApiEndpoint(`admin/maintenance/${id}/assign-vendor`);
    return this.apiClient.patch<MaintenanceRequest>(endpoint, payload).pipe(
      map((request) => this.normalizeRequest(request)),
      tap(() => {
        this.loadAllRequests();
        this.loadStats();
      }),
    );
  }

  /**
   * Calificar al proveedor externo al cerrar una orden (1-5 estrellas + comentario).
   */
  rateVendor(
    id: number,
    payload: { rating: number; comment?: string },
  ): Observable<MaintenanceRequest> {
    const endpoint = this.slugService.buildApiEndpoint(`admin/maintenance/${id}/rate-vendor`);
    return this.apiClient
      .post<MaintenanceRequest>(endpoint, payload)
      .pipe(map((request) => this.normalizeRequest(request)));
  }

  private normalizeRequest(req: MaintenanceRequest): MaintenanceRequest {
    return {
      ...req,
      created_at: new Date(req.created_at),
      updated_at: new Date(req.updated_at),
      due_date: req.due_date ? new Date(req.due_date) : null,
      messages: req.messages ?? [],
      attachments: req.attachments ?? [],
    };
  }

  // ==================== Messaging System ====================

  /**
   * Get messages for a request
   */
  getMessages(requestId: number): Observable<MaintenanceMessage[]> {
    const endpoint = this.slugService.buildApiEndpoint(`admin/maintenance/${requestId}/messages`);
    return this.apiClient.get<MaintenanceMessage[]>(endpoint).pipe(
      map((messages) =>
        messages.map((msg) => ({
          ...msg,
          created_at: new Date(msg.created_at),
        })),
      ),
    );
  }

  /**
   * Add a message to a request
   */
  addMessage(requestId: number, dto: CreateMessageDto): Observable<MaintenanceMessage> {
    const endpoint = this.slugService.buildApiEndpoint(`admin/maintenance/${requestId}/messages`);
    return this.apiClient.post<MaintenanceMessage>(endpoint, dto);
  }

  /**
   * Upload files to a maintenance request (max 3, 10MB each)
   */
  uploadFiles(requestId: number, files: File[]): Observable<MaintenanceAttachment[]> {
    const endpoint = this.slugService.buildApiEndpoint(`admin/maintenance/${requestId}/upload`);
    return from(this.imageOptimization.filesToFormData(files, 'files')).pipe(
      switchMap((formData) => this.apiClient.post<MaintenanceAttachment[]>(endpoint, formData)),
    );
  }

  // ==================== Filtering ====================

  /**
   * Filter by status
   */
  filterByStatus(status: MaintenanceStatus): void {
    this.loadAllRequests({ status });
  }

  /**
   * Filter by priority
   */
  filterByPriority(priority: MaintenancePriority): void {
    this.loadAllRequests({ priority });
  }

  /**
   * Filter by category
   */
  filterByCategory(category: MaintenanceCategory): MaintenanceRequest[] {
    return this.requestsSignal().filter((req) => req.category === category);
  }

  /**
   * Filter by property
   */
  filterByProperty(propertyId: number): void {
    this.loadAllRequests({ property_id: propertyId });
  }

  /**
   * Filter by tenant
   */
  filterByTenant(tenantId: number): void {
    this.loadAllRequests({ tenant_id: tenantId });
  }

  /**
   * Get requests by property (returns observable)
   */
  getRequestsByProperty(propertyId: number): Observable<MaintenanceRequest[]> {
    const endpoint = this.slugService.buildApiEndpoint(`admin/maintenance/property/${propertyId}`);
    return this.apiClient.get<MaintenanceRequest[]>(endpoint);
  }

  /**
   * Get requests by contract (returns observable)
   */
  getRequestsByContract(contractId: number): Observable<MaintenanceRequest[]> {
    const endpoint = this.slugService.buildApiEndpoint(`admin/maintenance/contract/${contractId}`);
    return this.apiClient.get<MaintenanceRequest[]>(endpoint);
  }

  /**
   * Filter by contract
   */
  filterByContract(contractId: number): void {
    this.loadAllRequests({ contract_id: contractId });
  }

  /**
   * Get requests by tenant (returns observable)
   */
  getRequestsByTenant(tenantId: number): Observable<MaintenanceRequest[]> {
    const endpoint = this.slugService.buildApiEndpoint(`admin/maintenance/tenant/${tenantId}`);
    return this.apiClient.get<MaintenanceRequest[]>(endpoint);
  }

  // ==================== Search ====================

  /**
   * Search requests (client-side)
   */
  search(query: string): MaintenanceRequest[] {
    const lowerQuery = query.toLowerCase();
    return this.requestsSignal().filter(
      (req) =>
        req.title.toLowerCase().includes(lowerQuery) ||
        req.description.toLowerCase().includes(lowerQuery) ||
        req.ticket_number.toLowerCase().includes(lowerQuery) ||
        req.property?.title.toLowerCase().includes(lowerQuery),
    );
  }

  // ==================== Statistics ====================

  /**
   * Load statistics from backend
   */
  loadStats(): void {
    const endpoint = this.slugService.buildApiEndpoint('admin/maintenance/stats');
    this.apiClient.get<MaintenanceStats>(endpoint).subscribe({
      next: (stats) => {
        this.statsSignal.set(stats);
      },
      error: (_e) => {
        this.statsSignal.set(null);
      },
    });
  }

  /**
   * Get new requests
   */
  getNewRequests(): Observable<MaintenanceRequest[]> {
    const endpoint = this.slugService.buildApiEndpoint('admin/maintenance/new');
    return this.apiClient.get<MaintenanceRequest[]>(endpoint);
  }

  /**
   * Get urgent requests
   */
  getUrgentRequests(): Observable<MaintenanceRequest[]> {
    const endpoint = this.slugService.buildApiEndpoint('admin/maintenance/urgent');
    return this.apiClient.get<MaintenanceRequest[]>(endpoint);
  }

  // ==================== Utility Methods ====================

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.loadAllRequests();
  }

  /**
   * Refresh data
   */
  refresh(): void {
    this.loadAllRequests();
    this.loadStats();
  }
}
