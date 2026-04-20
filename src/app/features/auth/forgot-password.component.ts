import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  LucideAngularModule,
  Building2,
  Mail,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-angular';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { LanguageService } from '../../core/services/language.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    LucideAngularModule,
    TranslocoModule,
  ],
  template: `
    <div class="forgot-page">
      <div class="forgot-container">
        <div class="lang-toggle-row">
          <div class="lang-toggle" role="group" aria-label="Language / Idioma">
            <button
              class="lang-btn"
              [class.active]="languageService.isSpanish()"
              (click)="languageService.setLanguage('es')"
              aria-label="Español"
              title="Español"
            >
              ES
            </button>
            <button
              class="lang-btn"
              [class.active]="languageService.isEnglish()"
              (click)="languageService.setLanguage('en')"
              aria-label="English"
              title="English"
            >
              EN
            </button>
          </div>
        </div>
        <div class="forgot-header">
          <div class="brand-logo">
            <lucide-icon [img]="Building2" [size]="48"></lucide-icon>
          </div>
          <h1>{{ 'auth.forgotPasswordTitle' | transloco }}</h1>
          <p>{{ 'auth.forgotPasswordDesc' | transloco }}</p>
        </div>

        @if (successMessage()) {
          <div class="success-alert">
            <lucide-icon [img]="CheckCircle2" [size]="20"></lucide-icon>
            <div class="alert-content">
              <strong>{{ 'auth.emailSent' | transloco }}</strong>
              <span>{{ successMessage() }}</span>
            </div>
          </div>
        }

        @if (errorMessage()) {
          <div class="error-alert">
            <lucide-icon [img]="AlertCircle" [size]="18"></lucide-icon>
            <div class="alert-content">
              <strong>{{ 'common.error' | transloco }}</strong>
              <span>{{ errorMessage() }}</span>
            </div>
          </div>
        }

        @if (!successMessage()) {
          <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()" class="forgot-form">
            <div class="form-group">
              <label class="form-label">{{ 'auth.email' | transloco }}</label>
              <mat-form-field appearance="outline" class="custom-field">
                <input
                  matInput
                  type="email"
                  formControlName="email"
                  placeholder="correo@ejemplo.com"
                  autocomplete="email"
                />
                @if (
                  forgotForm.get('email')?.hasError('required') && forgotForm.get('email')?.touched
                ) {
                  <mat-error>{{ 'auth.required' | transloco }}</mat-error>
                }
                @if (forgotForm.get('email')?.hasError('email')) {
                  <mat-error>{{ 'auth.emailInvalid' | transloco }}</mat-error>
                }
              </mat-form-field>
            </div>

            <button
              mat-raised-button
              color="primary"
              type="submit"
              class="submit-btn"
              [disabled]="forgotForm.invalid || isLoading()"
            >
              @if (isLoading()) {
                <mat-spinner diameter="20" color="accent"></mat-spinner>
                <span>{{ 'auth.sending' | transloco }}</span>
              } @else {
                <span>{{ 'auth.sendInstructions' | transloco }}</span>
              }
            </button>
          </form>
        }

        <div class="forgot-footer">
          <a routerLink="/login" class="back-link">
            <lucide-icon [img]="ArrowLeft" [size]="16"></lucide-icon>
            {{ 'auth.backToLogin' | transloco }}
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      }

      .forgot-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
      }

      .forgot-container {
        width: 100%;
        max-width: 480px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        padding: 48px;
      }

      .lang-toggle-row {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 16px;
      }
      .lang-toggle {
        display: flex;
        gap: 2px;
        background: #f1f5f9;
        border-radius: 8px;
        padding: 3px;
      }
      .lang-btn {
        background: none;
        border: none;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 700;
        color: #64748b;
        cursor: pointer;
        transition: all 0.2s;
      }
      .lang-btn:hover {
        color: #0f172a;
      }
      .lang-btn.active {
        background: white;
        color: #2563eb;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
      }
      .forgot-header {
        text-align: center;
        margin-bottom: 32px;
      }

      .brand-logo {
        width: 80px;
        height: 80px;
        margin: 0 auto 24px;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      }

      .forgot-header h1 {
        font-size: 1.75rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0 0 12px;
      }

      .forgot-header p {
        font-size: 1rem;
        color: #64748b;
        margin: 0;
        line-height: 1.5;
      }

      .success-alert {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 16px;
        background: #f0fdf4;
        border-left: 4px solid #22c55e;
        border-radius: 8px;
        margin-bottom: 24px;
      }

      .success-alert lucide-icon {
        color: #22c55e;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .error-alert {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 16px;
        background: #fef2f2;
        border-left: 4px solid #ef4444;
        border-radius: 8px;
        margin-bottom: 24px;
      }

      .error-alert lucide-icon {
        color: #ef4444;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .alert-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .alert-content strong {
        font-size: 0.875rem;
        font-weight: 600;
      }

      .alert-content span {
        font-size: 0.875rem;
      }

      .forgot-form {
        margin-bottom: 24px;
      }

      .form-group {
        margin-bottom: 24px;
      }

      .form-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        color: #334155;
        margin-bottom: 8px;
      }

      .custom-field {
        width: 100%;
      }

      .submit-btn {
        width: 100%;
        height: 52px;
        font-size: 1rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
      }

      .forgot-footer {
        text-align: center;
        padding-top: 24px;
        border-top: 1px solid #e2e8f0;
      }

      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #64748b;
        text-decoration: none;
        font-size: 0.875rem;
        font-weight: 500;
      }

      .back-link:hover {
        color: #3b82f6;
      }

      @media (max-width: 640px) {
        .forgot-container {
          padding: 32px 24px;
        }

        .forgot-header h1 {
          font-size: 1.5rem;
        }
      }
    `,
  ],
})
export class ForgotPasswordComponent {
  readonly Building2 = Building2;
  readonly Mail = Mail;
  readonly AlertCircle = AlertCircle;
  readonly CheckCircle2 = CheckCircle2;
  readonly ArrowLeft = ArrowLeft;

  readonly languageService = inject(LanguageService);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private transloco = inject(TranslocoService);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  forgotForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  onSubmit(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const email = this.forgotForm.value.email!;

    // TODO: Replace with actual API endpoint when available
    // this.http.post(`${environment.apiUrl}auth/forgot-password`, { email })

    // Simulated API call
    setTimeout(() => {
      this.isLoading.set(false);
      this.successMessage.set(this.transloco.translate('auth.forgotPasswordSentMsg', { email }));
    }, 1500);
  }
}
