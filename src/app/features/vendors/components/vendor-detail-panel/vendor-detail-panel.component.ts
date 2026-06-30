import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { LucideAngularModule, CheckCircle2, Copy, Link as LinkIcon, Star, X } from 'lucide-angular';

import { Vendor, VendorHistoryItem, VendorInvite } from '../../../../core/models/vendor.model';
import { TenantCurrencyPipe } from '../../../../shared/pipes/tenant-currency.pipe';
import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { AppEmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { AppLoadingStateComponent } from '../../../../shared/ui/loading-state/loading-state.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-vendor-detail-panel',
  standalone: true,
  imports: [
    AppButtonComponent,
    AppEmptyStateComponent,
    AppLoadingStateComponent,
    DatePipe,
    LucideAngularModule,
    TenantCurrencyPipe,
    TranslocoModule,
  ],
  templateUrl: './vendor-detail-panel.component.html',
  styleUrl: '../../vendors.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorDetailPanelComponent {
  readonly vendor = input.required<Vendor>();
  readonly history = input.required<readonly VendorHistoryItem[]>();
  readonly historyLoading = input(false);
  readonly inviting = input(false);
  readonly inviteResult = input<VendorInvite | null>(null);
  readonly closed = output<void>();
  readonly inviteRequested = output<void>();

  readonly Star = Star;
  readonly X = X;
  readonly CheckCircle2 = CheckCircle2;
  readonly Copy = Copy;
  readonly LinkIcon = LinkIcon;
  readonly stars = [1, 2, 3, 4, 5];

  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);
  protected readonly copied = signal(false);

  protected filledStars(rating: number | null | undefined): number {
    return Math.round(rating ?? 0);
  }

  protected async copyInviteUrl(url: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(url);
      this.copied.set(true);
      this.toast.success(this.transloco.translate('vendors.invite.copied'));
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      // Si el navegador bloquea el portapapeles, el enlace sigue visible para
      // copiarlo a mano: avisamos en vez de fallar en silencio.
      this.toast.error(this.transloco.translate('vendors.invite.copyError'));
    }
  }
}
