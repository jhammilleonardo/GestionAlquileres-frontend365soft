import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  LucideAngularModule,
  Home,
  Eye,
  EyeOff,
  AlertCircle,
  Shield,
  CalendarDays,
  FileText,
  MessageSquare,
} from 'lucide-angular';
import { TenantAuthService } from '../../../core/services/tenant/tenant-auth.service';
import { ApplicationIntentionService } from '../../../core/services/tenant/application-intention.service';
import { TranslocoModule, provideTranslocoScope } from '@jsverse/transloco';
import { LanguageService } from '../../../core/services/language.service';
import {
  AppButtonComponent,
  AppCheckboxComponent,
  AppTextFieldComponent,
} from '../../../shared/ui';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tenant-login',
  standalone: true,
  imports: [
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    TranslocoModule,
    AppButtonComponent,
    AppCheckboxComponent,
    AppTextFieldComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  template: `
    <div class="login-page">
      <!-- Left Side - Branding -->
      <div class="login-brand">
        <div class="brand-content">
          <div class="brand-logo">
            <lucide-icon [img]="Home" [size]="56"></lucide-icon>
          </div>
          <h1>{{ 'public.tenantLogin.brandTitle' | transloco }}</h1>
          <h2>{{ 'public.tenantLogin.brandSubtitle' | transloco }}</h2>
          <p class="brand-tagline">
            {{ 'public.tenantLogin.brandDesc' | transloco }}
          </p>

          <div class="features">
            <div class="feature-item">
              <lucide-icon [img]="CalendarDays" [size]="20"></lucide-icon>
              <span>{{ 'public.tenantLogin.feature1' | transloco }}</span>
            </div>
            <div class="feature-item">
              <lucide-icon [img]="FileText" [size]="20"></lucide-icon>
              <span>{{ 'public.tenantLogin.feature2' | transloco }}</span>
            </div>
            <div class="feature-item">
              <lucide-icon [img]="MessageSquare" [size]="20"></lucide-icon>
              <span>{{ 'public.tenantLogin.feature3' | transloco }}</span>
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
            <h3>{{ 'public.tenantLogin.heroTitle' | transloco }}</h3>
            <p>{{ 'public.tenantLogin.heroSubtitle' | transloco }}</p>
          </div>

          @if (authService.error()) {
            <div class="error-alert">
              <lucide-icon [img]="AlertCircle" [size]="18"></lucide-icon>
              <div class="error-content">
                <strong>{{ 'public.tenantLogin.errorTitle' | transloco }}</strong>
                <span>{{ authService.error() }}</span>
              </div>
            </div>
          }

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
            <div class="field-block">
              <app-text-field
                formControlName="email"
                autocomplete="email"
                label="{{ 'public.tenantLogin.emailLabel' | transloco }}"
                [placeholder]="'public.tenantLogin.emailPlaceholder' | transloco"
                type="email"
              />
              @if (
                loginForm.get('email')?.hasError('required') && loginForm.get('email')?.touched
              ) {
                <p class="field-error">{{ 'public.tenantLogin.emailRequired' | transloco }}</p>
              }
              @if (loginForm.get('email')?.hasError('email') && loginForm.get('email')?.touched) {
                <p class="field-error">{{ 'public.tenantLogin.emailInvalid' | transloco }}</p>
              }
            </div>

            <div class="field-block">
              <div class="password-row">
                <app-text-field
                  formControlName="password"
                  autocomplete="current-password"
                  label="{{ 'public.tenantLogin.passwordLabel' | transloco }}"
                  [placeholder]="'public.tenantLogin.passwordPlaceholder' | transloco"
                  [type]="showPassword() ? 'text' : 'password'"
                />
                <button
                  class="password-toggle"
                  type="button"
                  (click)="togglePassword()"
                  [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                >
                  <lucide-icon [img]="showPassword() ? EyeOff : Eye" [size]="18"></lucide-icon>
                </button>
              </div>
              @if (
                loginForm.get('password')?.hasError('required') &&
                loginForm.get('password')?.touched
              ) {
                <p class="field-error">{{ 'public.tenantLogin.passwordRequired' | transloco }}</p>
              }
            </div>

            <div class="form-options">
              <app-checkbox formControlName="rememberMe">
                {{ 'public.tenantLogin.rememberMe' | transloco }}
              </app-checkbox>
              <a routerLink="/forgot-password" class="forgot-link">{{
                'public.tenantLogin.forgotPassword' | transloco
              }}</a>
            </div>

            <app-button
              type="submit"
              class="submit-btn"
              [fullWidth]="true"
              [loading]="authService.isLoading()"
              [disabled]="loginForm.invalid || authService.isLoading()"
            >
              {{
                authService.isLoading()
                  ? ('public.tenantLogin.submittingBtn' | transloco)
                  : ('public.tenantLogin.submitBtn' | transloco)
              }}
            </app-button>
          </form>

          <div class="form-footer">
            <div class="security-badge">
              <lucide-icon [img]="Shield" [size]="16"></lucide-icon>
              <span>{{ 'public.tenantLogin.sslBadge' | transloco }}</span>
            </div>
            <div class="help-links">
              @if (slug(); as slug) {
                <a [routerLink]="['/', slug, 'register']" class="help-link">{{
                  'public.tenantLogin.registerLink' | transloco
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
        background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%);
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
        background: rgba(16, 185, 129, 0.1);
        border-radius: 50%;
        top: -200px;
        left: -200px;
      }

      .login-brand::after {
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
      }

      .field-block {
        margin-bottom: 16px;
      }

      .field-error {
        margin: 0.4rem 0 0;
        font-size: 0.875rem;
        color: #dc2626;
      }

      .password-row {
        position: relative;
      }

      .password-toggle {
        position: absolute;
        right: 0.5rem;
        top: 50%;
        z-index: 2;
        display: inline-flex;
        width: 2.25rem;
        height: 2.25rem;
        align-items: center;
        justify-content: center;
        border: 0;
        border-radius: 999px;
        background: transparent;
        color: #64748b;
        cursor: pointer;
        transform: translateY(-50%);
      }

      .password-toggle:hover {
        background: #f1f5f9;
        color: #0f172a;
      }

      .form-options {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24px;
      }

      .forgot-link {
        font-size: 0.875rem;
        color: #059669;
        text-decoration: none;
        font-weight: 500;
      }

      .forgot-link:hover {
        color: #047857;
        text-decoration: underline;
      }

      .submit-btn {
        width: 100%;
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
        .login-page {
          grid-template-columns: 1fr;
        }

        .login-brand {
          display: none;
        }
      }

      @media (max-width: 640px) {
        .login-form-container {
          padding: 24px 16px;
        }

        .form-header h3 {
          font-size: 1.5rem;
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
export class TenantLoginComponent {
  readonly Home = Home;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly AlertCircle = AlertCircle;
  readonly Shield = Shield;
  readonly CalendarDays = CalendarDays;
  readonly FileText = FileText;
  readonly MessageSquare = MessageSquare;

  readonly languageService = inject(LanguageService);
  authService = inject(TenantAuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private location = inject(Location);
  private intentionService = inject(ApplicationIntentionService);
  private destroyRef = inject(DestroyRef);

  showPassword = signal(false);
  readonly slug = signal<string | null>(null);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    rememberMe: [false],
  });

  constructor() {
    // Obtener el slug de la URL — leerlo en ngOnInit (no en constructor)
    // para asegurar que los params heredados estén disponibles
    // con paramsInheritanceStrategy: 'always'
    this.slug.set(this.route.snapshot.paramMap.get('slug'));

    // Fallback: extraer slug directamente de la URL del router si paramMap retorna null
    // Esto cubre el caso donde el componente está lazy-loaded en rutas profundamente anidadas
    // Formato de URL esperado: /:slug/login  o  /:slug/portal/login
    if (!this.slug()) {
      const urlSegments = this.router.url.split('?')[0].split('/').filter(Boolean);
      if (urlSegments.length >= 1) {
        const potentialSlug = urlSegments[0];
        const reservedPaths = [
          'login',
          'register',
          'forgot-password',
          'portal',
          'dashboard',
          'admin',
          'publico',
        ];
        if (!reservedPaths.includes(potentialSlug)) {
          this.slug.set(potentialSlug);
        }
      }
    }

    // Suscribirse a cambios de params para manejar reactivación del componente
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const routeSlug = params.get('slug');
      if (routeSlug) {
        this.slug.set(routeSlug);
      }
    });
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  onSubmit(): void {
    const slug = this.slug();
    if (this.loginForm.invalid || !slug) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.value;
    this.authService.clearError();

    this.authService.login(slug, email!, password!).subscribe({
      next: () => {
        // Verificar si hay una intención de aplicación guardada
        if (this.intentionService.hasIntention()) {
          // Hay intención -> Redirigir al formulario de aplicación
          this.intentionService.navigateToApplication(slug);
        } else {
          // No hay intención -> Usar returnUrl o dashboard por defecto
          const returnUrl =
            this.route.snapshot.queryParamMap.get('returnUrl') ?? `/${slug}/portal/home`;
          // Usar replaceUrl para que el login no quede en el historial del navegador
          void this.router.navigateByUrl(returnUrl, { replaceUrl: true }).then(() => {
            // Limpiar cualquier query param de returnUrl del estado del navegador
            // Esto asegura que el historial no tenga entradas con ?returnUrl=...
            const cleanUrl = returnUrl.split('?')[0]; // Remover query params
            this.location.replaceState(cleanUrl);
          });
        }
      },
      error: () => {
        // Error is handled by the service
      },
    });
  }
}
