import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { LucideAngularModule, Mail, Pencil, Phone, Star, Trash2, Wrench } from 'lucide-angular';

import { Vendor } from '../../../../core/models/vendor.model';
import { AppStatusBadgeComponent } from '../../../../shared/ui/status-badge/status-badge.component';

@Component({
  selector: 'app-vendor-list',
  standalone: true,
  imports: [AppStatusBadgeComponent, DecimalPipe, LucideAngularModule, TranslocoModule],
  templateUrl: './vendor-list.component.html',
  styleUrl: '../../vendors.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorListComponent {
  readonly vendors = input.required<readonly Vendor[]>();
  readonly detailRequested = output<Vendor>();
  readonly editRequested = output<{ vendor: Vendor; event: Event }>();
  readonly deactivateRequested = output<{ vendor: Vendor; event: Event }>();

  readonly Star = Star;
  readonly Phone = Phone;
  readonly Mail = Mail;
  readonly Pencil = Pencil;
  readonly Trash2 = Trash2;
  readonly Wrench = Wrench;
  readonly stars = [1, 2, 3, 4, 5];

  protected filledStars(rating: number | null | undefined): number {
    return Math.round(rating ?? 0);
  }
}
