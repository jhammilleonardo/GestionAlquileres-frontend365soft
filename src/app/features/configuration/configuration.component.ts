import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Settings, Bell, Palette, Globe, CheckCircle2 } from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import {
  AppCheckboxComponent,
  AppPageHeaderComponent,
  AppSelectComponent,
  AppSelectOption,
} from '../../shared/ui';

interface AdminSettings {
  notifications_enabled: boolean;
  polling_interval: number;
  compact_mode: boolean;
}

const SETTINGS_KEY = 'admin_settings';

const DEFAULT_SETTINGS: AdminSettings = {
  notifications_enabled: true,
  polling_interval: 60000,
  compact_mode: false,
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-configuration',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    TranslocoModule,
    AppCheckboxComponent,
    AppPageHeaderComponent,
    AppSelectComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'configuracion', alias: 'config' })],
  template: `
    <div class="config-container">
      <app-page-header
        [title]="'config.title' | transloco"
        [description]="'config.subtitle' | transloco"
      />

      @if (savedSuccess()) {
        <div class="save-alert">
          <lucide-icon [img]="CheckCircle2" [size]="18"></lucide-icon>
          <span>{{ 'config.saved' | transloco }}</span>
        </div>
      }

      <div class="sections-grid">
        <section class="section-card">
          <div class="section-title">
            <lucide-icon [img]="Bell" [size]="20"></lucide-icon>
            <h2>{{ 'config.notificationsSection' | transloco }}</h2>
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">{{ 'config.enableNotif' | transloco }}</span>
              <span class="setting-desc">{{ 'config.enableNotifDesc' | transloco }}</span>
            </div>
            <app-checkbox
              [(ngModel)]="settings.notifications_enabled"
              (ngModelChange)="saveSettings()"
            >
              {{ 'config.enableNotif' | transloco }}
            </app-checkbox>
          </div>

          <div class="setting-row" [class.disabled]="!settings.notifications_enabled">
            <div class="setting-info">
              <span class="setting-label">{{ 'config.updateInterval' | transloco }}</span>
              <span class="setting-desc">{{ 'config.updateIntervalDesc' | transloco }}</span>
            </div>
            <app-select
              class="interval-select"
              [(ngModel)]="settings.polling_interval"
              [options]="pollingOptions"
              [disabled]="!settings.notifications_enabled"
              (ngModelChange)="saveSettings()"
            />
          </div>
        </section>

        <section class="section-card">
          <div class="section-title">
            <lucide-icon [img]="Palette" [size]="20"></lucide-icon>
            <h2>{{ 'config.appearanceSection' | transloco }}</h2>
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">{{ 'config.compactMode' | transloco }}</span>
              <span class="setting-desc">{{ 'config.compactModeDesc' | transloco }}</span>
            </div>
            <app-checkbox [(ngModel)]="settings.compact_mode" (ngModelChange)="saveSettings()">
              {{ 'config.compactMode' | transloco }}
            </app-checkbox>
          </div>
        </section>

        <section class="section-card">
          <div class="section-title">
            <lucide-icon [img]="Globe" [size]="20"></lucide-icon>
            <h2>{{ 'config.accountSection' | transloco }}</h2>
          </div>

          <div class="setting-row readonly">
            <div class="setting-info">
              <span class="setting-label">{{ 'config.timezone' | transloco }}</span>
              <span class="setting-desc">{{ 'config.timezoneDesc' | transloco }}</span>
            </div>
            <span class="setting-value">{{ timezone }}</span>
          </div>

          <div class="setting-row readonly">
            <div class="setting-info">
              <span class="setting-label">{{ 'config.language' | transloco }}</span>
              <span class="setting-desc">{{ 'config.languageDesc' | transloco }}</span>
            </div>
            <span class="setting-value">{{ 'config.languageValue' | transloco }}</span>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      .config-container {
        max-width: 800px;
        margin: 0 auto;
      }

      .save-alert {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        background: var(--app-color-success-soft);
        color: var(--app-color-success);
        border-radius: var(--app-radius-md);
        margin-bottom: 20px;
        font-size: 14px;
      }

      .sections-grid {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .section-card {
        padding: 24px;
        border: 1px solid var(--app-color-border);
        border-radius: var(--app-radius-lg);
        background: var(--app-color-surface);
        box-shadow: var(--app-shadow-sm);
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: 12px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--app-color-border);
      }

      .section-title h2 {
        font-size: 1rem;
        font-weight: 700;
        color: var(--app-color-text);
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0;
      }

      .setting-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 12px 0;
        border-bottom: 1px solid var(--app-color-border);
      }

      .setting-row:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }

      .setting-row.disabled {
        opacity: 0.5;
      }

      .setting-row.readonly .setting-value {
        font-size: 14px;
        font-weight: 600;
        color: var(--app-color-text);
        white-space: nowrap;
      }

      .setting-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
      }

      .setting-label {
        font-size: 14px;
        font-weight: 600;
        color: var(--app-color-text);
      }

      .setting-desc {
        font-size: 12px;
        color: var(--app-color-text-muted);
      }

      .interval-select {
        width: 160px;
        margin: 0;
      }

      @media (max-width: 600px) {
        .setting-row {
          flex-direction: column;
          align-items: flex-start;
        }

        .interval-select {
          width: 100%;
        }
      }
    `,
  ],
})
export class ConfigurationComponent {
  readonly Settings = Settings;
  readonly Bell = Bell;
  readonly Palette = Palette;
  readonly Globe = Globe;
  readonly CheckCircle2 = CheckCircle2;

  settings: AdminSettings = { ...DEFAULT_SETTINGS };
  pollingOptions: readonly AppSelectOption<number>[] = [
    { label: '30 segundos', value: 30000 },
    { label: '1 minuto', value: 60000 },
    { label: '5 minutos', value: 300000 },
  ];
  savedSuccess = signal(false);
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  constructor() {
    this.loadSettings();
  }

  private loadSettings(): void {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        this.settings = {
          ...DEFAULT_SETTINGS,
          ...(JSON.parse(stored) as Partial<typeof DEFAULT_SETTINGS>),
        };
      }
    } catch {
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  saveSettings(): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
      this.savedSuccess.set(true);
      setTimeout(() => this.savedSuccess.set(false), 2000);
    } catch {
      this.savedSuccess.set(false);
    }
  }
}
