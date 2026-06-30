import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  LucideAngularModule,
  User,
  Mail,
  Phone,
  KeyRound,
  Star,
  ShieldCheck,
  BadgeCheck,
  Wallet,
} from 'lucide-angular';
import { TranslocoModule, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';

import { getApiErrorMessage } from '../../../core/http/http-error.util';
import { VendorProfileService } from '../../../core/services/vendor/vendor-profile.service';
import { AppButtonComponent } from '../../../shared/ui/button/button.component';
import { AppTextFieldComponent } from '../../../shared/ui/text-field/text-field.component';
import { TenantCurrencyPipe } from '../../../shared/pipes/tenant-currency.pipe';
import { ToastService } from '../../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-vendor-profile',
  standalone: true,
  imports: [
    LucideAngularModule,
    TranslocoModule,
    ReactiveFormsModule,
    AppButtonComponent,
    AppTextFieldComponent,
    TenantCurrencyPipe,
    DatePipe,
  ],
  providers: [provideTranslocoScope({ scope: 'vendorPortal', alias: 'vendorPortal' })],
  templateUrl: './vendor-profile.component.html',
  styleUrl: './vendor-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorProfileComponent {
  readonly User = User;
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly KeyRound = KeyRound;
  readonly Star = Star;
  readonly ShieldCheck = ShieldCheck;
  readonly BadgeCheck = BadgeCheck;
  readonly Wallet = Wallet;
  readonly stars = [1, 2, 3, 4, 5];

  private readonly profileService = inject(VendorProfileService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly vendor = this.profileService.profile;
  readonly saving = signal(false);

  readonly form = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  readonly initials = computed(() => {
    const name = this.vendor()?.name ?? '';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  });

  /** Estado del seguro: ok | soon (≤30 días) | expired | none. */
  readonly insuranceStatus = computed<'ok' | 'soon' | 'expired' | 'none'>(() => {
    const date = this.vendor()?.insurance_expires_at;
    if (!date) return 'none';
    const days = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
    if (days < 0) return 'expired';
    if (days <= 30) return 'soon';
    return 'ok';
  });

  constructor() {
    this.profileService.load();
  }

  filledStars(rating: number | null | undefined): number {
    return Math.round(rating ?? 0);
  }

  changePassword(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { currentPassword, newPassword, confirmPassword } = this.form.getRawValue();
    if (newPassword !== confirmPassword) {
      this.toast.error(this.transloco.translate('vendorPortal.security.mismatch'));
      return;
    }

    this.saving.set(true);
    this.profileService
      .changePassword({ currentPassword: currentPassword!, newPassword: newPassword! })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.form.reset();
          this.toast.success(this.transloco.translate('vendorPortal.security.success'));
        },
        error: (err: unknown) => {
          this.saving.set(false);
          this.toast.error(
            getApiErrorMessage(err, this.transloco.translate('vendorPortal.security.error')),
          );
        },
      });
  }
}
