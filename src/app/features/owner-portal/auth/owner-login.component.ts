import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  Building2,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  Shield,
  Home,
  Wallet,
  FileText,
} from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

import { getApiErrorMessage } from '../../../core/http/http-error.util';
import { LanguageService } from '../../../core/services/language.service';
import { OwnerAuthService } from '../../../core/services/owner/owner-auth.service';
import { AppButtonComponent } from '../../../shared/ui/button/button.component';
import { AppCheckboxComponent } from '../../../shared/ui/checkbox/checkbox.component';
import { AppTextFieldComponent } from '../../../shared/ui/text-field/text-field.component';

@Component({
  selector: 'app-owner-login',
  standalone: true,
  imports: [
    AppButtonComponent,
    AppCheckboxComponent,
    AppTextFieldComponent,
    LucideAngularModule,
    ReactiveFormsModule,
    RouterLink,
    TranslocoModule,
  ],
  templateUrl: './owner-login.component.html',
  styleUrl: './owner-login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OwnerLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ownerAuth = inject(OwnerAuthService);
  private readonly transloco = inject(TranslocoService);
  readonly languageService = inject(LanguageService);

  readonly Building2 = Building2;
  readonly Mail = Mail;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly AlertCircle = AlertCircle;
  readonly Shield = Shield;
  readonly Home = Home;
  readonly Wallet = Wallet;
  readonly FileText = FileText;

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberMe: [true],
  });

  readonly isLoading = this.ownerAuth.isLoading;
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.errorMessage.set(this.transloco.translate('ownerPortal.auth.missingTenant'));
      return;
    }

    const value = this.form.getRawValue();
    this.errorMessage.set(null);
    this.ownerAuth.login(slug, value.email, value.password, value.rememberMe).subscribe({
      next: () => void this.router.navigate(['/', slug, 'owner']),
      error: (error: unknown) =>
        this.errorMessage.set(
          getApiErrorMessage(error, this.transloco.translate('ownerPortal.auth.loginError')),
        ),
    });
  }
}
