import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiClientService } from '../../http/api-client.service';
import { SlugService } from '../slug.service';
import { environment } from '../../../../environments/environment';

export interface OwnerDashboard {
  properties_count?: number;
  active_contracts_count?: number;
  pending_balance?: number;
  active_maintenance_count?: number;
}

export type OwnerPortalRecord = Record<string, unknown> & { id: number };

@Injectable({ providedIn: 'root' })
export class OwnerPortalService {
  private readonly api = inject(ApiClientService);
  private readonly http = inject(HttpClient);
  private readonly slugService = inject(SlugService);

  getDashboard(): Observable<OwnerDashboard> {
    return this.api.get<OwnerDashboard>(this.endpoint('owner/dashboard'));
  }

  getProperties(): Observable<OwnerPortalRecord[]> {
    return this.api.get<OwnerPortalRecord[]>(this.endpoint('owner/properties'));
  }

  getStatements(): Observable<OwnerPortalRecord[]> {
    return this.api.get<OwnerPortalRecord[]>(this.endpoint('owner/statements'));
  }

  getMaintenance(): Observable<OwnerPortalRecord[]> {
    return this.api.get<OwnerPortalRecord[]>(this.endpoint('owner/maintenance'));
  }

  getContracts(): Observable<OwnerPortalRecord[]> {
    return this.api.get<OwnerPortalRecord[]>(this.endpoint('owner/contracts'));
  }

  authorizeMaintenance(id: number): Observable<{ message: string }> {
    return this.api.patch<{ message: string }, Record<string, never>>(
      this.endpoint(`owner/maintenance/${id}/authorize`),
      {},
    );
  }

  /** Descarga el PDF de una liquidación (respuesta binaria del backend). */
  downloadStatementPdf(id: number): Observable<Blob> {
    const url = `${environment.apiUrl}${this.endpoint(`owner/statements/${id}/pdf`)}`;
    return this.http.get(url, { responseType: 'blob' });
  }

  /** Descarga un contrato firmado usando el `pdf_url` devuelto por el backend. */
  downloadContractPdf(record: OwnerPortalRecord): Observable<Blob> {
    const pdfUrl = this.asString(record['pdf_url']);
    if (!pdfUrl) {
      throw new Error('El contrato no tiene PDF disponible');
    }

    const url = pdfUrl.startsWith('http')
      ? pdfUrl
      : `${environment.apiUrl}${pdfUrl.startsWith('/') ? pdfUrl : `/${pdfUrl}`}`;
    return this.http.get(url, { responseType: 'blob' });
  }

  private endpoint(path: string): string {
    return this.slugService.buildApiEndpoint(path);
  }

  private asString(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }
}
