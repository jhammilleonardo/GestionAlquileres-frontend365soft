import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiClientService, QueryParams } from '../../http/api-client.service';
import { SlugService } from '../slug.service';
import { environment } from '../../../../environments/environment';

export type AuditAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'approved'
  | 'rejected'
  | 'status_changed'
  | 'signed'
  | 'renewed'
  | 'permissions_updated'
  | 'logged_in'
  | 'login_failed'
  | 'logged_out'
  | 'password_changed';

export interface AuditLog {
  id: number;
  user_id: number | null;
  user_name: string | null;
  user_email: string | null;
  user_role: string | null;
  action: AuditAction;
  entity_type: string;
  entity_id: number;
  entity_label: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: string;
}

export interface AuditLogPage {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly api = inject(ApiClientService);
  private readonly http = inject(HttpClient);
  private readonly slugService = inject(SlugService);

  list(params: QueryParams = {}): Observable<AuditLogPage> {
    return this.api.get<AuditLogPage>(this.endpoint('admin/audit-logs'), { params });
  }

  /** Descarga los registros que matchean los filtros como CSV (Blob). */
  exportCsv(params: QueryParams = {}): Observable<Blob> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    const url = `${environment.apiUrl}${this.endpoint('admin/audit-logs/export')}`;
    return this.http.get(url, { params: httpParams, responseType: 'blob' });
  }

  private endpoint(path: string): string {
    return this.slugService.buildApiEndpoint(path);
  }
}
