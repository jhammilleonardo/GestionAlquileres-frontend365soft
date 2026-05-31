import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { TranslocoModule, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { LucideAngularModule, Globe, ExternalLink, Eye, EyeOff } from 'lucide-angular';

import { TenantWebsiteConfig, WebsiteService } from '../../core/services/admin/website.service';
import { SlugService } from '../../core/services/slug.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { AppTextFieldComponent } from '../../shared/ui/text-field/text-field.component';
import { AppTextareaComponent } from '../../shared/ui/textarea/textarea.component';
import { AppLoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { AppPageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { AppStatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';

import { getApiErrorMessage } from '../../core/http/http-error.util';
@Component({
  selector: 'app-website-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslocoModule,
    LucideAngularModule,
    AppButtonComponent,
    AppTextFieldComponent,
    AppTextareaComponent,
    AppLoadingStateComponent,
    AppPageHeaderComponent,
    AppStatusBadgeComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'sitioweb', alias: 'website' })],
  templateUrl: './website-admin.component.html',
  styleUrl: './website-admin.component.scss',
})
export class WebsiteAdminComponent {
  readonly Globe = Globe;
  readonly ExternalLink = ExternalLink;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;

  private readonly fb = inject(FormBuilder);
  private readonly websiteService = inject(WebsiteService);
  private readonly slugService = inject(SlugService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly isLoading = signal(true);
  readonly saving = signal(false);
  readonly publishing = signal(false);
  readonly config = signal<TenantWebsiteConfig | null>(null);

  readonly isPublished = computed(() => this.config()?.is_published ?? false);

  readonly form = this.fb.group({
    company_description: [''],
    logo_url: [''],
    primary_color: ['#2563eb'],
    secondary_color: ['#1d4ed8'],
    contact_email: [''],
    contact_phone: [''],
    meta_title: [''],
    meta_description: [''],
    facebook: [''],
    instagram: [''],
    whatsapp: [''],
  });

  readonly publicUrl = computed(() => {
    const slug = this.slugService.getSlug();
    return `/${slug}/publico/propiedades`;
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.websiteService.getConfig().subscribe({
      next: (config) => {
        this.config.set(config);
        const social = config.social_links ?? {};
        this.form.patchValue({
          company_description: config.company_description ?? '',
          logo_url: config.logo_url ?? '',
          primary_color: config.primary_color ?? '#2563eb',
          secondary_color: config.secondary_color ?? '#1d4ed8',
          contact_email: config.contact_email ?? '',
          contact_phone: config.contact_phone ?? '',
          meta_title: config.meta_title ?? '',
          meta_description: config.meta_description ?? '',
          facebook: social['facebook'] ?? '',
          instagram: social['instagram'] ?? '',
          whatsapp: social['whatsapp'] ?? '',
        });
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  save(): void {
    const raw = this.form.getRawValue();
    const social_links: Record<string, string> = {};
    if (raw.facebook) social_links['facebook'] = raw.facebook;
    if (raw.instagram) social_links['instagram'] = raw.instagram;
    if (raw.whatsapp) social_links['whatsapp'] = raw.whatsapp;

    this.saving.set(true);
    this.websiteService
      .update({
        company_description: raw.company_description || undefined,
        logo_url: raw.logo_url || undefined,
        primary_color: raw.primary_color || undefined,
        secondary_color: raw.secondary_color || undefined,
        contact_email: raw.contact_email || undefined,
        contact_phone: raw.contact_phone || undefined,
        meta_title: raw.meta_title || undefined,
        meta_description: raw.meta_description || undefined,
        social_links,
      })
      .subscribe({
        next: (config) => {
          this.saving.set(false);
          this.config.set(config);
          this.toast.success(this.transloco.translate('website.saved'));
        },
        error: (err: { error?: { message?: string } }) => {
          this.saving.set(false);
          this.toast.error(getApiErrorMessage(err, this.transloco.translate('website.saveError')));
        },
      });
  }

  togglePublish(): void {
    this.publishing.set(true);
    this.websiteService.togglePublish().subscribe({
      next: (config) => {
        this.publishing.set(false);
        this.config.set(config);
        this.toast.success(
          this.transloco.translate(
            config.is_published ? 'website.published' : 'website.unpublished',
          ),
        );
      },
      error: () => {
        this.publishing.set(false);
        this.toast.error(this.transloco.translate('website.saveError'));
      },
    });
  }

  openPreview(): void {
    window.open(this.publicUrl(), '_blank');
  }
}
