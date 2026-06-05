import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { getApiErrorMessage } from '../../core/http/http-error.util';
import { LanguageService } from '../../core/services/language.service';
import { AppButtonComponent, AppTextFieldComponent } from '../../shared/ui';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value as string | undefined;
  const confirmPassword = control.get('confirmPassword')?.value as string | undefined;
  return password && confirmPassword && password !== confirmPassword
    ? { passwordMismatch: true }
    : null;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    LucideAngularModule,
    TranslocoModule,
    AppButtonComponent,
    AppTextFieldComponent,
  ],
  template: `
    <div class="reset-page">
      <section class="reset-card">
        <div class="lang-toggle-row">
          <div
            class="lang-toggle"
            role="group"
            [attr.aria-label]="'common.languageSelector' | transloco"
          >
            <button
              type="button"
              class="lang-btn"
              [class.active]="languageService.isSpanish()"
              (click)="languageService.setLanguage('es')"
              [attr.aria-label]="'common.spanish' | transloco"
              [attr.title]="'common.spanish' | transloco"
            >
              ES
            </button>
            <button
              type="button"
              class="lang-btn"
              [class.active]="languageService.isEnglish()"
              (click)="languageService.setLanguage('en')"
              [attr.aria-label]="'common.english' | transloco"
              [attr.title]="'common.english' | transloco"
            >
              EN
            </button>
          </div>
        </div>

        <header class="reset-header">
          <div class="brand-logo">
            <lucide-icon [img]="Building2" [size]="42" />
          </div>
          <span class="eyebrow">
            <lucide-icon [img]="KeyRound" [size]="16" />
            {{ 'auth.resetPasswordEyebrow' | transloco }}
          </span>
          <h1>{{ 'auth.resetPasswordTitle' | transloco }}</h1>
          <p>{{ 'auth.resetPasswordDesc' | transloco }}</p>
        </header>

        @if (!token()) {
          <div class="error-alert">
            <lucide-icon [img]="AlertCircle" [size]="18" />
            <span>{{ 'auth.resetPasswordMissingToken' | transloco }}</span>
          </div>
        }

        @if (successMessage()) {
          <div class="success-alert">
            <lucide-icon [img]="CheckCircle2" [size]="18" />
            <span>{{ successMessage() }}</span>
          </div>
        }

        @if (errorMessage()) {
          <div class="error-alert">
            <lucide-icon [img]="AlertCircle" [size]="18" />
            <span>{{ errorMessage() }}</span>
          </div>
        }

        @if (token() && !successMessage()) {
          <form [formGroup]="form" (ngSubmit)="submit()" class="reset-form">
            <div class="password-row">
              <app-text-field
                formControlName="password"
                autocomplete="new-password"
                [label]="'auth.newPassword' | transloco"
                [placeholder]="'auth.newPasswordPlaceholder' | transloco"
                [type]="showPassword() ? 'text' : 'password'"
              />
              <button
                type="button"
                class="password-toggle"
                (click)="showPassword.set(!showPassword())"
                [attr.aria-label]="'auth.newPassword' | transloco"
              >
                <lucide-icon [img]="showPassword() ? EyeOff : Eye" [size]="18" />
              </button>
            </div>
            @if (form.controls.password.hasError('required') && form.controls.password.touched) {
              <p class="field-error">{{ 'auth.passwordRequired' | transloco }}</p>
            }
            @if (form.controls.password.hasError('minlength') && form.controls.password.touched) {
              <p class="field-error">{{ 'auth.passwordMin8' | transloco }}</p>
            }

            <div class="password-row">
              <app-text-field
                formControlName="confirmPassword"
                autocomplete="new-password"
                [label]="'auth.confirmPassword' | transloco"
                [placeholder]="'auth.newPasswordPlaceholder' | transloco"
                [type]="showConfirmPassword() ? 'text' : 'password'"
              />
              <button
                type="button"
                class="password-toggle"
                (click)="showConfirmPassword.set(!showConfirmPassword())"
                [attr.aria-label]="'auth.confirmPassword' | transloco"
              >
                <lucide-icon [img]="showConfirmPassword() ? EyeOff : Eye" [size]="18" />
              </button>
            </div>
            @if (
              form.controls.confirmPassword.hasError('required') &&
              form.controls.confirmPassword.touched
            ) {
              <p class="field-error">{{ 'auth.passwordRequired' | transloco }}</p>
            }
            @if (form.hasError('passwordMismatch') && form.controls.confirmPassword.touched) {
              <p class="field-error">{{ 'auth.passwordMismatch' | transloco }}</p>
            }

            <app-button
              type="submit"
              [fullWidth]="true"
              [loading]="isLoading()"
              [disabled]="form.invalid || isLoading()"
            >
              {{
                isLoading()
                  ? ('auth.updatingPassword' | transloco)
                  : ('auth.updatePassword' | transloco)
              }}
            </app-button>
          </form>
        }

        <footer class="reset-footer">
          <a routerLink="/login" class="back-link">
            <lucide-icon [img]="ArrowLeft" [size]="16" />
            {{ 'auth.backToLogin' | transloco }}
          </a>
        </footer>
      </section>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: #f8fafc;
      }

      .reset-page {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 40px 20px;
      }

      .reset-card {
        width: min(100%, 500px);
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        box-shadow: 0 18px 50px rgba(15, 23, 42, 0.12);
        padding: 40px;
      }

      .lang-toggle-row {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 18px;
      }

      .lang-toggle {
        display: flex;
        gap: 2px;
        background: #f1f5f9;
        border-radius: 8px;
        padding: 3px;
      }

      .lang-btn {
        border: 0;
        background: transparent;
        padding: 4px 10px;
        border-radius: 6px;
        color: #64748b;
        font-size: 0.75rem;
        font-weight: 800;
        cursor: pointer;
      }

      .lang-btn.active {
        background: #ffffff;
        color: #2563eb;
        box-shadow: 0 1px 4px rgba(15, 23, 42, 0.12);
      }

      .reset-header {
        display: grid;
        gap: 12px;
        margin-bottom: 28px;
        text-align: center;
      }

      .brand-logo {
        width: 72px;
        height: 72px;
        margin: 0 auto 4px;
        display: grid;
        place-items: center;
        border-radius: 18px;
        background: #0f172a;
        color: #ffffff;
      }

      .eyebrow {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: #2563eb;
        font-size: 0.8rem;
        font-weight: 800;
        text-transform: uppercase;
      }

      h1 {
        margin: 0;
        color: #0f172a;
        font-size: 1.75rem;
      }

      p {
        margin: 0;
      }

      .reset-header p {
        color: #64748b;
        line-height: 1.55;
      }

      .reset-form {
        display: grid;
        gap: 14px;
      }

      .password-row {
        position: relative;
      }

      .password-toggle {
        position: absolute;
        right: 12px;
        bottom: 12px;
        border: 0;
        background: transparent;
        color: #64748b;
        cursor: pointer;
      }

      .field-error {
        margin-top: -8px;
        color: #dc2626;
        font-size: 0.85rem;
      }

      .success-alert,
      .error-alert {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 14px;
        border-radius: 8px;
        margin-bottom: 20px;
        font-size: 0.9rem;
      }

      .success-alert {
        background: #f0fdf4;
        color: #166534;
        border: 1px solid #bbf7d0;
      }

      .error-alert {
        background: #fef2f2;
        color: #991b1b;
        border: 1px solid #fecaca;
      }

      .reset-footer {
        margin-top: 24px;
        padding-top: 22px;
        border-top: 1px solid #e2e8f0;
        text-align: center;
      }

      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #64748b;
        text-decoration: none;
        font-size: 0.9rem;
        font-weight: 700;
      }

      @media (max-width: 640px) {
        .reset-card {
          padding: 28px 22px;
        }
      }
    `,
  ],
})
export class ResetPasswordComponent {
  readonly AlertCircle = AlertCircle;
  readonly ArrowLeft = ArrowLeft;
  readonly Building2 = Building2;
  readonly CheckCircle2 = CheckCircle2;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly KeyRound = KeyRound;

  readonly languageService = inject(LanguageService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);

  readonly token = signal(this.route.snapshot.queryParamMap.get('token') ?? '');
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator },
  );

  submit(): void {
    if (!this.token()) {
      this.errorMessage.set(this.transloco.translate('auth.resetPasswordMissingToken'));
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.authService
      .resetPassword(this.token(), this.form.getRawValue().password)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.form.reset();
          this.successMessage.set(this.transloco.translate('auth.resetPasswordSuccess'));
          window.setTimeout(() => void this.router.navigate(['/login']), 1800);
        },
        error: (error: unknown) => {
          this.errorMessage.set(
            getApiErrorMessage(error, this.transloco.translate('auth.resetPasswordError')),
          );
        },
      });
  }
}
