import {
  Component,
  inject,
  DestroyRef,
  signal,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {
  LucideAngularModule,
  Home,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Shield,
  CalendarDays,
  FileText,
  MessageSquare,
} from 'lucide-angular';
import { environment } from '../../../../environments/environment';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SlugService } from '../../../core/services/slug.service';
import { TranslocoModule, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { LanguageService } from '../../../core/services/language.service';
import { AppButtonComponent } from '../../../shared/ui/button/button.component';
import { AppTextFieldComponent } from '../../../shared/ui/text-field/text-field.component';

import { getApiErrorMessage } from '../../../core/http/http-error.util';
interface RegisterResponse {
  access_token?: string;
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string;
  tenant_id: number;
  created_at: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tenant-register',
  standalone: true,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    LucideAngularModule,
    TranslocoModule,
    AppButtonComponent,
    AppTextFieldComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  template: `
    <div class="register-page">
      <!-- Left Side - Branding -->
      <div class="register-brand">
        <div class="brand-content">
          <div class="brand-logo">
            <lucide-icon [img]="Home" [size]="56"></lucide-icon>
          </div>
          <h1>{{ 'public.tenantRegister.brandTitle' | transloco }}</h1>
          <h2>{{ 'public.tenantRegister.brandSubtitle' | transloco }}</h2>
          <p class="brand-tagline">
            {{ 'public.tenantRegister.brandDesc' | transloco }}
          </p>

          <div class="features">
            <div class="feature-item">
              <lucide-icon [img]="CalendarDays" [size]="20"></lucide-icon>
              <span>{{ 'public.tenantRegister.feature1' | transloco }}</span>
            </div>
            <div class="feature-item">
              <lucide-icon [img]="FileText" [size]="20"></lucide-icon>
              <span>{{ 'public.tenantRegister.feature2' | transloco }}</span>
            </div>
            <div class="feature-item">
              <lucide-icon [img]="MessageSquare" [size]="20"></lucide-icon>
              <span>{{ 'public.tenantRegister.feature3' | transloco }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side - Register Form -->
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
            <h3>{{ 'public.tenantRegister.heroTitle' | transloco }}</h3>
            <p>{{ 'public.tenantRegister.heroSubtitle' | transloco }}</p>
          </div>

          @if (errorMessage()) {
            <div class="error-alert">
              <lucide-icon [img]="AlertCircle" [size]="18"></lucide-icon>
              <div class="error-content">
                <strong>{{ 'public.tenantRegister.errorTitle' | transloco }}</strong>
                <span>{{ errorMessage() }}</span>
              </div>
            </div>
          }

          @if (successMessage()) {
            <div class="success-alert">
              <lucide-icon [img]="CheckCircle2" [size]="20"></lucide-icon>
              <div class="alert-content">
                <strong>{{ 'public.tenantRegister.successTitle' | transloco }}</strong>
                <span>{{ successMessage() }}</span>
              </div>
            </div>
          }

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="register-form">
            <div class="field-block">
              <app-text-field
                formControlName="name"
                autocomplete="name"
                label="{{ 'public.tenantRegister.nameLabel' | transloco }}"
                placeholder="{{ 'public.tenantRegister.namePlaceholder' | transloco }}"
              />
              @if (
                registerForm.get('name')?.hasError('required') && registerForm.get('name')?.touched
              ) {
                <p class="field-error">{{ 'public.tenantRegister.nameRequired' | transloco }}</p>
              }
              @if (registerForm.get('name')?.hasError('minlength')) {
                <p class="field-error">{{ 'public.tenantRegister.nameMin' | transloco }}</p>
              }
            </div>

            <div class="field-block">
              <app-text-field
                formControlName="email"
                type="email"
                autocomplete="email"
                label="{{ 'public.tenantRegister.emailLabel' | transloco }}"
                placeholder="{{ 'public.tenantRegister.emailPlaceholder' | transloco }}"
              />
              @if (
                registerForm.get('email')?.hasError('required') &&
                registerForm.get('email')?.touched
              ) {
                <p class="field-error">{{ 'public.tenantRegister.emailRequired' | transloco }}</p>
              }
              @if (registerForm.get('email')?.hasError('email')) {
                <p class="field-error">{{ 'public.tenantRegister.emailInvalid' | transloco }}</p>
              }
            </div>

            <div class="field-block">
              <app-text-field
                formControlName="phone"
                type="tel"
                autocomplete="tel"
                label="{{ 'public.tenantRegister.phoneLabel' | transloco }}"
                placeholder="{{ 'public.tenantRegister.phonePlaceholder' | transloco }}"
              />
            </div>

            <div class="field-block">
              <div class="password-wrapper">
                <app-text-field
                  formControlName="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  autocomplete="new-password"
                  label="{{ 'public.tenantRegister.passwordLabel' | transloco }}"
                  placeholder="{{ 'public.tenantRegister.passwordPlaceholder' | transloco }}"
                />
                <button
                  type="button"
                  class="password-toggle"
                  (click)="togglePassword()"
                  tabindex="-1"
                  [attr.aria-label]="'public.tenantRegister.passwordLabel' | transloco"
                >
                  <lucide-icon [img]="showPassword() ? EyeOff : Eye" [size]="18" />
                </button>
              </div>
              <p class="field-hint">{{ 'public.tenantRegister.passwordMin' | transloco }}</p>
              @if (
                registerForm.get('password')?.hasError('required') &&
                registerForm.get('password')?.touched
              ) {
                <p class="field-error">
                  {{ 'public.tenantRegister.passwordRequired' | transloco }}
                </p>
              }
              @if (registerForm.get('password')?.hasError('minlength')) {
                <p class="field-error">{{ 'public.tenantRegister.passwordMin' | transloco }}</p>
              }
            </div>

            <div class="field-block">
              <div class="password-wrapper">
                <app-text-field
                  formControlName="confirmPassword"
                  [type]="showConfirmPassword() ? 'text' : 'password'"
                  autocomplete="new-password"
                  label="{{ 'public.tenantRegister.confirmPasswordLabel' | transloco }}"
                  placeholder="{{ 'public.tenantRegister.passwordPlaceholder' | transloco }}"
                />
                <button
                  type="button"
                  class="password-toggle"
                  (click)="toggleConfirmPassword()"
                  tabindex="-1"
                  [attr.aria-label]="'public.tenantRegister.confirmPasswordLabel' | transloco"
                >
                  <lucide-icon [img]="showConfirmPassword() ? EyeOff : Eye" [size]="18" />
                </button>
              </div>
              @if (
                registerForm.get('confirmPassword')?.hasError('required') &&
                registerForm.get('confirmPassword')?.touched
              ) {
                <p class="field-error">
                  {{ 'public.tenantRegister.confirmPasswordRequired' | transloco }}
                </p>
              }
              @if (
                registerForm.hasError('passwordMismatch') &&
                registerForm.get('confirmPassword')?.touched
              ) {
                <p class="field-error">
                  {{ 'public.tenantRegister.passwordMismatch' | transloco }}
                </p>
              }
            </div>

            <app-button
              type="submit"
              class="submit-btn"
              [fullWidth]="true"
              [loading]="isLoading()"
              [disabled]="registerForm.invalid || isLoading()"
            >
              {{
                isLoading()
                  ? ('public.tenantRegister.submittingBtn' | transloco)
                  : ('public.tenantRegister.submitBtn' | transloco)
              }}
            </app-button>
          </form>

          <div class="form-footer">
            <div class="security-badge">
              <lucide-icon [img]="Shield" [size]="16"></lucide-icon>
              <span>{{ 'public.tenantRegister.sslBadge' | transloco }}</span>
            </div>
            <div class="help-links">
              @if (slug) {
                <a [routerLink]="['/', slug, 'login']" class="help-link">{{
                  'public.tenantRegister.loginLink' | transloco
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

      .register-page {
        display: grid;
        grid-template-columns: 1fr 1fr;
        height: 100vh;
        overflow: hidden;
      }

      /* Left Side - Branding */
      .register-brand {
        background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%);
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
        background: rgba(16, 185, 129, 0.1);
        border-radius: 50%;
        top: -200px;
        left: -200px;
      }

      .register-brand::after {
        content: '';
        position: absolute;
        width: 400px;
        height: 400px;
        background: rgba(16, 185, 129, 0.08);
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
        background: rgba(16, 185, 129, 0.2);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 32px;
        border: 2px solid rgba(16, 185, 129, 0.3);
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
        color: #6ee7b7;
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
        color: #34d399;
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

      .register-form {
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

      .field-hint {
        color: #64748b;
        font-size: 0.75rem;
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
        text-align: center;
        font-size: 0.875rem;
      }

      .help-link {
        color: #059669;
        text-decoration: none;
        font-weight: 500;
        cursor: pointer;
      }

      .help-link:hover {
        text-decoration: underline;
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

        .submit-btn {
          height: 48px;
          font-size: 0.9375rem;
        }
      }

      @media (max-width: 480px) {
        .register-form-container {
          padding: 24px 16px;
        }

        .form-header {
          margin-bottom: 24px;
        }
      }
    `,
  ],
})
export class TenantRegisterComponent implements OnInit {
  readonly Home = Home;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly AlertCircle = AlertCircle;
  readonly CheckCircle2 = CheckCircle2;
  readonly Shield = Shield;
  readonly CalendarDays = CalendarDays;
  readonly FileText = FileText;
  readonly MessageSquare = MessageSquare;

