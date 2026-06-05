import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { environment } from '../../../../environments/environment';
import { getApiErrorMessage } from '../../../core/http/http-error.util';
import { SlugService } from '../../../core/services/slug.service';
import { ApplicationIntentionService } from '../../../core/services/tenant/application-intention.service';
import { ReservationIntentionService } from '../../../core/services/tenant/reservation-intention.service';
import { TenantAuthService } from '../../../core/services/tenant/tenant-auth.service';

interface RegisterResponse {
  access_token?: string;
  id: number;
  name: string;
  email: string;
  role: 'TENANT' | 'INQUILINO';
  phone: string;
  tenant_id: number;
  created_at: string;
}

@Injectable()
export class TenantRegisterFacade {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly slugService = inject(SlugService);
  private readonly applicationIntentionService = inject(ApplicationIntentionService);
  private readonly reservationIntentionService = inject(ReservationIntentionService);
  private readonly tenantAuthService = inject(TenantAuthService);
  private readonly translocoService = inject(TranslocoService);

  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly slug = signal<string | null>(null);

  readonly registerForm = this.fb.group(
    {
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      phone: [''],
    },
    { validators: this.passwordMatchValidator.bind(this) },
  );

  private readonly reservedSlugs = [
    'login',
    'register',
    'dashboard',
    'portal',
    'publico',
    'admin',
    'api',
    'forgot-password',
  ];

  initialize(rawSlug: string | null): void {
    if (!rawSlug) {
      this.errorMessage.set(
        this.translocoService.translate('public.tenantRegister.invalidSlugError'),
      );
      return;
    }

    if (this.reservedSlugs.includes(rawSlug.toLowerCase())) {
      this.errorMessage.set(
        this.translocoService.translate('public.tenantRegister.reservedSlugError', {
          slug: rawSlug,
        }),
      );
      this.slug.set(null);
      return;
    }

    this.slug.set(rawSlug);
  }

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update((value) => !value);
  }

  submit(): void {
    const slug = this.slug();

    if (this.registerForm.invalid || !slug) {
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
      .post<RegisterResponse>(`${environment.apiUrl}auth/${slug}/register`, {
        name,
        email,
        password,
        phone,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.handleRegisterSuccess(slug, response),
        error: (error) => this.handleRegisterError(error),
      });
  }

  private passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value as string | undefined;
    const confirmPassword = group.get('confirmPassword')?.value as string | undefined;

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  private handleRegisterSuccess(slug: string, response: RegisterResponse): void {
    this.isLoading.set(false);
    this.slugService.setSlug(slug);

    if (response.access_token) {
      this.tenantAuthService.setSessionFromToken(response.access_token, response, slug);
      this.successMessage.set(
        this.translocoService.translate('public.tenantRegister.redirectingMsg'),
      );

      setTimeout(() => this.navigateAfterAuthenticatedRegister(slug), 1000);
      return;
    }

    this.successMessage.set(this.translocoService.translate('public.tenantRegister.loginReadyMsg'));

    setTimeout(() => {
      void this.router.navigate(['/', slug, 'login'], {
        queryParams: { registered: 'true' },
        replaceUrl: true,
      });
    }, 2000);
  }

  private handleRegisterError(error: unknown): void {
    this.isLoading.set(false);
    this.errorMessage.set(
      getApiErrorMessage(
        error,
        this.translocoService.translate('public.tenantRegister.defaultError'),
      ),
    );
  }

  private navigateAfterAuthenticatedRegister(slug: string): void {
    if (this.reservationIntentionService.hasIntention()) {
      this.reservationIntentionService.navigateToReservation(slug);
      return;
    }

    if (this.applicationIntentionService.hasIntention()) {
      this.applicationIntentionService.navigateToApplication(slug);
      return;
    }

    void this.router.navigate(['/', slug, 'portal', 'home'], {
      replaceUrl: true,
    });
  }
}
