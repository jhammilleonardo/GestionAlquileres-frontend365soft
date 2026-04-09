import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';
import { setupSentry } from './app/core/sentry/sentry.setup';

setupSentry(environment.sentryDsn, environment.sentryEnv);

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