  readonly languageService = inject(LanguageService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);
  private slugService = inject(SlugService);
  private translocoService = inject(TranslocoService);

  showPassword = signal(false);
  showConfirmPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  slug: string | null = null;

  registerForm: FormGroup;

  constructor() {
    this.registerForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
        phone: [''],
      },
      { validators: this.passwordMatchValidator.bind(this) },
    );
  }

  // Palabras reservadas por el sistema de rutas que nunca pueden ser un slug de inquilino
  private readonly RESERVED_SLUGS = [
    'login',
    'register',
    'dashboard',
    'portal',
    'publico',
    'admin',
    'api',
    'forgot-password',
  ];

  ngOnInit(): void {
    // Get slug from URL — read in ngOnInit to ensure inherited params are available
    this.slug = this.route.snapshot.paramMap.get('slug');

    if (!this.slug) {
      this.errorMessage.set(
        this.translocoService.translate('public.tenantRegister.invalidSlugError'),
      );
      return;
    }

    // Validate that the slug is not a reserved system route segment
    if (this.RESERVED_SLUGS.includes(this.slug.toLowerCase())) {
      this.errorMessage.set(
        this.translocoService.translate('public.tenantRegister.reservedSlugError', {
          slug: this.slug,
        }),
      );
      this.slug = null; // Prevent form submission with wrong slug
      return;
    }
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value as string | undefined;
    const confirmPassword = group.get('confirmPassword')?.value as string | undefined;

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  onSubmit(): void {
    if (this.registerForm.invalid || !this.slug) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const { name, email, password, phone } = this.registerForm.value as {
      name?: string;
      email?: string;
      password?: string;
      phone?: string;
    };

    this.http
      .post<RegisterResponse>(`${environment.apiUrl}auth/${this.slug}/register`, {
        name,
        email,
        password,
        phone,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);

          // Set slug in SlugService
          this.slugService.setSlug(this.slug);

          // If API returns access_token, save it and redirect to dashboard
          if (response.access_token) {
            // Save token and user data
            localStorage.setItem('tenant_access_token', response.access_token);
            localStorage.setItem('tenant_user', JSON.stringify(response));

            this.successMessage.set(
              this.translocoService.translate('public.tenantRegister.redirectingMsg'),
            );

            // Redirect to tenant dashboard after 1 second
            setTimeout(() => {
              void this.router.navigate(['/', this.slug, 'portal', 'dashboard'], {
                replaceUrl: true,
              });
            }, 1000);
          } else {
            // No token returned, redirect to login
            this.successMessage.set(
              this.translocoService.translate('public.tenantRegister.loginReadyMsg'),
            );

            // Redirect to login after 2 seconds
            setTimeout(() => {
              void this.router.navigate(['/', this.slug, 'login'], {
                queryParams: { registered: 'true' },
                replaceUrl: true,
              });
            }, 2000);
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            getApiErrorMessage(
              error,
              this.translocoService.translate('public.tenantRegister.defaultError'),
            ),
          );
        },
      });
  }
}
