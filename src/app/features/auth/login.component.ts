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
  KeyRound,
  BarChart3,
  Users,
  FileText,
} from 'lucide-angular';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { LanguageService } from '../../core/services/language.service';
import { AuthService, isAdminMfaRequiredResponse } from '../../core/services/auth.service';
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
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
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
  readonly KeyRound = KeyRound;
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
  mfaRequired = signal(false);
  mfaChallengeId = signal<string | null>(null);
  mfaEmailMasked = signal('');

  // Slug from URL (null if accessing /login, has value if /:slug/login)
  slug: string | null = null;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    rememberMe: [false],
  });

  mfaForm = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
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
          if (isAdminMfaRequiredResponse(response)) {
            this.mfaRequired.set(true);
            this.mfaChallengeId.set(response.challenge_id);
            this.mfaEmailMasked.set(response.email_masked);
            this.mfaForm.reset({ code: '' });
            return;
          }

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

  verifyMfa(): void {
    if (this.mfaForm.invalid || !this.mfaChallengeId()) {
      this.mfaForm.markAllAsTouched();
      return;
    }

    const rememberMe = this.loginForm.getRawValue().rememberMe ?? false;
    const code = this.mfaForm.getRawValue().code ?? '';

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.verifyAdminMfa(this.mfaChallengeId()!, code, rememberMe).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        const userSlug = response.user.tenant_slug;
        if (!userSlug) {
          this.errorMessage.set(this.transloco.translate('auth.orgNotFound'));
          return;
        }

        void this.router.navigate(['/', userSlug, 'dashboard'], { replaceUrl: true }).then(() => {
          this.location.replaceState(`/${userSlug}/dashboard`);
        });
      },
      error: (error: { error?: { message?: string } }) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          getApiErrorMessage(error, this.transloco.translate('auth.mfaInvalid')),
        );
      },
    });
  }

  resetMfa(): void {
    this.mfaRequired.set(false);
    this.mfaChallengeId.set(null);
    this.mfaEmailMasked.set('');
    this.mfaForm.reset({ code: '' });
    this.errorMessage.set(null);
  }
}
