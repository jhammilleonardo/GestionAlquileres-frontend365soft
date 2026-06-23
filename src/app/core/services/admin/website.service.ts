import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClientService } from '../../http/api-client.service';
import { SlugService } from '../slug.service';

export interface FaqItem {
  question: string;
  answer: string;
}

export interface SectionCard {
  title: string;
  description: string;
}

export interface TenantWebsiteConfig {
  id?: number;
  subdomain?: string | null;
  company_description?: string | null;
  logo_url?: string | null;
  hero_image_url?: string | null;
  hero_title?: string | null;
  hero_subtitle?: string | null;
  about_content?: string | null;
  faq_items?: FaqItem[] | null;
  home_features?: SectionCard[] | null;
  about_values?: SectionCard[] | null;
  cta_title?: string | null;
  cta_subtitle?: string | null;
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

  setPublished(published: boolean): Observable<TenantWebsiteConfig> {
    return this.api.patch<TenantWebsiteConfig, { published: boolean }>(
      this.endpoint('admin/website/publish'),
      { published },
    );
  }

  uploadLogo(file: File): Observable<TenantWebsiteConfig> {
    return this.uploadImage('admin/website/logo', file);
  }

  uploadHero(file: File): Observable<TenantWebsiteConfig> {
    return this.uploadImage('admin/website/hero', file);
  }

  private uploadImage(path: string, file: File): Observable<TenantWebsiteConfig> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post<TenantWebsiteConfig, FormData>(this.endpoint(path), formData);
  }

  private endpoint(path: string): string {
    return this.slugService.buildApiEndpoint(path);
  }
}
