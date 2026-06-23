import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideAngularModule, Plus } from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ContractStatus } from '../../core/models/contract.model';
import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { AppPageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { AppSelectOption } from '../../shared/ui/select/select.component';
import { AppStatusTone } from '../../shared/ui/status-badge/status-badge.component';
import { ContractFiltersComponent } from './components/contract-filters/contract-filters.component';
import { ContractListComponent } from './components/contract-list/contract-list.component';
import { ContractMetricsComponent } from './components/contract-metrics/contract-metrics.component';
import { ContractsFacade } from './contracts.facade';

@Component({
  selector: 'app-contracts',
  standalone: true,
  imports: [
    LucideAngularModule,
    TranslocoModule,
    AppButtonComponent,
    AppPageHeaderComponent,
    ContractFiltersComponent,
    ContractListComponent,
    ContractMetricsComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'contratos', alias: 'contracts' }), ContractsFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contracts.component.html',
  styleUrl: './contracts.component.scss',
})
export class ContractsComponent {
  readonly Plus = Plus;
  readonly ContractStatus = ContractStatus;

  readonly facade = inject(ContractsFacade);

  readonly statusFilterOptions: readonly AppSelectOption<string>[] = [
    { value: '', label: 'Todos los estados' },
    { value: ContractStatus.BORRADOR, label: 'Borrador' },
    { value: ContractStatus.ACTIVO, label: 'Activo' },
    { value: ContractStatus.FINALIZADO, label: 'Finalizado' },
  ];

  constructor() {
    this.facade.init();
  }

  getStatusTone(status: ContractStatus): AppStatusTone {
    switch (status) {
      case ContractStatus.ACTIVO:
        return 'success';
      case ContractStatus.BORRADOR:
        return 'warning';
      case ContractStatus.FINALIZADO:
        return 'neutral';
      default:
        return 'info';
    }
  }
}
