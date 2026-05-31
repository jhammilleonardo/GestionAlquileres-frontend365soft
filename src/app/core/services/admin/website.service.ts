import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClientService } from '../../http/api-client.service';
import { SlugService } from '../slug.service';

export interface TenantWebsiteConfig {
  id?: number;
  subdomain?: string | null;
  company_description?: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  social_links?: Record<string, string> | null;
  meta_title?: string | null;
  meta_description?: string | null;
  is_published: boolean;
}

export type UpdateWebsiteDto = Partial<Omit<TenantWebsiteConfig, 'id' | 'is_published'>>;

@Injectable({ providedIn: 'root' })
export class WebsiteService {
  private readonly api = inject(ApiClientService);
  private readonly slugService = inject(SlugService);

  getConfig(): Observable<TenantWebsiteConfig> {
    return this.api.get<TenantWebsiteConfig>(this.endpoint('admin/website'));
  }

  update(dto: UpdateWebsiteDto): Observable<TenantWebsiteConfig> {
    return this.api.patch<TenantWebsiteConfig, UpdateWebsiteDto>(
      this.endpoint('admin/website'),
      dto,
    );
  }

  togglePublish(): Observable<TenantWebsiteConfig> {
    return this.api.patch<TenantWebsiteConfig, Record<string, never>>(
      this.endpoint('admin/website/publish'),
      {},
    );
  }

  private endpoint(path: string): string {
    return this.slugService.buildApiEndpoint(path);
  }
}
