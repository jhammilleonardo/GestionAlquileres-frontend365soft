import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { LucideAngularModule, Star, X } from 'lucide-angular';

import { Vendor, VendorHistoryItem } from '../../../../core/models/vendor.model';
import { AppEmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { AppLoadingStateComponent } from '../../../../shared/ui/loading-state/loading-state.component';

@Component({
  selector: 'app-vendor-detail-panel',
  standalone: true,
  imports: [AppEmptyStateComponent, AppLoadingStateComponent, LucideAngularModule, TranslocoModule],
  templateUrl: './vendor-detail-panel.component.html',
  styleUrl: '../../vendors.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorDetailPanelComponent {
  readonly vendor = input.required<Vendor>();
  readonly history = input.required<readonly VendorHistoryItem[]>();
  readonly historyLoading = input(false);
  readonly closed = output<void>();

  readonly Star = Star;
  readonly X = X;
  readonly stars = [1, 2, 3, 4, 5];

  protected filledStars(rating: number | null | undefined): number {
    return Math.round(rating ?? 0);
  }
}
