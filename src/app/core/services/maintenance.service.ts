import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, map, tap, of } from 'rxjs';
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
    PermissionToEnter
} from '../models/maintenance-request.model';
import { ApiService } from './api.service';
import { SlugService } from './slug.service';

@Injectable({
    providedIn: 'root'
})
export class MaintenanceService {
    private apiService = inject(ApiService);
    private slugService = inject(SlugService);

    /**
     * Get the current tenant slug dynamically from SlugService
     */
    private get tenantSlug(): string {
        return this.slugService.getSlug() || '';
    }

    // Signal-based reactive state
    private requestsSignal = signal<MaintenanceRequest[]>([]);
    private statsSignal = signal<MaintenanceStats | null>(null);

    // Computed signals for filtered data
    requests = this.requestsSignal.asReadonly();
    stats = computed(() => this.statsSignal());

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

        this.apiService.get<MaintenanceRequest[]>(endpoint).subscribe({
            next: (requests) => {
                // Convert date strings to Date objects
                const processedRequests = requests.map(req => ({
                    ...req,
                    created_at: new Date(req.created_at),
                    updated_at: new Date(req.updated_at),
                    due_date: req.due_date ? new Date(req.due_date) : null,
                    messages: req.messages ?? [],
                    attachments: req.attachments ?? [],
                }));
                this.requestsSignal.set(processedRequests);
            },
            error: (error) => {
                console.error('Error loading maintenance requests:', error);
                this.requestsSignal.set([]);
            }
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
        return this.apiService.get<MaintenanceRequest>(endpoint).pipe(
            map(req => ({
                ...req,
                created_at: new Date(req.created_at),
                updated_at: new Date(req.updated_at),
                due_date: req.due_date ? new Date(req.due_date) : null,
            }))
        );
    }

    // NOTE: Admin cannot create maintenance requests
    // Only tenants can create requests through the tenant portal
    // The createRequest method has been removed from admin service

    /**
     * Update an existing request
     */
    updateRequest(id: number, dto: UpdateMaintenanceDto): Observable<MaintenanceRequest> {
        const endpoint = this.slugService.buildApiEndpoint(`admin/maintenance/${id}`);
        return this.apiService.patch<MaintenanceRequest>(endpoint, dto).pipe(
            tap(() => {
                // Reload the list after updating
                this.loadAllRequests();
                this.loadStats();
            })
        );
    }

    /**
     * Delete a request
     */
    deleteRequest(id: number): Observable<void> {
        const endpoint = this.slugService.buildApiEndpoint(`admin/maintenance/${id}`);
        return this.apiService.delete<void>(endpoint).pipe(
            tap(() => {
                // Remove from local state
                this.requestsSignal.update(requests =>
                    requests.filter(req => req.id !== id)
                );
                this.loadStats();
            })
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
            status: MaintenanceStatus.IN_PROGRESS
        });
    }

    /**
     * Unassign staff
     */
    unassignStaff(id: number): Observable<MaintenanceRequest> {
        return this.updateRequest(id, { assigned_to: 0 });
    }

    // ==================== Messaging System ====================

    /**
     * Get messages for a request
     */
    getMessages(requestId: number): Observable<MaintenanceMessage[]> {
        const endpoint = this.slugService.buildApiEndpoint(`admin/maintenance/${requestId}/messages`);
        return this.apiService.get<MaintenanceMessage[]>(endpoint).pipe(
            map(messages => messages.map(msg => ({
                ...msg,
                created_at: new Date(msg.created_at)
            })))
        );
    }

    /**
     * Add a message to a request
     */
    addMessage(requestId: number, dto: CreateMessageDto): Observable<MaintenanceMessage> {
        const endpoint = this.slugService.buildApiEndpoint(`admin/maintenance/${requestId}/messages`);
        return this.apiService.post<MaintenanceMessage>(endpoint, dto);
    }

    /**
     * Upload files to a maintenance request (max 3, 10MB each)
     */
    uploadFiles(requestId: number, files: File[]): Observable<MaintenanceAttachment[]> {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        const endpoint = this.slugService.buildApiEndpoint(`admin/maintenance/${requestId}/upload`);
        return this.apiService.post<MaintenanceAttachment[]>(endpoint, formData);
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
        return this.requestsSignal().filter(req => req.category === category);
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
        return this.apiService.get<MaintenanceRequest[]>(endpoint);
    }

    /**
     * Get requests by contract (returns observable)
     */
    getRequestsByContract(contractId: number): Observable<MaintenanceRequest[]> {
        const endpoint = this.slugService.buildApiEndpoint(`admin/maintenance/contract/${contractId}`);
        return this.apiService.get<MaintenanceRequest[]>(endpoint);
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
        return this.apiService.get<MaintenanceRequest[]>(endpoint);
    }

    // ==================== Search ====================

    /**
     * Search requests (client-side)
     */
    search(query: string): MaintenanceRequest[] {
        const lowerQuery = query.toLowerCase();
        return this.requestsSignal().filter(req =>
            req.title.toLowerCase().includes(lowerQuery) ||
            req.description.toLowerCase().includes(lowerQuery) ||
            req.ticket_number.toLowerCase().includes(lowerQuery) ||
            req.property?.title.toLowerCase().includes(lowerQuery)
        );
    }

    // ==================== Statistics ====================

    /**
     * Load statistics from backend
     */
    loadStats(): void {
        const endpoint = this.slugService.buildApiEndpoint('admin/maintenance/stats');
        this.apiService.get<MaintenanceStats>(endpoint).subscribe({
            next: (stats) => {
                this.statsSignal.set(stats);
            },
            error: (error) => {
                console.error('Error loading maintenance stats:', error);
                this.statsSignal.set(null);
            }
        });
    }

    /**
     * Get new requests
     */
    getNewRequests(): Observable<MaintenanceRequest[]> {
        const endpoint = this.slugService.buildApiEndpoint('admin/maintenance/new');
        return this.apiService.get<MaintenanceRequest[]>(endpoint);
    }

    /**
     * Get urgent requests
     */
    getUrgentRequests(): Observable<MaintenanceRequest[]> {
        const endpoint = this.slugService.buildApiEndpoint('admin/maintenance/urgent');
        return this.apiService.get<MaintenanceRequest[]>(endpoint);
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
