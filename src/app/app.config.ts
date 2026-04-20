import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  provideBrowserGlobalErrorListeners,
  isDevMode,
} from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { provideTransloco, TranslocoLoader, Translation } from '@jsverse/transloco';
import { Observable } from 'rxjs';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { SentryErrorHandler } from './core/sentry/sentry-error-handler';

class TranslocoHttpLoader implements TranslocoLoader {
  private http = inject(HttpClient);

  getTranslation(langPath: string, data?: { scope?: string }): Observable<Translation> {
    if (data?.scope) {
      const lang = langPath.split('/').pop()!;
      return this.http.get<Translation>(`/i18n/${lang}/${data.scope}.json`);
    }
    return this.http.get<Translation>(`/i18n/${langPath}.json`);
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withRouterConfig({ paramsInheritanceStrategy: 'always' })),
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    { provide: ErrorHandler, useClass: SentryErrorHandler },
    provideTransloco({
      config: {
        availableLangs: ['es', 'en'],
        defaultLang: 'es',
        fallbackLang: 'es',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
        missingHandler: {
          useFallbackTranslation: true,
          allowEmpty: false,
        },
      },
      loader: TranslocoHttpLoader,
    }),
  ],
};
