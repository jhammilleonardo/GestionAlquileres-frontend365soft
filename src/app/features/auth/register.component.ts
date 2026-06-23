import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import {
  LucideAngularModule,
  Building2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-angular';
import { catchError, tap } from 'rxjs';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { LanguageService } from '../../core/services/language.service';
import { AuthService } from '../../core/services/auth.service';
import { getApiErrorMessage } from '../../core/http/http-error.util';
import { SanitizedHtmlPipe } from '../../shared/pipes/sanitized-html.pipe';
import {
  AppButtonComponent,
  AppCheckboxComponent,
  AppDialogComponent,
  AppSelectComponent,
  AppStepperComponent,
  AppTextFieldComponent,
} from '../../shared/ui';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-register',
  standalone: true,
  imports: [
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    TranslocoModule,
    AppButtonComponent,
    AppCheckboxComponent,
    AppDialogComponent,
    AppSelectComponent,
    AppStepperComponent,
    AppTextFieldComponent,
    SanitizedHtmlPipe,
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  readonly Building2 = Building2;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly AlertCircle = AlertCircle;
  readonly CheckCircle2 = CheckCircle2;
  readonly ArrowRight = ArrowRight;
  readonly ArrowLeft = ArrowLeft;

  readonly languageService = inject(LanguageService);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private transloco = inject(TranslocoService);

  showPassword = signal(false);
  showConfirmPassword = signal(false);
  currentStep = signal(0);
  termsOpen = signal(false);
  privacyOpen = signal(false);
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
      password: ['', [Validators.required, Validators.minLength(8)]],
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

  nextCompanyStep(): void {
    if (this.companyForm.invalid) {
      this.companyForm.markAllAsTouched();
      return;
    }

    this.currentStep.set(1);
  }

  nextAdminStep(): void {
    if (this.adminForm.invalid) {
      this.adminForm.markAllAsTouched();
      return;
    }

    this.currentStep.set(2);
  }

  previousStep(): void {
    this.currentStep.update((step) => Math.max(0, step - 1));
  }

  openTerms(event: Event): void {
    event.preventDefault();
    this.termsOpen.set(true);
  }

  openPrivacy(event: Event): void {
    event.preventDefault();
    this.privacyOpen.set(true);
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
            void this.router.navigate(['/', slug, 'configuracion', 'inicio']);
          }, 1500);
        }),
        catchError((_e: unknown) => {
          this.isLoading.set(false);
          this.errorMessage.set(this.resolveRegisterError(_e));
          throw _e;
        }),
      )
      .subscribe();
  }

  /**
   * Traduce los errores del registro a un mensaje para el usuario final. El
   * backend envía un `code` estable para los errores de negocio (p. ej. nombre
   * de empresa repetido); así evitamos mostrar detalles técnicos como el slug.
   */
  private resolveRegisterError(error: unknown): string {
    const code =
      error instanceof HttpErrorResponse &&
      error.error &&
      typeof error.error === 'object' &&
      'code' in error.error
        ? (error.error as { code?: unknown }).code
        : null;

    if (code === 'COMPANY_NAME_TAKEN') {
      return this.transloco.translate('auth.companyNameTakenError');
    }

    return getApiErrorMessage(error, this.transloco.translate('auth.createAccountError'));
  }
}
