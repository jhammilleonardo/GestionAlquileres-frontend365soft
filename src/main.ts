import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';
import { setupSentry } from './app/core/sentry/sentry.setup';
import * as Sentry from '@sentry/browser';

setupSentry(environment.sentryDsn, environment.sentryEnv);

void bootstrapApplication(App, appConfig).catch((error: unknown) => {
  Sentry.captureException(error);
  throw error;
});
