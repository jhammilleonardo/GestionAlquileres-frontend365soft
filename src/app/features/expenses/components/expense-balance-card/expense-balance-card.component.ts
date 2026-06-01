import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { LucideAngularModule, TrendingDown, TrendingUp } from 'lucide-angular';

@Component({
  selector: 'app-expense-balance-card',
  standalone: true,
  imports: [DecimalPipe, TranslocoModule, LucideAngularModule],
  templateUrl: './expense-balance-card.component.html',
  styleUrl: '../../expenses.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseBalanceCardComponent {
  readonly totalIncome = input.required<number>();
  readonly totalExpenses = input.required<number>();
  readonly netResult = input.required<number>();

  readonly TrendingUp = TrendingUp;
  readonly TrendingDown = TrendingDown;
}
