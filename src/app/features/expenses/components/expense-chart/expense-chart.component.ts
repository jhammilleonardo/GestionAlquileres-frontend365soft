import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

import { ChartBar } from '../../expenses.facade';

@Component({
  selector: 'app-expense-chart',
  standalone: true,
  imports: [DecimalPipe, TranslocoModule],
  templateUrl: './expense-chart.component.html',
  styleUrl: '../../expenses.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseChartComponent {
  readonly bars = input.required<readonly ChartBar[]>();
}
