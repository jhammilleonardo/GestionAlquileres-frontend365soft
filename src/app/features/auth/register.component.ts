import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import {
  LucideAngularModule,
  Building2,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Globe,
} from 'lucide-angular';
import { catchError, tap } from 'rxjs';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { LanguageService } from '../../core/services/language.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
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
    MatIconModule,
    MatCheckboxModule,
    MatStepperModule,
    MatDialogModule,
    MatSelectModule,
    LucideAngularModule,
    TranslocoModule,
  ],
  template: `
    <div class="register-page">
      <!-- Left Side - Branding -->
      <div class="register-brand">
        <div class="brand-content">
          <div class="brand-logo">
            <lucide-icon [img]="Building2" [size]="56"></lucide-icon>
          </div>
          <h1>365Soft</h1>
          <h2>{{ 'auth.adminPanel' | transloco }}</h2>
          <p class="brand-tagline">
            {{ 'auth.registerTagline' | transloco }}
          </p>

          <div class="features">
            <div class="feature-item">
              <lucide-icon [img]="CheckCircle2" [size]="20"></lucide-icon>
              <span>{{ 'auth.regFeature1' | transloco }}</span>
            </div>
            <div class="feature-item">
              <lucide-icon [img]="CheckCircle2" [size]="20"></lucide-icon>
              <span>{{ 'auth.regFeature2' | transloco }}</span>
            </div>
            <div class="feature-item">
              <lucide-icon [img]="CheckCircle2" [size]="20"></lucide-icon>
              <span>{{ 'auth.regFeature3' | transloco }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side - Registration Form -->
      <div class="register-form-container">
        <div class="register-form-wrapper">
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
          <div class="form-header">
            <h3>{{ 'auth.registerTitle' | transloco }}</h3>
            <p>{{ 'auth.registerSubtitle' | transloco }}</p>
          </div>

          @if (successMessage()) {
            <div class="success-alert">
              <lucide-icon [img]="CheckCircle2" [size]="20"></lucide-icon>
              <div class="alert-content">
                <strong>{{ 'auth.accountCreated' | transloco }}</strong>
                <span>{{ successMessage() }}</span>
              </div>
            </div>
          }

          @if (errorMessage()) {
            <div class="error-alert">
              <lucide-icon [img]="AlertCircle" [size]="18"></lucide-icon>
              <div class="alert-content">
                <strong>{{ 'auth.accountError' | transloco }}</strong>
                <span>{{ errorMessage() }}</span>
              </div>
            </div>
          }

          <mat-stepper [linear]="true" #stepper>
            <!-- Step 1: Company Info -->
            <mat-step [stepControl]="companyForm">
              <form [formGroup]="companyForm" class="step-form">
                <ng-template matStepLabel>{{ 'auth.companyStep' | transloco }}</ng-template>

                <h3 class="step-title">{{ 'auth.companyStepTitle' | transloco }}</h3>

                <mat-form-field appearance="outline" class="custom-field">
                  <mat-label>{{ 'auth.companyName' | transloco }}</mat-label>
                  <lucide-icon matIconPrefix [img]="Building2" [size]="20"></lucide-icon>
                  <input
                    matInput
                    formControlName="company_name"
                    [placeholder]="'auth.companyNamePlaceholder' | transloco"
                    autocomplete="organization"
                  />
                  <mat-hint>{{ 'auth.companyNameHint' | transloco }}</mat-hint>
                  @if (
                    companyForm.get('company_name')?.hasError('required') &&
                    companyForm.get('company_name')?.touched
                  ) {
                    <mat-error>{{ 'auth.required' | transloco }}</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="custom-field">
                  <mat-label>{{ 'auth.country' | transloco }}</mat-label>
                  <lucide-icon matIconPrefix [img]="Globe" [size]="20"></lucide-icon>
                  <mat-select formControlName="country">
                    @for (c of countries(); track c.value) {
                      <mat-option [value]="c.value">{{ c.label }}</mat-option>
                    }
                  </mat-select>
                  <mat-hint>{{ 'auth.countryHint' | transloco }}</mat-hint>
                  @if (
                    companyForm.get('country')?.hasError('required') &&
                    companyForm.get('country')?.touched
                  ) {
                    <mat-error>{{ 'auth.required' | transloco }}</mat-error>
                  }
                </mat-form-field>

                <div class="step-actions">
                  <button
                    mat-raised-button
                    color="primary"
                    matStepperNext
                    [disabled]="companyForm.invalid"
                    class="next-btn"
                  >
                    {{ 'auth.next' | transloco }}
                    <lucide-icon [img]="ArrowRight" [size]="18"></lucide-icon>
                  </button>
                </div>
              </form>
            </mat-step>

            <!-- Step 2: Admin Info -->
            <mat-step [stepControl]="adminForm">
              <form [formGroup]="adminForm" class="step-form">
                <ng-template matStepLabel>{{ 'auth.adminStep' | transloco }}</ng-template>

                <h3 class="step-title">{{ 'auth.adminStepTitle' | transloco }}</h3>

                <mat-form-field appearance="outline" class="custom-field">
                  <mat-label>{{ 'auth.fullName' | transloco }}</mat-label>
                  <lucide-icon matIconPrefix [img]="User" [size]="20"></lucide-icon>
                  <input
                    matInput
                    formControlName="name"
                    [placeholder]="'auth.fullNamePlaceholder' | transloco"
                    autocomplete="name"
                  />
                  @if (
                    adminForm.get('name')?.hasError('required') && adminForm.get('name')?.touched
                  ) {
                    <mat-error>{{ 'auth.required' | transloco }}</mat-error>
                  }
                  @if (adminForm.get('name')?.hasError('minlength')) {
                    <mat-error>{{ 'auth.minChars2' | transloco }}</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="custom-field">
                  <mat-label>{{ 'auth.email' | transloco }}</mat-label>
                  <lucide-icon matIconPrefix [img]="Mail" [size]="20"></lucide-icon>
                  <input
                    matInput
                    type="email"
                    formControlName="email"
                    placeholder="admin@empresa.com"
                    autocomplete="email"
                  />
                  @if (
                    adminForm.get('email')?.hasError('required') && adminForm.get('email')?.touched
                  ) {
                    <mat-error>{{ 'auth.required' | transloco }}</mat-error>
                  }
                  @if (adminForm.get('email')?.hasError('email')) {
                    <mat-error>{{ 'auth.emailInvalid' | transloco }}</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="custom-field">
                  <mat-label>{{ 'auth.phoneOptional' | transloco }}</mat-label>
                  <lucide-icon matIconPrefix [img]="User" [size]="20"></lucide-icon>
                  <input
                    matInput
                    type="tel"
                    formControlName="phone"
                    [placeholder]="'auth.phonePlaceholder' | transloco"
                    autocomplete="tel"
                  />
                </mat-form-field>

                <div class="step-actions">
                  <button mat-button matStepperPrevious class="back-btn">
                    <lucide-icon [img]="ArrowLeft" [size]="18"></lucide-icon>
                    {{ 'auth.back' | transloco }}
                  </button>
                  <button
                    mat-raised-button
                    color="primary"
                    matStepperNext
                    [disabled]="adminForm.invalid"
                    class="next-btn"
                  >
                    {{ 'auth.next' | transloco }}
                    <lucide-icon [img]="ArrowRight" [size]="18"></lucide-icon>
                  </button>
                </div>
              </form>
            </mat-step>

            <!-- Step 3: Password -->
            <mat-step [stepControl]="passwordForm">
              <form [formGroup]="passwordForm" (ngSubmit)="onSubmit()" class="step-form">
                <ng-template matStepLabel>{{ 'auth.passwordStep' | transloco }}</ng-template>

                <h3 class="step-title">{{ 'auth.passwordStepTitle' | transloco }}</h3>

                <mat-form-field appearance="outline" class="custom-field">
                  <mat-label>{{ 'auth.password' | transloco }}</mat-label>
                  <lucide-icon matIconPrefix [img]="Lock" [size]="20"></lucide-icon>
                  <input
                    matInput
                    [type]="showPassword() ? 'text' : 'password'"
                    formControlName="password"
                    placeholder="••••••••"
                    autocomplete="new-password"
                  />
                  <button
                    mat-icon-button
                    matSuffix
                    type="button"
                    (click)="togglePassword()"
                    tabindex="-1"
                  >
                    <lucide-icon [img]="showPassword() ? EyeOff : Eye" [size]="18"></lucide-icon>
                  </button>
                  <mat-hint>{{ 'auth.passwordHint' | transloco }}</mat-hint>
                  @if (
                    passwordForm.get('password')?.hasError('required') &&
                    passwordForm.get('password')?.touched
                  ) {
                    <mat-error>{{ 'auth.required' | transloco }}</mat-error>
                  }
                  @if (passwordForm.get('password')?.hasError('minlength')) {
                    <mat-error>{{ 'auth.minChars6' | transloco }}</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="custom-field">
                  <mat-label>{{ 'auth.confirmPassword' | transloco }}</mat-label>
                  <lucide-icon matIconPrefix [img]="Lock" [size]="20"></lucide-icon>
                  <input
                    matInput
                    [type]="showConfirmPassword() ? 'text' : 'password'"
                    formControlName="confirm_password"
                    placeholder="••••••••"
                    autocomplete="new-password"
                  />
                  <button
                    mat-icon-button
                    matSuffix
                    type="button"
                    (click)="toggleConfirmPassword()"
                    tabindex="-1"
                  >
                    <lucide-icon
                      [img]="showConfirmPassword() ? EyeOff : Eye"
                      [size]="18"
                    ></lucide-icon>
                  </button>
                  @if (
                    passwordForm.get('confirm_password')?.hasError('required') &&
                    passwordForm.get('confirm_password')?.touched
                  ) {
                    <mat-error>{{ 'auth.required' | transloco }}</mat-error>
                  }
                  @if (
                    passwordForm.hasError('passwordMismatch') &&
                    passwordForm.get('confirm_password')?.touched
                  ) {
                    <mat-error>{{ 'auth.passwordMismatch' | transloco }}</mat-error>
                  }
                </mat-form-field>

                <div class="terms-checkbox">
                  <mat-checkbox formControlName="acceptTerms" color="primary">
                    {{ 'auth.acceptTerms' | transloco }}
                    <a (click)="openTerms($event)" class="link">{{
                      'auth.termsLink' | transloco
                    }}</a>
                    {{ 'auth.andThe' | transloco }}
                    <a (click)="openPrivacy($event)" class="link">{{
                      'auth.privacyLink' | transloco
                    }}</a>
                  </mat-checkbox>
                </div>

                <div class="step-actions">
                  <button mat-button matStepperPrevious class="back-btn" type="button">
                    <lucide-icon [img]="ArrowLeft" [size]="18"></lucide-icon>
                    {{ 'auth.back' | transloco }}
                  </button>
                  <button
                    mat-raised-button
                    color="primary"
                    type="submit"
                    class="submit-btn"
                    [disabled]="passwordForm.invalid || isLoading()"
                  >
                    @if (isLoading()) {
                      <mat-spinner diameter="20" color="accent"></mat-spinner>
                      <span>{{ 'auth.creating' | transloco }}</span>
                    } @else {
                      <span>{{ 'auth.createAccount' | transloco }}</span>
                    }
                  </button>
                </div>
              </form>
            </mat-step>
          </mat-stepper>

          <div class="register-footer">
            <div class="help-links">
              <a routerLink="/login" class="help-link">{{
                'auth.alreadyHaveAccount' | transloco
              }}</a>
              <span class="separator">•</span>
              <a (click)="goToTenantPortal()" class="help-link tenant-portal-link">{{
                'auth.tenantPortal' | transloco
              }}</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100vh;
      }

      .register-page {
        display: grid;
        grid-template-columns: 1fr 1fr;
        height: 100vh;
        overflow: hidden;
      }

      /* Left Side - Branding */
      .register-brand {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 60px;
        position: relative;
        overflow: hidden;
      }

      .register-brand::before {
        content: '';
        position: absolute;
        width: 500px;
        height: 500px;
        background: rgba(59, 130, 246, 0.1);
        border-radius: 50%;
        top: -200px;
        left: -200px;
      }

      .register-brand::after {
        content: '';
        position: absolute;
        width: 400px;
        height: 400px;
        background: rgba(59, 130, 246, 0.08);
        border-radius: 50%;
        bottom: -150px;
        right: -150px;
      }

      .brand-content {
        position: relative;
        z-index: 1;
        color: white;
        max-width: 480px;
      }

      .brand-logo {
        width: 80px;
        height: 80px;
        background: rgba(59, 130, 246, 0.2);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 32px;
        border: 2px solid rgba(59, 130, 246, 0.3);
      }

      .brand-content h1 {
        font-size: 2.5rem;
        font-weight: 700;
        margin: 0 0 8px;
        letter-spacing: -0.5px;
      }

      .brand-content h2 {
        font-size: 1.5rem;
        font-weight: 400;
        margin: 0 0 24px;
        opacity: 0.95;
        color: #93c5fd;
      }

      .brand-tagline {
        font-size: 1.05rem;
        line-height: 1.6;
        opacity: 0.9;
        margin: 0 0 48px;
      }

      .features {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .feature-item {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 1rem;
        opacity: 0.95;
      }

      .feature-item lucide-icon {
        flex-shrink: 0;
        color: #60a5fa;
      }

      /* Right Side - Form */
      .register-form-container {
        background: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 60px;
        overflow-y: auto;
      }

      .register-form-wrapper {
        width: 100%;
        max-width: 520px;
      }

      .lang-toggle-row {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 24px;
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
      .form-header {
        margin-bottom: 32px;
      }

      .form-header h3 {
        font-size: 1.875rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0 0 8px;
        letter-spacing: -0.5px;
      }

      .form-header p {
        font-size: 1rem;
        color: #64748b;
        margin: 0;
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

      .step-form {
        padding: 24px 0;
      }

      .step-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #0f172a;
        margin: 0 0 24px;
      }

      .custom-field {
        width: 100%;
        margin-bottom: 16px;
      }

      .step-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 32px;
        gap: 12px;
      }

      .back-btn {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .next-btn,
      .submit-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 24px;
        height: 48px;
      }

      .submit-btn {
        margin-left: auto;
      }

      .terms-checkbox {
        margin-bottom: 20px;
      }

      .terms-checkbox ::ng-deep .mat-mdc-checkbox-label {
        font-size: 0.875rem;
        line-height: 1.5;
      }

      .link {
        color: #3b82f6;
        text-decoration: none;
        cursor: pointer;
        font-weight: 500;
      }

      .link:hover {
        text-decoration: underline;
      }

      .register-footer {
        margin-top: 32px;
        padding-top: 24px;
        border-top: 1px solid #e2e8f0;
        display: flex;
        justify-content: center;
      }

      .help-links {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 0.875rem;
      }

      .help-links a {
        color: #64748b;
        text-decoration: none;
        cursor: pointer;
        position: relative;
        z-index: 10;
      }

      .help-links a:hover {
        color: #3b82f6;
        text-decoration: underline;
      }

      .tenant-portal-link {
        pointer-events: auto;
      }

      .separator {
        color: #cbd5e1;
      }

      ::ng-deep .mat-stepper-horizontal {
        background: transparent;
      }

      ::ng-deep .mat-step-header {
        padding: 8px 12px;
        background: transparent !important;
      }

      ::ng-deep .mat-step-header:hover {
        background: transparent !important;
      }

      ::ng-deep .mat-step-icon {
        height: 28px !important;
        width: 28px !important;
        border-radius: 50% !important;
      }

      ::ng-deep .mat-step-icon .mat-icon {
        display: none !important;
      }

      ::ng-deep .mat-step-icon-content {
        font-size: 14px !important;
      }

      ::ng-deep .mat-step-label {
        font-size: 0.8125rem;
      }

      ::ng-deep .mat-step-text-label {
        display: none !important;
      }

      ::ng-deep .mat-ripple {
        display: none !important;
      }

      /* Responsive Design */
      @media (max-width: 1024px) {
        .register-page {
          grid-template-columns: 1fr;
        }

        .register-brand {
          display: none;
        }

        .register-form-container {
          padding: 40px 24px;
        }
      }

      @media (max-width: 640px) {
        .register-form-container {
          padding: 32px 20px;
        }

        .form-header h3 {
          font-size: 1.5rem;
        }

        .form-header p {
          font-size: 0.9375rem;
        }

        .register-form-wrapper {
          max-width: 100%;
        }

        .step-actions {
          flex-direction: column-reverse;
          gap: 8px;
        }

        .step-actions button {
          width: 100%;
        }

        .submit-btn {
          margin-left: 0;
        }

        ::ng-deep .mat-step-header {
          padding: 8px 4px;
        }

        ::ng-deep .mat-step-label {
          font-size: 0.75rem;
        }
      }

      @media (max-width: 480px) {
        .register-form-container {
          padding: 24px 16px;
        }

        .form-header {
          margin-bottom: 24px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .step-form {
          padding: 16px 0;
        }

        .step-title {
          font-size: 1.125rem;
          margin-bottom: 20px;
        }
      }
    `,
  ],
})
export class RegisterComponent {
  readonly Building2 = Building2;
  readonly User = User;
  readonly Mail = Mail;
  readonly Lock = Lock;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly AlertCircle = AlertCircle;
  readonly CheckCircle2 = CheckCircle2;
  readonly ArrowRight = ArrowRight;
  readonly ArrowLeft = ArrowLeft;
  readonly Globe = Globe;

