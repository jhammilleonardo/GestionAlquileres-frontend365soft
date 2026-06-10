import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { filter } from 'rxjs';
import { AuthService } from './auth.service';
import { SlugService } from './slug.service';
import { TenantAuthService } from './tenant/tenant-auth.service';
import { OwnerAuthService } from './owner/owner-auth.service';

export type AppLanguage = 'es' | 'en';
type LanguageContext = 'admin' | 'tenant' | 'owner' | 'vendor' | 'public' | 'anonymous';

const SUPPORTED_LANGUAGES: AppLanguage[] = ['es', 'en'];
const STORAGE_KEY_PREFIX = 'lang_';

/**
 * Maneja el idioma de la app de forma **independiente por contexto**
 * (admin / inquilino / owner), por tenant (slug) y por usuario. Así, cambiar el
 * idioma en un rol no afecta a los demás. La clave de persistencia es
 * `lang_<contexto>_<slug>_<userId>`, y el idioma del contexto activo se
 * re-aplica automáticamente cuando cambia la sesión (login/logout).
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private translocoService = inject(TranslocoService);
  private router = inject(Router);
  private adminAuth = inject(AuthService);
  private tenantAuth = inject(TenantAuthService);
  private ownerAuth = inject(OwnerAuthService);
  private slugService = inject(SlugService);
  private activeUrlSignal = signal(this.router.url);

  private currentLangSignal = signal<AppLanguage>(
    this.readSaved(`${STORAGE_KEY_PREFIX}anonymous`) ?? 'es',
  );

  /** Idioma activo como signal */
  readonly currentLang = this.currentLangSignal.asReadonly();

  readonly isEnglish = computed(() => this.currentLangSignal() === 'en');
  readonly isSpanish = computed(() => this.currentLangSignal() === 'es');

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        this.activeUrlSignal.set(event.urlAfterRedirects);
      });

    // Re-aplica el idioma del contexto cada vez que cambia la sesión activa
    // o la URL. La URL define el contexto real (admin/inquilino/owner);
    // no basta con mirar qué tokens existen, porque pueden coexistir.
    effect(() => {
      this.activeUrlSignal();
      this.adminAuth.currentUser();
      this.tenantAuth.currentUser();
      this.ownerAuth.currentOwner();
      untracked(() => this.applyForActiveSession());
    });
  }

  /** Inicializa Transloco con el idioma del contexto activo. Llamar al arrancar. */
  init(): void {
    this.applyForActiveSession();
  }

  /** Cambia el idioma del contexto/usuario actual sin recargar la página. */
  setLanguage(lang: AppLanguage): void {
    localStorage.setItem(this.activeKey(), lang);
    this.applyLang(lang);
  }

  /** Devuelve los idiomas disponibles. */
  getAvailable(): AppLanguage[] {
    return SUPPORTED_LANGUAGES;
  }

  private applyForActiveSession(): void {
    const saved = this.readSaved(this.activeKey());
    if (saved) {
      this.applyLang(saved);
    } else {
      // Sin preferencia guardada para este usuario: conserva el idioma actual
      // (ej. el elegido en la pantalla de login) y lo persiste como su default.
      localStorage.setItem(this.activeKey(), this.currentLangSignal());
    }
  }

  private applyLang(lang: AppLanguage): void {
    this.currentLangSignal.set(lang);
    this.translocoService.setActiveLang(lang);
  }

  /** Clave de persistencia del contexto activo: lang_<contexto>_<slug>_<userId>. */
  private activeKey(): string {
    const context = this.activeContext();
    const slug = this.slugFromUrl() || this.slugService.getSlug() || 'global';

    if (context === 'tenant') {
      return `${STORAGE_KEY_PREFIX}tenant_${slug}_${this.tenantAuth.currentUser()?.id ?? 'anonymous'}`;
    }

    if (context === 'owner') {
      return `${STORAGE_KEY_PREFIX}owner_${slug}_${this.ownerAuth.currentOwner()?.id ?? 'anonymous'}`;
    }

    if (context === 'vendor') {
      return `${STORAGE_KEY_PREFIX}vendor_${slug}_anonymous`;
    }

    if (context === 'admin') {
      return `${STORAGE_KEY_PREFIX}admin_${slug}_${this.adminAuth.currentUser()?.id ?? 'anonymous'}`;
    }

    if (context === 'public') {
      return `${STORAGE_KEY_PREFIX}public_${slug}_anonymous`;
    }

    return `${STORAGE_KEY_PREFIX}anonymous`;
  }

  private activeContext(): LanguageContext {
    const segments = this.urlSegments();

    if (segments.length === 0) {
      return 'public';
    }

    const first = segments[0];
    const second = segments[1];

    if (['login', 'register', 'forgot-password', 'reset-password'].includes(first)) {
      return this.adminAuth.currentUser() ? 'admin' : 'anonymous';
    }

    if (second === 'portal' || second === 'login' || second === 'register') {
      return 'tenant';
    }

    if (second === 'owner') {
      return 'owner';
    }

    if (second === 'vendor') {
      return 'vendor';
    }

    if (second === 'publico') {
      return 'public';
    }

    return 'admin';
  }

  private slugFromUrl(): string | null {
    const first = this.urlSegments()[0];
    if (!first || ['login', 'register', 'forgot-password', 'reset-password'].includes(first)) {
      return null;
    }
    return first;
  }

  private urlSegments(): string[] {
    const url = this.activeUrlSignal().split('?')[0].split('#')[0];
    return url.split('/').filter(Boolean);
  }

  private readSaved(key: string): AppLanguage | null {
    const saved = localStorage.getItem(key);
    return saved && SUPPORTED_LANGUAGES.includes(saved as AppLanguage)
      ? (saved as AppLanguage)
      : null;
  }
}
