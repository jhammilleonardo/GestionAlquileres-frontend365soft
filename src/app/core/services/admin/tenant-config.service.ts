import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface TenantConfig {
  country: string;
  currency: string;
  language: string;
  timezone: string;
  date_format: string;
  rental_type: 'LONG_TERM' | 'SHORT_TERM' | 'BOTH';
  payment_methods: string[];
  notification_channels: string[];
  commission_percentage: number;
  grace_days_late_fee: number;
  late_fee_percentage: number;
  setup_completed: boolean;
}

export interface UpdateTenantConfigDto {
  country?: string;
  currency?: string;
  language?: string;
  timezone?: string;
  date_format?: string;
  rental_type?: 'LONG_TERM' | 'SHORT_TERM' | 'BOTH';
  payment_methods?: string[];
  notification_channels?: string[];
  commission_percentage?: number;
  grace_days_late_fee?: number;
  late_fee_percentage?: number;
}

@Injectable({ providedIn: 'root' })
export class TenantConfigService {
  private http = inject(HttpClient);

  getConfig(slug: string): Observable<TenantConfig> {
    return this.http.get<TenantConfig>(`${environment.apiUrl}${slug}/admin/config`);
  }

  updateConfig(slug: string, data: UpdateTenantConfigDto): Observable<TenantConfig> {
    return this.http.patch<TenantConfig>(`${environment.apiUrl}${slug}/admin/config`, data);
  }

  markSetupComplete(slug: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(
      `${environment.apiUrl}${slug}/admin/config/setup-complete`,
      {},
    );
  }
}
