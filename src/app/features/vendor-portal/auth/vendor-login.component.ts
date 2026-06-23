import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  LucideAngularModule,
  Wrench,
  Eye,
  EyeOff,
  AlertCircle,
  Shield,
  ClipboardList,
  CheckCircle2,
  Camera,
} from 'lucide-angular';
import { TranslocoModule, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';

import { getApiErrorMessage } from '../../../core/http/http-error.util';
import { LanguageService } from '../../../core/services/language.service';
import { VendorAuthService } from '../../../core/services/vendor/vendor-auth.service';
import { AppButtonComponent } from '../../../shared/ui/button/button.component';
import { AppTextFieldComponent } from '../../../shared/ui/text-field/text-field.component';

@Component({
  selector: 'app-vendor-login',
  standalone: true,
  imports: [
    AppButtonComponent,
    AppTextFieldComponent,
    LucideAngularModule,
    ReactiveFormsModule,
    RouterModule,
    TranslocoModule,
  ],
  providers: [provideTranslocoScope({ scope: 'vendorPortal', alias: 'vendorPortal' })],
  templateUrl: './vendor-login.component.html',
  styleUrl: './vendor-login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorLoginComponent {
  readonly Wrench = Wrench;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly AlertCircle = AlertCircle;
  readonly Shield = Shield;
  readonly ClipboardList = ClipboardList;
  readonly CheckCircle2 = CheckCircle2;
  readonly Camera = Camera;

  readonly languageService = inject(LanguageService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly vendorAuth = inject(VendorAuthService);
  private readonly transloco = inject(TranslocoService);

  readonly showPassword = signal(false);
  readonly isLoading = this.vendorAuth.isLoading;
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

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
      this.errorMessage.set(this.transloco.translate('vendorPortal.auth.missingTenant'));
      return;
    }

    const value = this.form.getRawValue();
    this.errorMessage.set(null);
    this.vendorAuth.login(slug, value.email, value.password, false).subscribe({
      next: () => void this.router.navigate(['/', slug, 'vendor']),
      error: (error: unknown) =>
        this.errorMessage.set(
          getApiErrorMessage(error, this.transloco.translate('vendorPortal.auth.loginError')),
        ),
    });
  }
}
