import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { LucideAngularModule, CreditCard, Pencil, Receipt, Trash2 } from 'lucide-angular';

import { Expense } from '../../../../core/models/expense.model';

@Component({
  selector: 'app-expense-table',
  standalone: true,
  imports: [DecimalPipe, TranslocoModule, LucideAngularModule],
  templateUrl: './expense-table.component.html',
  styleUrl: '../../expenses.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseTableComponent {
  readonly expenses = input.required<readonly Expense[]>();

  readonly editRequested = output<Expense>();
  readonly paymentRequested = output<Expense>();
  readonly deleteRequested = output<Expense>();

  readonly CreditCard = CreditCard;
  readonly Receipt = Receipt;
  readonly Pencil = Pencil;
  readonly Trash2 = Trash2;

  balance(expense: Expense): number {
    return Math.max(0, expense.amount - Number(expense.paid_amount ?? 0));
  }
}
