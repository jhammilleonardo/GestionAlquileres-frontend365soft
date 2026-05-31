import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import {
  LucideAngularModule,
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Shield,
  BarChart3,
  Users,
  FileText,
} from 'lucide-angular';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { LanguageService } from '../../core/services/language.service';
import { AuthService } from '../../core/services/auth.service';
import { TenantAuthService } from '../../core/services/tenant/tenant-auth.service';
import { SlugService } from '../../core/services/slug.service';
import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { AppCheckboxComponent } from '../../shared/ui/checkbox/checkbox.component';
import { AppTextFieldComponent } from '../../shared/ui/text-field/text-field.component';

import { getApiErrorMessage } from '../../core/http/http-error.util';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    LucideAngularModule,
    TranslocoModule,
    AppButtonComponent,
    AppCheckboxComponent,
    AppTextFieldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="login-page">
      <!-- Left Side - Branding -->
      <div class="login-brand">
        <div class="brand-content">
          <div class="brand-logo">
            <lucide-icon [img]="Building2" [size]="56"></lucide-icon>
          </div>
          <h1>365Soft</h1>
          <h2>{{ 'auth.adminPanel' | transloco }}</h2>
          <p class="brand-tagline">
            {{ 'auth.tagline' | transloco }}
          </p>

          <div class="features">
            <div class="feature-item">
              <lucide-icon [img]="BarChart3" [size]="20"></lucide-icon>
              <span>{{ 'auth.feature1' | transloco }}</span>
            </div>
            <div class="feature-item">
              <lucide-icon [img]="Users" [size]="20"></lucide-icon>
              <span>{{ 'auth.feature2' | transloco }}</span>
            </div>
            <div class="feature-item">
              <lucide-icon [img]="FileText" [size]="20"></lucide-icon>
              <span>{{ 'auth.feature3' | transloco }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side - Login Form -->
      <div class="login-form-container">
        <div class="login-form-wrapper">
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
            <h3>{{ 'auth.loginTitle' | transloco }}</h3>
            <p>
              {{
                slug
                  ? ('auth.loginSubtitleTenant' | transloco)
                  : ('auth.loginSubtitleAdmin' | transloco)
              }}
            </p>
          </div>

          @if (errorMessage()) {
            <div class="error-alert">
              <lucide-icon [img]="AlertCircle" [size]="18"></lucide-icon>
              <div class="error-content">
                <strong>{{ 'auth.loginError' | transloco }}</strong>
                <span>{{ errorMessage() }}</span>
              </div>
            </div>
          }

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
            <div class="field-block">
              <app-text-field
                formControlName="email"
                type="email"
                autocomplete="email"
                label="{{ 'auth.email' | transloco }}"
                placeholder="admin@empresa.com"
              />
              @if (
                loginForm.get('email')?.hasError('required') && loginForm.get('email')?.touched
              ) {
                <p class="field-error">{{ 'auth.emailRequired' | transloco }}</p>
              }
              @if (loginForm.get('email')?.hasError('email') && loginForm.get('email')?.touched) {
                <p class="field-error">{{ 'auth.emailInvalid' | transloco }}</p>
              }
            </div>

            <div class="field-block">
              <div class="password-wrapper">
                <app-text-field
                  formControlName="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  autocomplete="current-password"
                  label="{{ 'auth.password' | transloco }}"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  class="password-toggle"
                  (click)="togglePassword()"
                  tabindex="-1"
                  [attr.aria-label]="'auth.password' | transloco"
                >
                  <lucide-icon [img]="showPassword() ? EyeOff : Eye" [size]="18" />
                </button>
              </div>
              @if (
                loginForm.get('password')?.hasError('required') &&
                loginForm.get('password')?.touched
              ) {
                <p class="field-error">{{ 'auth.passwordRequired' | transloco }}</p>
              }
            </div>

            <div class="form-options">
              <app-checkbox
                formControlName="rememberMe"
                label="{{ 'auth.rememberMe' | transloco }}"
              />
              <a routerLink="/forgot-password" class="forgot-link">{{
                'auth.forgotPassword' | transloco
              }}</a>
            </div>

            <app-button
              type="submit"
              class="submit-btn"
              [fullWidth]="true"
              [loading]="isLoading()"
              [disabled]="loginForm.invalid || isLoading()"
            >
              {{ isLoading() ? ('auth.loggingIn' | transloco) : ('auth.login' | transloco) }}
            </app-button>
          </form>

          <div class="form-footer">
            <div class="security-badge">
              <lucide-icon [img]="Shield" [size]="16"></lucide-icon>
              <span>{{ 'auth.sslBadge' | transloco }}</span>
            </div>
            <div class="help-links">
              @if (!slug) {
                <a routerLink="/register" class="help-link">{{ 'auth.noAccount' | transloco }}</a>
              } @else {
                <a [routerLink]="['/', slug, 'register']" class="help-link">{{
                  'auth.noAccount' | transloco
                }}</a>
              }
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

      .login-page {
        display: grid;
        grid-template-columns: 1fr 1fr;
        height: 100vh;
        overflow: hidden;
      }

      /* Left Side - Branding */
      .login-brand {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 60px;
        position: relative;
        overflow: hidden;
      }

      .login-brand::before {
        content: '';
        position: absolute;
        width: 500px;
        height: 500px;
        background: rgba(59, 130, 246, 0.1);
        border-radius: 50%;
        top: -200px;
        left: -200px;
      }

      .login-brand::after {
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
      .login-form-container {
        background: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 60px;
        overflow-y: auto;
      }

      .login-form-wrapper {
        width: 100%;
        max-width: 440px;
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

      .error-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .error-content strong {
        color: #991b1b;
        font-size: 0.875rem;
        font-weight: 600;
      }

      .error-content span {
        color: #dc2626;
        font-size: 0.875rem;
      }

      .login-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .field-block {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .field-error {
        color: #dc2626;
        font-size: 0.8125rem;
        margin: 0;
      }

      .password-wrapper {
        position: relative;
      }

      .password-toggle {
        position: absolute;
        top: 50%;
        right: 10px;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: #64748b;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        z-index: 2;
      }
      .password-toggle:hover {
        color: #0f172a;
      }

      .form-options {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .forgot-link {
        font-size: 0.875rem;
        color: #3b82f6;
        text-decoration: none;
        font-weight: 500;
      }

      .forgot-link:hover {
        color: #2563eb;
        text-decoration: underline;
      }

      .submit-btn {
        margin-top: 8px;
      }

      .form-footer {
        margin-top: 32px;
        padding-top: 24px;
        border-top: 1px solid #e2e8f0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }

      .security-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #64748b;
        font-size: 0.8125rem;
      }

      .security-badge lucide-icon {
        color: #10b981;
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

      /* Responsive Design */
      @media (max-width: 1024px) {
        .login-page {
          grid-template-columns: 1fr;
        }

        .login-brand {
          display: none;
        }

        .login-form-container {
          padding: 40px 24px;
        }
      }

      @media (max-width: 640px) {
        .login-form-container {
          padding: 32px 20px;
        }

        .form-header h3 {
          font-size: 1.5rem;
        }

        .form-header p {
          font-size: 0.9375rem;
        }

        .login-form-wrapper {
          max-width: 100%;
        }

        .submit-btn {
          height: 48px;
          font-size: 0.9375rem;
        }
      }

      @media (max-width: 480px) {
        .login-form-container {
          padding: 24px 16px;
        }

        .form-header {
          margin-bottom: 24px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-options {
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 20px;
        }
      }
    `,
  ],
})
export class LoginComponent {
  readonly Building2 = Building2;
  readonly Mail = Mail;
  readonly Lock = Lock;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly AlertCircle = AlertCircle;
  readonly CheckCircle2 = CheckCircle2;
  readonly Shield = Shield;
  readonly BarChart3 = BarChart3;
  readonly Users = Users;
  readonly FileText = FileText;

  readonly languageService = inject(LanguageService);
  private authService = inject(AuthService);
  private tenantAuthService = inject(TenantAuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private location = inject(Location);
  private slugService = inject(SlugService);
  private transloco = inject(TranslocoService);

  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // Slug from URL (null if accessing /login, has value if /:slug/login)
  slug: string | null = null;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    rememberMe: [false],
  });

  constructor() {
    // Get slug from URL
    this.slug = this.route.snapshot.paramMap.get('slug');

    // If already authenticated, redirect to appropriate dashboard
    // Check for admin token first (only when no slug in URL)
    const adminToken = this.authService.getToken();
    const isAdminAuth = this.authService.isAuth();

    if (isAdminAuth && adminToken && !this.slug) {
      // Admin user authenticated on /login (no slug)
      // Get slug from stored user data
      const userJson = localStorage.getItem('admin_user');
      if (userJson) {
        try {
          const user = JSON.parse(userJson) as { tenant_slug?: string };
          const userSlug = user.tenant_slug;
          if (userSlug) {
            // Usar replaceUrl para que el login no quede en el historial
            void this.router
              .navigate(['/', userSlug, 'dashboard'], { replaceUrl: true })
              .then(() => {
                // Limpiar el estado para asegurar que no haya query params en el historial
                this.location.replaceState(`/${userSlug}/dashboard`);
              });
            return;
          }
        } catch {
          // Ignorar JSON inválido en storage
        }
      }
      // Fallback: try to get slug from SlugService (loaded from localStorage)
      const storedSlug = this.slugService.getSlug();
      if (storedSlug) {
        void this.router.navigate(['/', storedSlug, 'dashboard'], { replaceUrl: true });
      }
      // If no slug is available anywhere, stay on login page
    }

    // If we have a slug, don't redirect automatically - let the user login
    // TenantAuthService will handle the redirect after successful login
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password, rememberMe } = this.loginForm.value;

    // If we have a slug, use TenantAuthService for tenant login
    if (this.slug) {
      // Tenant login - TenantAuthService handles everything including navigation
      this.tenantAuthService.login(this.slug, email!, password!).subscribe({
        next: () => {
          this.isLoading.set(false);
          // TenantAuthService already handles navigation to /portal/dashboard
        },
        error: (error: { error?: { message?: string } }) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            getApiErrorMessage(error, this.transloco.translate('auth.credentialsInvalid')),
          );
        },
      });
    } else {
      // Admin login - use AuthService
      this.isLoading.set(true);
      this.errorMessage.set(null);

      this.authService.loginAdmin(email!, password!, rememberMe!).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          const userSlug = response.user.tenant_slug;

          if (userSlug) {
            // Navegar al dashboard con replaceUrl para limpiar el historial
            // Esto previene que el usuario vuelva al login al presionar el botón de retroceso
            void this.router
              .navigate(['/', userSlug, 'dashboard'], {
                replaceUrl: true,
              })
              .then(() => {
                // Limpiar cualquier query param de returnUrl del estado del navegador
                // Esto asegura que el historial no tenga entradas con ?returnUrl=...
                this.location.replaceState(`/${userSlug}/dashboard`);
              });
          } else {
            this.errorMessage.set(this.transloco.translate('auth.orgNotFound'));
          }
        },
        error: (error: { error?: { message?: string } }) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            getApiErrorMessage(error, this.transloco.translate('auth.credentialsInvalid')),
          );
        },
      });
    }
  }
}
