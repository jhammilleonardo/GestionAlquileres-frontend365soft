import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import {
  AlertTriangle,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  LucideAngularModule,
} from 'lucide-angular';

import { FormatService } from '../../../../core/services/format.service';
import { LongTermContractLedger, LongTermPaymentMonth } from '../../payments.facade';

@Component({
  selector: 'app-long-term-ledger-panel',
  standalone: true,
  imports: [LucideAngularModule, TranslocoModule],
  templateUrl: './long-term-ledger-panel.component.html',
  styleUrl: './long-term-ledger-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LongTermLedgerPanelComponent {
  readonly ledgers = input<readonly LongTermContractLedger[]>([]);
  readonly debtTotal = input(0);
  readonly overdueMonths = input(0);

  readonly AlertTriangle = AlertTriangle;
  readonly CalendarDays = CalendarDays;
  readonly CircleDollarSign = CircleDollarSign;
  readonly Clock3 = Clock3;

  private readonly formatService = inject(FormatService);

  formatCurrency(amount: number, currency?: string): string {
    return this.formatService.formatCurrency(amount, currency);
  }

  formatDate(date: Date | string): string {
    if (typeof date === 'string') {
      const dateOnly = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
      if (dateOnly) {
        const [, year, month, day] = dateOnly;
        return this.formatService.formatDate(
          new Date(Number(year), Number(month) - 1, Number(day)),
        );
      }
    }
    return this.formatService.formatDate(date);
  }

  trackMonth(_index: number, month: LongTermPaymentMonth): string {
    return `${month.label}-${month.dueDate.toISOString()}`;
  }
}
