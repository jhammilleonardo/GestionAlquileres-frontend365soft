import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Application,
  ApplicationListItem,
  CreateApplicationDto,
  ApproveApplicationDto,
  ApproveApplicationResponse,
  ChangeStatusDto,
  ApplicationFilters,
  ApplicationStatus,
} from '../../models/application.model';
import { ApiClientService } from '../../http/api-client.service';
import { SlugService } from '../slug.service';

@Injectable({
  providedIn: 'root',
})
export class ApplicationService {
  private apiClient = inject(ApiClientService);
  private slugService = inject(SlugService);

  // ==================== ADMIN ENDPOINTS ====================

  /**
   * Listar todas las solicitudes (Admin)
   * GET /:slug/applications
   */
  getAllApplications(filters?: ApplicationFilters): Observable<ApplicationListItem[]> {
    const params: Record<string, string | number> = {};
    if (filters?.status) params['status'] = filters.status;
    if (filters?.property_id) params['property_id'] = filters.property_id;
    if (filters?.applicant_id) params['applicant_id'] = filters.applicant_id;

    const endpoint = this.slugService.buildApiEndpoint('applications');
    return this.apiClient.get<ApplicationListItem[]>(endpoint, { params });
  }

  /**
   * Obtener detalle de una solicitud (Admin)
   * GET /:slug/applications/:id
   */
  getApplicationById(id: number): Observable<Application> {
    const endpoint = this.slugService.buildApiEndpoint(`applications/${id}`);
    return this.apiClient.get<Application>(endpoint);
  }

  /**
   * Aprobar solicitud y generar contrato (Admin)
   * PATCH /:slug/applications/:id/approve
   */
  approveApplication(
    id: number,
    data: ApproveApplicationDto,
  ): Observable<ApproveApplicationResponse> {
    const endpoint = this.slugService.buildApiEndpoint(`applications/${id}/approve`);
    return this.apiClient.patch<ApproveApplicationResponse>(endpoint, data);
  }

  /**
   * Cambiar estado de solicitud (Admin)
   * PATCH /:slug/applications/:id/status
   */
  changeApplicationStatus(id: number, data: ChangeStatusDto): Observable<Application> {
    const endpoint = this.slugService.buildApiEndpoint(`applications/${id}/status`);
    return this.apiClient.patch<Application>(endpoint, data);
  }

  /**
   * Rechazar solicitud (Admin) - Helper method
   */
  rejectApplication(id: number, feedback: string): Observable<Application> {
    return this.changeApplicationStatus(id, {
      status: ApplicationStatus.RECHAZADA,
      admin_feedback: feedback,
    });
  }

  // ==================== TENANT ENDPOINTS ====================

  /**
   * Enviar nueva solicitud (Inquilino)
   * POST /:slug/applications
   */
  createApplication(data: CreateApplicationDto): Observable<Application> {
    const endpoint = this.slugService.buildApiEndpoint('applications');
    return this.apiClient.post<Application>(endpoint, data);
  }

  /**
   * Ver mis solicitudes (Inquilino)
   * GET /:slug/applications/my-applications
   */
  getMyApplications(status?: string): Observable<ApplicationListItem[]> {
    const params = status ? { status } : {};
    const endpoint = this.slugService.buildApiEndpoint('applications/my-applications');
    return this.apiClient.get<ApplicationListItem[]>(endpoint, { params });
  }

  /**
   * Ver detalle de mi solicitud (Inquilino)
   * GET /:slug/applications/:id
   */
  getMyApplicationById(id: number): Observable<Application> {
    const endpoint = this.slugService.buildApiEndpoint(`applications/${id}`);
    return this.apiClient.get<Application>(endpoint);
  }

  // ==================== HELPER METHODS ====================

  /**
   * Obtener badge color según estado
   */
  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      PENDIENTE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      APROBADA: 'bg-green-100 text-green-800 border-green-200',
      RECHAZADA: 'bg-red-100 text-red-800 border-red-200',
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  /**
   * Obtener icono según estado
   */
  getStatusIcon(status: string): string {
    const iconMap: { [key: string]: string } = {
      PENDIENTE: '⏳',
      APROBADA: '✅',
      RECHAZADA: '❌',
    };
    return iconMap[status] || '📋';
  }

  /**
   * Calcular ratio ingreso/renta
   */
  calculateIncomeRatio(monthlyIncome: number, monthlyRent: number): number {
    if (!monthlyIncome || !monthlyRent) return 0;
    return Number((monthlyIncome / monthlyRent).toFixed(2));
  }

  /**
   * Verificar si el solicitante cumple el requisito de ingresos
   * Generalmente se requiere una ratio de al menos 3:1
   */
  meetsIncomeRequirement(
    monthlyIncome: number,
    monthlyRent: number,
    requiredRatio: number = 3,
  ): boolean {
    return this.calculateIncomeRatio(monthlyIncome, monthlyRent) >= requiredRatio;
  }
}
