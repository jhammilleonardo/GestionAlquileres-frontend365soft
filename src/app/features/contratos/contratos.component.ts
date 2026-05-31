import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Plus,
  FileText,
  RefreshCw,
  X,
  CheckCircle2,
  Pencil,
  DollarSign,
  TrendingUp,
  AlertTriangle,
} from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { TenantCurrencyPipe } from '../../shared/pipes/tenant-currency.pipe';
import { ContractStatus } from '../../core/models/contract.model';
import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { AppLoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { AppPageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { AppSelectComponent, AppSelectOption } from '../../shared/ui/select/select.component';
import { AppStatusTone } from '../../shared/ui/status-badge/status-badge.component';
import { AppTextFieldComponent } from '../../shared/ui/text-field/text-field.component';
import { ContractListComponent } from './components/contract-list/contract-list.component';
import { ContratosFacade } from './contratos.facade';

@Component({
  selector: 'app-contratos',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    TranslocoModule,
    TenantCurrencyPipe,
    AppButtonComponent,
    AppLoadingStateComponent,
    AppPageHeaderComponent,
    AppSelectComponent,
    AppTextFieldComponent,
    ContractListComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'contratos', alias: 'contracts' }), ContratosFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contratos.component.html',
  styleUrl: './contratos.component.scss',
})
export class ContratosComponent {
  readonly Plus = Plus;
  readonly FileText = FileText;
  readonly RefreshCw = RefreshCw;
  readonly X = X;
  readonly CheckCircle2 = CheckCircle2;
  readonly Pencil = Pencil;
  readonly DollarSign = DollarSign;
  readonly TrendingUp = TrendingUp;
  readonly AlertTriangle = AlertTriangle;
  readonly ContractStatus = ContractStatus;

  readonly facade = inject(ContratosFacade);

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
