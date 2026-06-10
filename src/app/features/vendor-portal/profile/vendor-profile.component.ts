import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { LucideAngularModule, User, Mail, Phone, KeyRound } from 'lucide-angular';
import { TranslocoModule, provideTranslocoScope } from '@jsverse/transloco';

import { VendorAuthService } from '../../../core/services/vendor/vendor-auth.service';

@Component({
  selector: 'app-vendor-profile',
  standalone: true,
  imports: [LucideAngularModule, TranslocoModule],
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

  private readonly vendorAuth = inject(VendorAuthService);
  readonly vendor = this.vendorAuth.currentVendor;

  readonly initials = computed(() => {
    const name = this.vendor()?.name ?? '';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  });
}
