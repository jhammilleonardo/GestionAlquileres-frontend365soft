import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { LucideAngularModule, CheckCircle2, KeyRound, Star, X } from 'lucide-angular';

import { Vendor, VendorHistoryItem } from '../../../../core/models/vendor.model';
import { SlugService } from '../../../../core/services/slug.service';
import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { AppEmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { AppLoadingStateComponent } from '../../../../shared/ui/loading-state/loading-state.component';

@Component({
  selector: 'app-vendor-detail-panel',
  standalone: true,
  imports: [
    AppButtonComponent,
    AppEmptyStateComponent,
    AppLoadingStateComponent,
    LucideAngularModule,
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
  readonly creatingAccount = input(false);
  readonly accountCredentials = input<{ email: string; temporaryPassword: string } | null>(null);
  readonly closed = output<void>();
  readonly accountRequested = output<void>();

  readonly Star = Star;
  readonly X = X;
  readonly KeyRound = KeyRound;
  readonly CheckCircle2 = CheckCircle2;
  readonly stars = [1, 2, 3, 4, 5];

  private readonly slugService = inject(SlugService);

  readonly loginUrl = computed(() => {
    const slug = this.slugService.getSlug();
    return slug ? `/${slug}/vendor/login` : '/vendor/login';
  });

  protected filledStars(rating: number | null | undefined): number {
    return Math.round(rating ?? 0);
  }
}
