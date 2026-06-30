import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  WritableSignal,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { startWith } from 'rxjs';
import { TranslocoModule, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import {
  LucideAngularModule,
  Globe,
  ExternalLink,
  Eye,
  EyeOff,
  Search,
  Mail,
  Phone,
  Facebook,
  Instagram,
  MessageCircle,
  Plus,
  Trash2,
  HelpCircle,
  MapPin,
  Building2,
  ChevronDown,
  CheckCircle,
  Star,
  Heart,
  Award,
  Clock,
  BedDouble,
  Bath,
  Send,
  Copy,
} from 'lucide-angular';
import type { LucideIconData } from 'lucide-angular';

import { TenantWebsiteConfig, WebsiteService } from '../../core/services/admin/website.service';
import { SlugService } from '../../core/services/slug.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { AppTextFieldComponent } from '../../shared/ui/text-field/text-field.component';
import { AppTextareaComponent } from '../../shared/ui/textarea/textarea.component';
import { AppLoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { AppPageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { AppStatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { AppImageUploaderComponent } from '../../shared/ui/image-uploader/image-uploader.component';
import { resolveMediaUrl } from '../../core/utils/media-url.util';

import { getApiErrorMessage } from '../../core/http/http-error.util';
import { normalizeSocialUrl } from '../../core/utils/social-link.util';

type WebsiteTab = 'inicio' | 'propiedades' | 'nosotros' | 'contacto' | 'general';

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
    AppImageUploaderComponent,
  ],
  providers: [
    provideTranslocoScope({ scope: 'sitioweb', alias: 'website' }),
    provideTranslocoScope({ scope: 'portal-publico', alias: 'public' }),
  ],
  templateUrl: './website-admin.component.html',
  styleUrl: './website-admin.component.scss',
})
export class WebsiteAdminComponent {
  readonly Globe = Globe;
  readonly ExternalLink = ExternalLink;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly Search = Search;
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly Plus = Plus;
  readonly Trash2 = Trash2;
  readonly CheckCircle = CheckCircle;
  readonly HelpCircle = HelpCircle;
  readonly MapPin = MapPin;
  readonly Building2 = Building2;
  readonly ChevronDown = ChevronDown;
  readonly Clock = Clock;
  readonly BedDouble = BedDouble;
  readonly Bath = Bath;
  readonly Send = Send;
  readonly Copy = Copy;
  readonly year = new Date().getFullYear();

  // Datos de muestra para enriquecer la previsualización (texto vía i18n)
  readonly previewFeatures = [
    { icon: CheckCircle, title: 'public.home.f1Title', desc: 'public.home.f1Desc' },
    { icon: Star, title: 'public.home.f2Title', desc: 'public.home.f2Desc' },
    { icon: Building2, title: 'public.home.f3Title', desc: 'public.home.f3Desc' },
  ];
  readonly previewValues = [
    { icon: Heart, title: 'public.about.v1Title', desc: 'public.about.v1Desc' },
    { icon: Award, title: 'public.about.v2Title', desc: 'public.about.v2Desc' },
    { icon: Star, title: 'public.about.v3Title', desc: 'public.about.v3Desc' },
    { icon: CheckCircle, title: 'public.about.v4Title', desc: 'public.about.v4Desc' },
  ];
  readonly previewSampleProps = [
    { title: 'website.sampleProp1', city: 'website.sampleCity1' },
    { title: 'website.sampleProp2', city: 'website.sampleCity2' },
    { title: 'website.sampleProp3', city: 'website.sampleCity3' },
  ];

  private readonly fb = inject(FormBuilder);
  private readonly websiteService = inject(WebsiteService);
  private readonly slugService = inject(SlugService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly isLoading = signal(true);
  readonly saving = signal(false);
  readonly publishing = signal(false);
  readonly uploadingLogo = signal(false);
  readonly uploadingHero = signal(false);
  readonly config = signal<TenantWebsiteConfig | null>(null);

  // Archivos seleccionados en los uploaders (para mostrar miniatura + recorte)
  readonly logoFiles = signal<File[]>([]);
  readonly heroFiles = signal<File[]>([]);

  // Confirmación visible de la imagen activa: formato (ya convertido a WebP por el
  // uploader) y peso, para que el usuario sepa con certeza qué se subió.
  readonly logoFileInfo = computed(() => this.describeFile(this.logoFiles()[0]));
  readonly heroFileInfo = computed(() => this.describeFile(this.heroFiles()[0]));

  readonly isPublished = computed(() => this.config()?.is_published ?? false);
  readonly linkCopied = signal(false);

  // Previsualizaciones de logo y fondo gestionadas por subida (no van en el form)
  readonly logoPreview = computed(() => {
    const path = this.config()?.logo_url;
    return path ? resolveMediaUrl(path) : null;
  });
  readonly heroPreview = computed(() => {
    const path = this.config()?.hero_image_url;
    return path ? resolveMediaUrl(path) : null;
  });

  readonly form = this.fb.group({
    company_description: [''],
    hero_title: [''],
    hero_subtitle: [''],
    about_content: [''],
    cta_title: [''],
    cta_subtitle: [''],
    primary_color: ['#2563eb'],
    contact_email: [''],
    contact_phone: [''],
    meta_title: [''],
    meta_description: [''],
    facebook: [''],
    instagram: [''],
    whatsapp: [''],
    home_features: this.fb.array<FormGroup>([]),
    about_values: this.fb.array<FormGroup>([]),
  });

  get homeFeatures(): FormArray<FormGroup> {
    return this.form.get('home_features') as FormArray<FormGroup>;
  }

  get aboutValues(): FormArray<FormGroup> {
    return this.form.get('about_values') as FormArray<FormGroup>;
  }

  /** Tarjeta editable (título + descripción) usada por features y valores. */
  private cardGroup(title = '', description = ''): FormGroup {
    return this.fb.group({
      title: [title, [Validators.required, Validators.maxLength(120)]],
      description: [description, [Validators.required, Validators.maxLength(400)]],
    });
  }

  addFeature(title = '', description = ''): void {
    this.homeFeatures.push(this.cardGroup(title, description));
  }

  removeFeature(index: number): void {
    this.homeFeatures.removeAt(index);
  }

  addValue(title = '', description = ''): void {
    this.aboutValues.push(this.cardGroup(title, description));
  }

  removeValue(index: number): void {
    this.aboutValues.removeAt(index);
  }

  readonly publicUrl = computed(() => {
    const slug = this.slugService.getSlug();
    return `/${slug}/publico/propiedades`;
  });

  /** URL pública absoluta del sitio, para mostrar y copiar al portapapeles. */
  readonly absolutePublicUrl = computed(() => `${window.location.origin}${this.publicUrl()}`);

  // ── Secciones (alineadas con la navegación del portal) ─────────
  readonly tabs: { id: WebsiteTab; labelKey: string }[] = [
    { id: 'inicio', labelKey: 'public.nav.home' },
    { id: 'propiedades', labelKey: 'public.nav.properties' },
    { id: 'nosotros', labelKey: 'public.nav.about' },
    { id: 'contacto', labelKey: 'public.nav.contact' },
    { id: 'general', labelKey: 'website.tabGeneral' },
  ];
  readonly activeTab = signal<WebsiteTab>('inicio');

  readonly tabLabelKey = computed(
    () => this.tabs.find((t) => t.id === this.activeTab())?.labelKey ?? 'website.tabGeneral',
  );

  setTab(tab: WebsiteTab): void {
    this.activeTab.set(tab);
  }

  // ── Previsualización (portal real embebido en iframe) ──────────
  // Mostramos la página pública real para que sea idéntica al portal.
  // Refleja lo guardado; tras guardar/subir se refresca con un cache-buster.
  readonly showPreview = signal(true);
  private readonly previewVersion = signal(0);

  private readonly tabRoute: Record<WebsiteTab, string> = {
    inicio: 'inicio',
    propiedades: 'propiedades',
    nosotros: 'nosotros',
    contacto: 'contacto',
    general: 'inicio',
  };

  readonly previewUrl = computed<SafeResourceUrl>(() => {
    const slug = this.slugService.getSlug();
    const route = this.tabRoute[this.activeTab()];
    const url = `/${slug}/publico/${route}?preview=${this.previewVersion()}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  private readonly previewFrame = viewChild<ElementRef<HTMLIFrameElement>>('previewFrame');

  /** Reenvía el color al recargarse el iframe para que lo aplique de inmediato. */
  protected onPreviewLoad(): void {
    this.postBrandToPreview(this.previewPrimary());
  }

  /**
   * Recolorea el portal embebido en vivo (sin recargarlo) enviando el color
   * elegido por postMessage. Mismo origen (localhost:4200), por eso targetOrigin
   * es el origen actual.
   */
  private postBrandToPreview(primary: string): void {
    const frame = this.previewFrame()?.nativeElement;
    frame?.contentWindow?.postMessage({ type: 'brand-preview', primary }, window.location.origin);
  }

  private refreshPreview(): void {
    this.previewVersion.update((v) => v + 1);
  }

  readonly liveValues = toSignal(this.form.valueChanges.pipe(startWith(this.form.getRawValue())), {
    initialValue: this.form.getRawValue(),
  });

  readonly previewPrimary = computed(() => this.liveValues().primary_color || '#2563eb');
  // El portal usa un único color de marca; el segundo tono de los degradados se
  // deriva automáticamente oscureciendo el primario (mantiene profundidad visual).
  readonly previewSecondary = computed(
    () => `color-mix(in srgb, ${this.previewPrimary()} 75%, #000)`,
  );
  readonly previewName = computed(
    () => this.slugService.currentTenant()?.company_name || this.slugService.getSlug() || '365Soft',
  );
  readonly previewDescription = computed(() => this.liveValues().company_description || '');
  readonly previewHeroTitle = computed(() => this.liveValues().hero_title || '');
  readonly previewHeroSubtitle = computed(() => this.liveValues().hero_subtitle || '');
  readonly previewEmail = computed(() => this.liveValues().contact_email || '');
  readonly previewPhone = computed(() => this.liveValues().contact_phone || '');

  readonly previewAbout = computed(() => this.liveValues().about_content || '');

  readonly previewSocial = computed(() => {
    const v = this.liveValues();
    const links: { name: string; icon: LucideIconData; url: string }[] = [];
    const facebook = normalizeSocialUrl('facebook', v.facebook);
    const instagram = normalizeSocialUrl('instagram', v.instagram);
    const whatsapp = normalizeSocialUrl('whatsapp', v.whatsapp);
    if (facebook) links.push({ name: 'Facebook', icon: Facebook, url: facebook });
    if (instagram) links.push({ name: 'Instagram', icon: Instagram, url: instagram });
    if (whatsapp) links.push({ name: 'WhatsApp', icon: MessageCircle, url: whatsapp });
    return links;
  });

  readonly previewHeroStyle = computed(() => {
    const hero = this.heroPreview();
    return hero
      ? `url('${hero}') center / cover no-repeat`
      : `linear-gradient(135deg, ${this.previewPrimary()} 0%, ${this.previewSecondary()} 100%)`;
  });

  togglePreview(): void {
    this.showPreview.update((v) => !v);
  }

  constructor() {
    this.load();
    // Recolorea el preview en vivo al mover el selector de color (sin recargar).
    effect(() => {
      this.postBrandToPreview(this.previewPrimary());
    });
  }

  load(): void {
    this.isLoading.set(true);
    this.websiteService.getConfig().subscribe({
      next: (config) => {
        this.config.set(config);
        const social = config.social_links ?? {};
        this.form.patchValue({
          company_description: config.company_description ?? '',
          hero_title: config.hero_title ?? '',
          hero_subtitle: config.hero_subtitle ?? '',
          about_content: config.about_content ?? '',
          cta_title: config.cta_title ?? '',
          cta_subtitle: config.cta_subtitle ?? '',
          primary_color: config.primary_color ?? '#2563eb',
          contact_email: config.contact_email ?? '',
          contact_phone: config.contact_phone ?? '',
          meta_title: config.meta_title ?? '',
          meta_description: config.meta_description ?? '',
          facebook: social['facebook'] ?? '',
          instagram: social['instagram'] ?? '',
          whatsapp: social['whatsapp'] ?? '',
        });
        this.homeFeatures.clear();
        for (const item of config.home_features ?? []) {
          this.addFeature(item.title, item.description);
        }
        this.aboutValues.clear();
        for (const item of config.about_values ?? []) {
          this.addValue(item.title, item.description);
        }
        // Precargar las imágenes guardadas en los uploaders para poder editarlas/recortarlas
        void this.seedUploader(config.logo_url, this.logoFiles, 'logo.webp');
        void this.seedUploader(config.hero_image_url, this.heroFiles, 'hero.webp');
        this.isLoading.set(false);
      },
      error: (err: unknown) => {
        this.isLoading.set(false);
        this.toast.error(getApiErrorMessage(err, this.transloco.translate('website.saveError')));
      },
    });
  }

  save(): void {
    const raw = this.form.getRawValue();
    const social_links: Record<string, string> = {};
    const facebook = normalizeSocialUrl('facebook', raw.facebook);
    const instagram = normalizeSocialUrl('instagram', raw.instagram);
    const whatsapp = normalizeSocialUrl('whatsapp', raw.whatsapp);
    if (facebook) social_links['facebook'] = facebook;
    if (instagram) social_links['instagram'] = instagram;
    if (whatsapp) social_links['whatsapp'] = whatsapp;

    const cardsFrom = (array: FormArray<FormGroup>) =>
      array.controls
        .map((group) => ({
          title: ((group.get('title')?.value as string | null) ?? '').trim(),
          description: ((group.get('description')?.value as string | null) ?? '').trim(),
        }))
        .filter((item) => item.title && item.description);

    const home_features = cardsFrom(this.homeFeatures);
    const about_values = cardsFrom(this.aboutValues);

    this.saving.set(true);
    this.websiteService
      .update({
        company_description: raw.company_description || undefined,
        hero_title: raw.hero_title || undefined,
        hero_subtitle: raw.hero_subtitle || undefined,
        about_content: raw.about_content || undefined,
        cta_title: raw.cta_title || undefined,
        cta_subtitle: raw.cta_subtitle || undefined,
        primary_color: raw.primary_color || undefined,
        contact_email: raw.contact_email || undefined,
        contact_phone: raw.contact_phone || undefined,
        meta_title: raw.meta_title || undefined,
        meta_description: raw.meta_description || undefined,
        social_links,
        home_features,
        about_values,
      })
      .subscribe({
        next: (config) => {
          this.saving.set(false);
          this.config.set(config);
          this.toast.success(this.transloco.translate('website.saved'));
          this.refreshPreview();
        },
        error: (err: { error?: { message?: string } }) => {
          this.saving.set(false);
          this.toast.error(getApiErrorMessage(err, this.transloco.translate('website.saveError')));
        },
      });
  }

  /** Publica el sitio. No-op si ya está publicado o hay una operación en curso. */
  publish(): void {
    if (this.publishing() || this.isPublished()) {
      return;
    }
    this.setPublished(true);
  }

  /**
   * Despublica el sitio tras confirmación: es una acción que lo oculta del
   * público, así que se pide confirmación explícita para evitar clics accidentales.
   */
  async unpublish(): Promise<void> {
    if (this.publishing() || !this.isPublished()) {
      return;
    }
    const confirmed = await this.confirmDialog.confirm({
      title: this.transloco.translate('website.unpublishConfirmTitle'),
      message: this.transloco.translate('website.unpublishConfirmMessage'),
      confirmLabel: this.transloco.translate('website.unpublish'),
      cancelLabel: this.transloco.translate('common.cancel'),
      variant: 'danger',
    });
    if (!confirmed) {
      return;
    }
    this.setPublished(false);
  }

  /**
   * Fija el estado de publicación con un objetivo explícito (idempotente). El
   * backend devuelve la fila completa, que pasa a ser la fuente de verdad local,
   * y refrescamos la previsualización para reflejar el cambio de inmediato.
   */
  private setPublished(target: boolean): void {
    this.publishing.set(true);
    this.websiteService.setPublished(target).subscribe({
      next: (config) => {
        this.publishing.set(false);
        this.config.set(config);
        this.toast.success(
          this.transloco.translate(
            config.is_published ? 'website.publishSuccess' : 'website.unpublishSuccess',
          ),
        );
        this.refreshPreview();
      },
      error: (err: unknown) => {
        this.publishing.set(false);
        this.toast.error(getApiErrorMessage(err, this.transloco.translate('website.saveError')));
      },
    });
  }

  /** Copia la URL pública del sitio al portapapeles con confirmación efímera. */
  async copyPublicLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.absolutePublicUrl());
      this.linkCopied.set(true);
      setTimeout(() => this.linkCopied.set(false), 2000);
    } catch {
      this.toast.error(this.transloco.translate('website.copyError'));
    }
  }

  /** Descarga la imagen guardada y la coloca como archivo editable en el uploader. */
  private describeFile(file: File | undefined): { ext: string; size: string } | null {
    if (!file) {
      return null;
    }
    const ext = (file.type.split('/')[1] || file.name.split('.').pop() || '').toUpperCase();
    const size =
      file.size < 1024 * 1024
        ? `${Math.max(1, Math.round(file.size / 1024))} KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    return { ext, size };
  }

  private async seedUploader(
    url: string | null | undefined,
    target: WritableSignal<File[]>,
    name: string,
  ): Promise<void> {
    if (!url) {
      target.set([]);
      return;
    }
    try {
      const response = await fetch(resolveMediaUrl(url));
      if (!response.ok) {
        return;
      }
      const blob = await response.blob();
      target.set([new File([blob], name, { type: blob.type || 'image/webp' })]);
    } catch {
      // Si falla la descarga, el uploader queda vacío; la "Imagen actual" sigue visible.
    }
  }

  onLogoSelected(files: File[]): void {
    this.logoFiles.set(files);
    const file = files[files.length - 1];
    if (!file) {
      return;
    }
    this.uploadingLogo.set(true);
    this.websiteService.uploadLogo(file).subscribe({
      next: (config) => {
        this.uploadingLogo.set(false);
        this.config.set(config);
        this.toast.success(this.transloco.translate('website.imageUploaded'));
        this.refreshPreview();
      },
      error: (err: { error?: { message?: string } }) => {
        this.uploadingLogo.set(false);
        this.toast.error(getApiErrorMessage(err, this.transloco.translate('website.saveError')));
      },
    });
  }

  onHeroSelected(files: File[]): void {
    this.heroFiles.set(files);
    const file = files[files.length - 1];
    if (!file) {
      return;
    }
    this.uploadingHero.set(true);
    this.websiteService.uploadHero(file).subscribe({
      next: (config) => {
        this.uploadingHero.set(false);
        this.config.set(config);
        this.toast.success(this.transloco.translate('website.imageUploaded'));
        this.refreshPreview();
      },
      error: (err: { error?: { message?: string } }) => {
        this.uploadingHero.set(false);
        this.toast.error(getApiErrorMessage(err, this.transloco.translate('website.saveError')));
      },
    });
  }

  openPreview(): void {
    window.open(this.publicUrl(), '_blank');
  }
}
