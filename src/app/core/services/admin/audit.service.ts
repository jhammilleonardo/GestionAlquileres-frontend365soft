import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClientService, QueryParams } from '../../http/api-client.service';
import { SlugService } from '../slug.service';

export type AuditAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'approved'
  | 'rejected'
  | 'status_changed'
  | 'signed'
  | 'renewed'
  | 'permissions_updated';

export interface AuditLog {
  id: number;
  user_id: number | null;
  action: AuditAction;
  entity_type: string;
  entity_id: number;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
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
  private readonly slugService = inject(SlugService);

  list(params: QueryParams = {}): Observable<AuditLogPage> {
    return this.api.get<AuditLogPage>(this.endpoint('admin/audit-logs'), { params });
  }

  private endpoint(path: string): string {
    return this.slugService.buildApiEndpoint(path);
  }
}
