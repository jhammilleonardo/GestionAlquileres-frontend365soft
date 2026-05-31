import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Plus,
  FileText,
  Search,
  RefreshCw,
  X,
  CheckCircle2,
  Pencil,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Eye,
  Download,
  RotateCcw,
  Home,
  Calendar,
  ArrowRight,
  User,
} from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { TenantDatePipe } from '../../shared/pipes/tenant-date.pipe';
import { TenantCurrencyPipe } from '../../shared/pipes/tenant-currency.pipe';
import { ContractStatus } from '../../core/models/contract.model';
import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { AppLoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { AppPageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { AppSelectComponent, AppSelectOption } from '../../shared/ui/select/select.component';
import {
  AppStatusBadgeComponent,
  AppStatusTone,
} from '../../shared/ui/status-badge/status-badge.component';
import { AppTextFieldComponent } from '../../shared/ui/text-field/text-field.component';
import { ContratosFacade } from './contratos.facade';

@Component({
  selector: 'app-contratos',
  standalone: true,
  imports: [
    RouterModule,
    FormsModule,
    LucideAngularModule,
    TranslocoModule,
    TenantDatePipe,
    TenantCurrencyPipe,
    AppButtonComponent,
    AppLoadingStateComponent,
    AppPageHeaderComponent,
    AppSelectComponent,
    AppStatusBadgeComponent,
    AppTextFieldComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'contratos', alias: 'contracts' }), ContratosFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contratos.component.html',
  styleUrl: './contratos.component.scss',
})
export class ContratosComponent {
  readonly Plus = Plus;
  readonly FileText = FileText;
  readonly Search = Search;
  readonly RefreshCw = RefreshCw;
  readonly X = X;
  readonly CheckCircle2 = CheckCircle2;
  readonly Pencil = Pencil;
  readonly DollarSign = DollarSign;
  readonly TrendingUp = TrendingUp;
  readonly AlertTriangle = AlertTriangle;
  readonly Eye = Eye;
  readonly Download = Download;
  readonly RotateCcw = RotateCcw;
  readonly Home = Home;
  readonly Calendar = Calendar;
  readonly ArrowRight = ArrowRight;
  readonly User = User;
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
