import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { AlertTriangle, CalendarCheck2, LucideAngularModule, WalletCards } from 'lucide-angular';

import { AdminShortTermLedger } from '../../../../core/services/admin/payment.service';
import { FormatService } from '../../../../core/services/format.service';

@Component({
  selector: 'app-short-term-ledger-panel',
  standalone: true,
  imports: [LucideAngularModule, TranslocoModule],
  templateUrl: './short-term-ledger-panel.component.html',
  styleUrl: './short-term-ledger-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShortTermLedgerPanelComponent {
  readonly reservations = input<readonly AdminShortTermLedger[]>([]);
  readonly balanceTotal = input(0);
  readonly pendingReviewTotal = input(0);

  readonly AlertTriangle = AlertTriangle;
  readonly CalendarCheck2 = CalendarCheck2;
  readonly WalletCards = WalletCards;

  private readonly formatService = inject(FormatService);

  formatCurrency(amount: number, currency?: string): string {
    return this.formatService.formatCurrency(amount, currency);
  }

  formatDate(value: string): string {
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (dateOnly) {
      const [, year, month, day] = dateOnly;
      return this.formatService.formatDate(new Date(Number(year), Number(month) - 1, Number(day)));
    }
    return this.formatService.formatDate(value);
  }

  alertKey(alert: AdminShortTermLedger['alert']): string {
    return `payments.shortTerm.alert.${alert}`;
  }

  trackReservation(_index: number, reservation: AdminShortTermLedger): number {
    return reservation.reservation_id;
  }
}