  readonly languageService = inject(LanguageService);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private transloco = inject(TranslocoService);

  showPassword = signal(false);
  showConfirmPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  private static readonly COUNTRY_LABELS: Record<string, Record<string, string>> = {
    es: {
      BO: 'Bolivia (BOB)',
      US: 'Estados Unidos (USD)',
      GT: 'Guatemala (GTQ)',
      HN: 'Honduras (HNL)',
    },
    en: {
      BO: 'Bolivia (BOB)',
      US: 'United States (USD)',
      GT: 'Guatemala (GTQ)',
      HN: 'Honduras (HNL)',
    },
  };

  readonly countries = computed(() => {
    const labels =
      RegisterComponent.COUNTRY_LABELS[this.languageService.currentLang()] ??
      RegisterComponent.COUNTRY_LABELS['es'];
    return ['BO', 'US', 'GT', 'HN'].map((code) => ({ value: code, label: labels[code] }));
  });

  companyForm = this.fb.group({
    company_name: ['', Validators.required],
    country: ['BO', Validators.required],
  });

  adminForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
  });

  private passwordMatchValidator = (form: AbstractControl): ValidationErrors | null => {
    const password = form.get('password')?.value as string | null;
    const confirmPassword = form.get('confirm_password')?.value as string | null;
    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  };

  passwordForm = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', Validators.required],
      acceptTerms: [false, Validators.requiredTrue],
    },
    {
      validators: this.passwordMatchValidator,
    },
  );

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  openTerms(event: Event): void {
    event.preventDefault();
    this.dialog.open(TermsDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
    });
  }

  openPrivacy(event: Event): void {
    event.preventDefault();
    this.dialog.open(PrivacyDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
    });
  }

  goToTenantPortal(): void {
    // Clear tenant session before navigating to login
    localStorage.removeItem('tenant_access_token');
    localStorage.removeItem('tenant_user');
    localStorage.removeItem('tenant_slug');
    // TODO: Navegar con slug cuando se tenga
    this.router.navigate(['/portal/login']);
  }

  onSubmit(): void {
    if (this.companyForm.invalid || this.adminForm.invalid || this.passwordForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.authService
      .registerAdmin({
        company_name: this.companyForm.value.company_name!,
        country: this.companyForm.value.country!,
        name: this.adminForm.value.name!,
        email: this.adminForm.value.email!,
        password: this.passwordForm.value.password!,
        phone: this.adminForm.value.phone || undefined,
      })
      .pipe(
        tap((response) => {
          this.isLoading.set(false);
          this.successMessage.set(this.transloco.translate('auth.accountCreatedMsg'));
          const slug = response.tenant.slug;
          setTimeout(() => {
            this.router.navigate(['/', slug, 'configuracion', 'inicio']);
          }, 1500);
        }),
        catchError((error) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            error.error?.message || this.transloco.translate('auth.createAccountError'),
          );
          throw error;
        }),
      )
      .subscribe();
  }
}

