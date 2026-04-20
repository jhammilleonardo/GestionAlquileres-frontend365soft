import { Injectable, inject, signal, computed } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { AuthService } from './auth.service';

export type AppLanguage = 'es' | 'en';

const SUPPORTED_LANGUAGES: AppLanguage[] = ['es', 'en'];
const STORAGE_KEY_PREFIX = 'lang_';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private translocoService = inject(TranslocoService);
  private authService = inject(AuthService);

  private currentLangSignal = signal<AppLanguage>(this.resolve());

  /** Idioma activo como signal */
  readonly currentLang = this.currentLangSignal.asReadonly();

  readonly isEnglish = computed(() => this.currentLangSignal() === 'en');
  readonly isSpanish = computed(() => this.currentLangSignal() === 'es');

  /** Inicializa Transloco con el idioma resuelto. Llamar una vez al arrancar la app. */
  init(): void {
    const lang = this.resolve();
    this.applyLang(lang);
  }

  /** Cambia el idioma del usuario actual sin recargar la página. */
  setLanguage(lang: AppLanguage): void {
    const userId = this.authService.currentUser()?.id;
    const key = userId ? `${STORAGE_KEY_PREFIX}${userId}` : `${STORAGE_KEY_PREFIX}anonymous`;
    localStorage.setItem(key, lang);
    this.applyLang(lang);
  }

  /** Devuelve los idiomas disponibles. */
  getAvailable(): AppLanguage[] {
    return SUPPORTED_LANGUAGES;
  }

  private applyLang(lang: AppLanguage): void {
    this.currentLangSignal.set(lang);
    this.translocoService.setActiveLang(lang);
  }

  /**
   * Resuelve el idioma a usar según esta prioridad:
   * 1. Preferencia guardada del usuario en localStorage
   * 2. 'es' como fallback
   */
  private resolve(): AppLanguage {
    const userId = this.authService.currentUser()?.id;
    const key = userId ? `${STORAGE_KEY_PREFIX}${userId}` : `${STORAGE_KEY_PREFIX}anonymous`;
    const saved = localStorage.getItem(key);
    if (saved && SUPPORTED_LANGUAGES.includes(saved as AppLanguage)) {
      return saved as AppLanguage;
    }
    return 'es';
  }
}
