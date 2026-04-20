import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { LucideAngularModule, Settings, Bell, Palette, Globe, CheckCircle2 } from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';

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
  selector: 'app-configuracion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatDividerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    LucideAngularModule,
    TranslocoModule,
  ],
  providers: [provideTranslocoScope({ scope: 'configuracion', alias: 'config' })],
  template: `
    <div class="config-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <lucide-icon [img]="Settings" [size]="32"></lucide-icon>
          <div>
            <h1>{{ 'config.title' | transloco }}</h1>
            <p>{{ 'config.subtitle' | transloco }}</p>
          </div>
        </div>
      </div>

      @if (savedSuccess()) {
        <div class="save-alert">
          <lucide-icon [img]="CheckCircle2" [size]="18"></lucide-icon>
          <span>{{ 'config.saved' | transloco }}</span>
        </div>
      }

      <div class="sections-grid">
        <!-- Notificaciones -->
        <mat-card class="section-card">
          <div class="section-title">
            <lucide-icon [img]="Bell" [size]="20"></lucide-icon>
            <h2>{{ 'config.notificationsSection' | transloco }}</h2>
          </div>
          <mat-divider></mat-divider>

          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">{{ 'config.enableNotif' | transloco }}</span>
              <span class="setting-desc">{{ 'config.enableNotifDesc' | transloco }}</span>
            </div>
            <mat-slide-toggle
              [(ngModel)]="settings.notifications_enabled"
              (change)="saveSettings()"
            >
            </mat-slide-toggle>
          </div>

          <div class="setting-row" [class.disabled]="!settings.notifications_enabled">
            <div class="setting-info">
              <span class="setting-label">{{ 'config.updateInterval' | transloco }}</span>
              <span class="setting-desc">{{ 'config.updateIntervalDesc' | transloco }}</span>
            </div>
            <mat-form-field appearance="outline" class="interval-select">
              <mat-select
                [(ngModel)]="settings.polling_interval"
                [disabled]="!settings.notifications_enabled"
                (selectionChange)="saveSettings()"
              >
                <mat-option [value]="30000">{{ 'config.sec30' | transloco }}</mat-option>
                <mat-option [value]="60000">{{ 'config.min1' | transloco }}</mat-option>
                <mat-option [value]="300000">{{ 'config.min5' | transloco }}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </mat-card>

        <!-- Apariencia -->
        <mat-card class="section-card">
          <div class="section-title">
            <lucide-icon [img]="Palette" [size]="20"></lucide-icon>
            <h2>{{ 'config.appearanceSection' | transloco }}</h2>
          </div>
          <mat-divider></mat-divider>

          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">{{ 'config.compactMode' | transloco }}</span>
              <span class="setting-desc">{{ 'config.compactModeDesc' | transloco }}</span>
            </div>
            <mat-slide-toggle [(ngModel)]="settings.compact_mode" (change)="saveSettings()">
            </mat-slide-toggle>
          </div>
        </mat-card>

        <!-- Cuenta -->
        <mat-card class="section-card">
          <div class="section-title">
            <lucide-icon [img]="Globe" [size]="20"></lucide-icon>
            <h2>{{ 'config.accountSection' | transloco }}</h2>
          </div>
          <mat-divider></mat-divider>

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
        </mat-card>
      </div>
    </div>
  `,
  styles: [
    `
      .config-container {
        max-width: 800px;
        margin: 0 auto;
      }

      .page-header {
        margin-bottom: 24px;
      }

      .header-content {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .header-content h1 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0 0 4px;
      }

      .header-content p {
        color: #64748b;
        margin: 0;
        font-size: 14px;
      }

      .save-alert {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        background: #d1fae5;
        color: #047857;
        border-radius: 8px;
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
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }

      .section-title h2 {
        font-size: 1rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      mat-divider {
        margin-bottom: 16px;
      }

      .setting-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 12px 0;
        border-bottom: 1px solid #f1f5f9;
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
        color: #475569;
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
        color: #1e293b;
      }

      .setting-desc {
        font-size: 12px;
        color: #94a3b8;
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
export class ConfiguracionComponent implements OnInit {
  readonly Settings = Settings;
  readonly Bell = Bell;
  readonly Palette = Palette;
  readonly Globe = Globe;
  readonly CheckCircle2 = CheckCircle2;

  settings: AdminSettings = { ...DEFAULT_SETTINGS };
  savedSuccess = signal(false);
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  ngOnInit(): void {
    this.loadSettings();
  }

  private loadSettings(): void {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
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
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  }
}
