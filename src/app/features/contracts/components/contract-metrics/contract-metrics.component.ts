import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import {
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  FileText,
  LucideAngularModule,
  Pencil,
  TrendingUp,
} from 'lucide-angular';

import { ContractDashboard } from '../../../../core/models/contract.model';
import { TenantCurrencyPipe } from '../../../../shared/pipes/tenant-currency.pipe';

@Component({
  selector: 'app-contract-metrics',
  standalone: true,
  imports: [TranslocoModule, LucideAngularModule, TenantCurrencyPipe],
  templateUrl: './contract-metrics.component.html',
  styleUrl: '../../contracts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContractMetricsComponent {
  readonly dashboard = input.required<ContractDashboard>();

  readonly FileText = FileText;
  readonly CheckCircle2 = CheckCircle2;
  readonly Pencil = Pencil;
  readonly DollarSign = DollarSign;
  readonly TrendingUp = TrendingUp;
  readonly AlertTriangle = AlertTriangle;
}
