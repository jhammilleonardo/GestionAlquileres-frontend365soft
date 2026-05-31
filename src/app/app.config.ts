import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  provideBrowserGlobalErrorListeners,
  isDevMode,
  signal,
} from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { provideTransloco, TranslocoLoader, Translation } from '@jsverse/transloco';
import { provideTaiga, TUI_DARK_MODE } from '@taiga-ui/core';
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
    provideTaiga({
      apis: 'stable',
      fontScaling: false,
      scrollbars: 'native',
    }),
    // La app está diseñada solo en tema claro (fondos claros fijos). Forzamos el
    // modo claro de Taiga para que NO siga el modo oscuro del SO, que dejaba el
    // texto de los inputs en blanco sobre fondo blanco (invisible al escribir).
    {
      provide: TUI_DARK_MODE,
      useFactory: () => Object.assign(signal(false), { reset: () => undefined }),
    },
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
