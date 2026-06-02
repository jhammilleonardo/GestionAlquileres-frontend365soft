import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

import { Contract } from '../../../../core/models/contract.model';

@Component({
  selector: 'app-contract-readonly-summary',
  standalone: true,
  imports: [TranslocoModule],
  templateUrl: './contract-readonly-summary.component.html',
  styleUrl: './contract-readonly-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContractReadonlySummaryComponent {
  readonly contract = input.required<Contract>();
}