// Términos y Condiciones Dialog Component
@Component({
  selector: 'app-terms-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, TranslocoModule],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>{{ 'auth.termsTitle' | transloco }}</h2>
      <mat-dialog-content>
        <div class="terms-content">
          <p class="last-updated">Última actualización: Febrero 8, 2026</p>

          <h3>1. Aceptación de los Términos</h3>
          <p>
            Al acceder y utilizar 365Soft (el "Servicio"), usted acepta estar sujeto a estos
            Términos y Condiciones de uso. Si no está de acuerdo con estos términos, no debe
            utilizar el Servicio.
          </p>

          <h3>2. Descripción del Servicio</h3>
          <p>
            365Soft es una plataforma de gestión de propiedades que permite a los administradores
            gestionar propiedades, inquilinos, contratos, pagos y mantenimiento de manera eficiente.
          </p>

          <h3>3. Registro de Cuenta</h3>
          <p>
            Para utilizar el Servicio, debe crear una cuenta proporcionando información precisa y
            completa. Usted es responsable de mantener la confidencialidad de su cuenta y
            contraseña.
          </p>

          <h3>4. Uso Aceptable</h3>
          <p>Usted se compromete a:</p>
          <ul>
            <li>Utilizar el Servicio únicamente para fines legales</li>
            <li>No compartir su cuenta con terceros no autorizados</li>
            <li>Mantener la información de su cuenta actualizada</li>
            <li>No intentar acceder a áreas no autorizadas del sistema</li>
            <li>No utilizar el Servicio para actividades fraudulentas o ilegales</li>
          </ul>

          <h3>5. Propiedad Intelectual</h3>
          <p>
            Todo el contenido, características y funcionalidad del Servicio son propiedad exclusiva
            de 365Soft y están protegidos por las leyes de propiedad intelectual.
          </p>

          <h3>6. Privacidad y Seguridad de Datos</h3>
          <p>
            Nos comprometemos a proteger su información personal de acuerdo con nuestra Política de
            Privacidad. Implementamos medidas de seguridad técnicas y organizativas para proteger
            sus datos.
          </p>

          <h3>7. Limitación de Responsabilidad</h3>
          <p>
            365Soft no será responsable por daños indirectos, incidentales, especiales o
            consecuentes que resulten del uso o la imposibilidad de usar el Servicio.
          </p>

          <h3>8. Modificaciones del Servicio</h3>
          <p>
            Nos reservamos el derecho de modificar o discontinuar el Servicio en cualquier momento,
            con o sin previo aviso.
          </p>

          <h3>9. Terminación</h3>
          <p>
            Podemos suspender o terminar su acceso al Servicio si viola estos términos o por
            cualquier otra razón a nuestra discreción.
          </p>

          <h3>10. Ley Aplicable</h3>
          <p>Estos términos se rigen por las leyes aplicables en su jurisdicción.</p>

          <h3>11. Contacto</h3>
          <p>Para preguntas sobre estos términos, contacte a: soporte@365soft.com</p>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-raised-button color="primary" mat-dialog-close>
          {{ 'auth.close' | transloco }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .dialog-container {
        max-width: 800px;
      }

      h2 {
        color: #0f172a;
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0;
      }

      mat-dialog-content {
        padding: 24px;
        max-height: 70vh;
        overflow-y: auto;
      }

      .terms-content {
        color: #334155;
        line-height: 1.6;
      }

      .last-updated {
        color: #64748b;
        font-size: 0.875rem;
        font-style: italic;
        margin-bottom: 24px;
      }

      h3 {
        color: #1e293b;
        font-size: 1.125rem;
        font-weight: 600;
        margin: 24px 0 12px;
      }

      p {
        margin: 12px 0;
      }

      ul {
        margin: 12px 0;
        padding-left: 24px;
      }

      li {
        margin: 8px 0;
      }

      mat-dialog-actions {
        padding: 16px 24px;
        border-top: 1px solid #e2e8f0;
      }
    `,
  ],
})
export class TermsDialogComponent {}

// Política de Privacidad Dialog Component
@Component({
  selector: 'app-privacy-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, TranslocoModule],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>{{ 'auth.privacyTitle' | transloco }}</h2>
      <mat-dialog-content>
        <div class="privacy-content">
          <p class="last-updated">Última actualización: Febrero 8, 2026</p>

          <h3>1. Introducción</h3>
          <p>
            En 365Soft, nos tomamos muy en serio la privacidad de nuestros usuarios. Esta Política
            de Privacidad describe cómo recopilamos, usamos, compartimos y protegemos su información
            personal.
          </p>

          <h3>2. Información que Recopilamos</h3>
          <p>Recopilamos la siguiente información:</p>
          <ul>
            <li>
              <strong>Información de cuenta:</strong> nombre, correo electrónico, teléfono, nombre
              de empresa
            </li>
            <li>
              <strong>Información de propiedades:</strong> direcciones, datos de propiedades y
              contratos
            </li>
            <li>
              <strong>Información de inquilinos:</strong> datos de contacto y documentación
              necesaria
            </li>
            <li>
              <strong>Información de pago:</strong> historial de transacciones y métodos de pago
            </li>
            <li><strong>Datos de uso:</strong> cómo interactúa con nuestro Servicio</li>
            <li>
              <strong>Información técnica:</strong> dirección IP, tipo de navegador, sistema
              operativo
            </li>
          </ul>

          <h3>3. Cómo Usamos su Información</h3>
          <p>Utilizamos su información para:</p>
          <ul>
            <li>Proporcionar y mantener el Servicio</li>
            <li>Procesar transacciones y enviar notificaciones relacionadas</li>
            <li>Mejorar y personalizar su experiencia</li>
            <li>Comunicarnos con usted sobre actualizaciones y novedades</li>
            <li>Detectar y prevenir fraudes o abuso del Servicio</li>
            <li>Cumplir con obligaciones legales</li>
          </ul>

          <h3>4. Compartir Información</h3>
          <p>No vendemos su información personal. Podemos compartir su información con:</p>
          <ul>
            <li><strong>Proveedores de servicios:</strong> que nos ayudan a operar el Servicio</li>
            <li><strong>Autoridades legales:</strong> cuando sea requerido por ley</li>
            <li><strong>Socios comerciales:</strong> con su consentimiento explícito</li>
          </ul>

          <h3>5. Seguridad de Datos</h3>
          <p>
            Implementamos medidas de seguridad técnicas y organizativas para proteger su
            información:
          </p>
          <ul>
            <li>Encriptación SSL/TLS para transmisión de datos</li>
            <li>Almacenamiento seguro en servidores protegidos</li>
            <li>Control de acceso basado en roles</li>
            <li>Auditorías de seguridad regulares</li>
            <li>Copias de seguridad automáticas</li>
          </ul>

          <h3>6. Retención de Datos</h3>
          <p>
            Conservamos su información personal mientras su cuenta esté activa o según sea necesario
            para cumplir con obligaciones legales.
          </p>

          <h3>7. Sus Derechos</h3>
          <p>Usted tiene derecho a:</p>
          <ul>
            <li>Acceder a su información personal</li>
            <li>Corregir información inexacta</li>
            <li>Solicitar la eliminación de sus datos</li>
            <li>Oponerse al procesamiento de sus datos</li>
            <li>Solicitar la portabilidad de sus datos</li>
            <li>Retirar el consentimiento en cualquier momento</li>
          </ul>

          <h3>8. Cookies y Tecnologías Similares</h3>
          <p>
            Utilizamos cookies y tecnologías similares para mejorar su experiencia, analizar el uso
            del Servicio y personalizar el contenido.
          </p>

          <h3>9. Privacidad de Menores</h3>
          <p>
            Nuestro Servicio no está dirigido a menores de 18 años. No recopilamos intencionalmente
            información de menores.
          </p>

          <h3>10. Transferencias Internacionales</h3>
          <p>
            Su información puede ser transferida y procesada en países distintos al suyo. Tomamos
            medidas para garantizar que su información reciba protección adecuada.
          </p>

          <h3>11. Cambios a esta Política</h3>
          <p>
            Podemos actualizar esta Política de Privacidad ocasionalmente. Le notificaremos sobre
            cambios significativos publicando la nueva política en esta página.
          </p>

          <h3>12. Contacto</h3>
          <p>Para preguntas o inquietudes sobre esta política, contáctenos en:</p>
          <ul>
            <li>Email: privacidad@365soft.com</li>
            <li>Teléfono: +1 (555) 123-4567</li>
          </ul>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-raised-button color="primary" mat-dialog-close>
          {{ 'auth.close' | transloco }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .dialog-container {
        max-width: 800px;
      }

      h2 {
        color: #0f172a;
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0;
      }

      mat-dialog-content {
        padding: 24px;
        max-height: 70vh;
        overflow-y: auto;
      }

      .privacy-content {
        color: #334155;
        line-height: 1.6;
      }

      .last-updated {
        color: #64748b;
        font-size: 0.875rem;
        font-style: italic;
        margin-bottom: 24px;
      }

      h3 {
        color: #1e293b;
        font-size: 1.125rem;
        font-weight: 600;
        margin: 24px 0 12px;
      }

      p {
        margin: 12px 0;
      }

      ul {
        margin: 12px 0;
        padding-left: 24px;
      }

      li {
        margin: 8px 0;
      }

      strong {
        font-weight: 600;
        color: #1e293b;
      }

      mat-dialog-actions {
        padding: 16px 24px;
        border-top: 1px solid #e2e8f0;
      }
    `,
  ],
})
export class PrivacyDialogComponent {}
