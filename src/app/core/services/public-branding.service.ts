import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Meta, Title } from '@angular/platform-browser';
import { catchError, of, tap } from 'rxjs';

import { ApiClientService } from '../http/api-client.service';
import { SlugService } from './slug.service';
import { resolveMediaUrl } from '../utils/media-url.util';

/**
 * Estado de carga del branding del portal:
 * - `loading`: aún resolviendo.
 * - `ready`: branding disponible (sitio publicado, o staff en preview).
 * - `unavailable`: el sitio no existe o no está publicado (404) → el portal
 *   debe mostrar la pantalla "Sitio no disponible".
 */
export type BrandingStatus = 'loading' | 'ready' | 'unavailable';

export interface FaqItem {
  question: string;
  answer: string;
}

export interface SectionCard {
  title: string;
  description: string;
}

export interface PublicBranding {
  company_name: string;
  logo_url: string | null;
  hero_image_url: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  about_content: string | null;
  faq_items: FaqItem[];
  home_features: SectionCard[];
  about_values: SectionCard[];
  cta_title: string | null;
  cta_subtitle: string | null;
  primary_color: string;
  secondary_color: string;
  company_description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  social_links: Record<string, string>;
  meta_title: string | null;
  meta_description: string | null;
  is_published: boolean;
}

/**
 * Branding del portal público de un tenant (logo, colores, contacto, redes, SEO).
 * Lo consume el portal anónimo (`/:slug/publico/*`) para personalizar su apariencia.
 */
@Injectable({ providedIn: 'root' })
export class PublicBrandingService {
  private readonly api = inject(ApiClientService);
  private readonly slugService = inject(SlugService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  readonly branding = signal<PublicBranding | null>(null);
  readonly status = signal<BrandingStatus>('loading');

  private loadedSlug: string | null = null;

  /** Carga el branding una sola vez por slug. */
  load(slug: string): void {
    if (!slug || this.loadedSlug === slug) {
      return;
    }
    this.loadedSlug = slug;
    this.status.set('loading');

    this.api
      .get<PublicBranding>(this.slugService.buildApiEndpoint('catalog/website'))
      .pipe(
        tap((branding) => {
          this.branding.set(branding);
          this.status.set('ready');
          this.applySeo(branding);
        }),
        catchError((error: unknown) => {
          // 404 = sitio inexistente o no publicado → pantalla "no disponible".
          // Otros errores (red, 5xx) no deben ocultar el portal de forma
          // permanente; se reintentará al recargar (loadedSlug se resetea).
          if (error instanceof HttpErrorResponse && error.status === 404) {
            this.status.set('unavailable');
          } else {
            this.loadedSlug = null;
            this.status.set('ready');
          }
          this.branding.set(null);
          return of(null);
        }),
      )
      .subscribe();
  }

  /** URL absoluta del logo lista para usar en <img>, o null. */
  logoUrl(): string | null {
    const path = this.branding()?.logo_url;
    return path ? resolveMediaUrl(path) : null;
  }

  /** URL absoluta de la imagen de fondo, o null. */
  heroImageUrl(): string | null {
    const path = this.branding()?.hero_image_url;
    return path ? resolveMediaUrl(path) : null;
  }

  private applySeo(branding: PublicBranding): void {
    const title = branding.meta_title || branding.company_name;
    if (title) {
      this.title.setTitle(title);
    }
    if (branding.meta_description) {
      this.meta.updateTag({
        name: 'description',
        content: branding.meta_description,
      });
    }
  }
}
