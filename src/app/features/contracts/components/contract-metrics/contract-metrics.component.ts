import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import {
  AlertTriangle,
  FileCheck2,
  FilePen,
  FileText,
  LucideAngularModule,
  TrendingUp,
  Wallet,
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
  readonly FileCheck2 = FileCheck2;
  readonly FilePen = FilePen;
  readonly Wallet = Wallet;
  readonly TrendingUp = TrendingUp;
  readonly AlertTriangle = AlertTriangle;
}
