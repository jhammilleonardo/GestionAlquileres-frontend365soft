import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SlugService } from './slug.service';

/**
 * Contract Service
 *
 * Servicio para gestionar contratos
 */

export interface Contract {
  id: number;
  contract_number: string;
  tenant_id: number;
  property_id: number;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  status: string;
  property?: {
    id: number;
    title: string;
    address?: string;
  };
  tenant?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ContractService {
  private http = inject(HttpClient);
  private slugService = inject(SlugService);

  /**
   * Obtener contratos con filtros
   * GET /:slug/admin/contracts
   */
  getContracts(filters?: {
    status?: string;
    tenant_id?: number;
    property_id?: number;
  }): Observable<Contract[]> {
    const endpoint = this.slugService.buildApiEndpoint('admin/contracts');
    let params = new HttpParams();

    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.tenant_id) params = params.set('tenant_id', filters.tenant_id.toString());
      if (filters.property_id) params = params.set('property_id', filters.property_id.toString());
    }

    return this.http.get<Contract[]>(`${environment.apiUrl}${endpoint}`, { params });
  }

  /**
   * Obtener contratos por ID de inquilino
   */
  getContractsByTenantId(tenantId: number): Observable<Contract[]> {
    return this.getContracts({ tenant_id: tenantId });
  }

  /**
   * Obtener contratos activos por ID de inquilino
   */
  getActiveContractsByTenantId(tenantId: number): Observable<Contract[]> {
    return this.getContracts({
      tenant_id: tenantId,
      status: 'ACTIVO'
    });
  }

  /**
   * Obtener un contrato por ID
   */
  getContractById(id: number): Observable<Contract> {
    const endpoint = this.slugService.buildApiEndpoint(`admin/contracts/${id}`);
    return this.http.get<Contract>(`${environment.apiUrl}${endpoint}`);
  }

  /**
   * Formatear contrato para display
   */
  formatContractDisplay(contract: Contract): string {
    const propertyName = contract.property?.title || `Propiedad #${contract.property_id}`;
    return `${contract.contract_number} - ${propertyName} (Bs ${contract.monthly_rent}/mes)`;
  }
}
