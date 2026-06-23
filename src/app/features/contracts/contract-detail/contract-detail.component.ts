import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  LucideAngularModule,
  ArrowLeft,
  ArrowRight,
  Download,
  Edit,
  RefreshCw,
  XCircle,
  Check,
  CheckCircle2,
  Mail,
  Phone,
  TrendingUp,
  Clock,
  Repeat,
  Bell,
  LineChart,
  FileText,
} from 'lucide-angular';
import { TenantDatePipe } from '../../../shared/pipes/tenant-date.pipe';
import { TenantCurrencyPipe } from '../../../shared/pipes/tenant-currency.pipe';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import {
  Contract,
  ContractStatus,
  contractStatusLabelKey,
} from '../../../core/models/contract.model';
import { AppButtonComponent } from '../../../shared/ui/button/button.component';
import { AppLoadingStateComponent } from '../../../shared/ui/loading-state/loading-state.component';
import { ContractDetailFacade } from './contract-detail.facade';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-contract-detail',
  standalone: true,
  imports: [
    LucideAngularModule,
    TranslocoModule,
    TenantDatePipe,
    TenantCurrencyPipe,
    AppButtonComponent,
    AppLoadingStateComponent,
  ],
  providers: [
    provideTranslocoScope({ scope: 'contratos', alias: 'contracts' }),
    ContractDetailFacade,
  ],
  templateUrl: './contract-detail.component.html',
  styleUrl: './contract-detail.component.scss',
})
export class ContractDetailComponent {
  readonly ArrowLeft = ArrowLeft;
  readonly ArrowRight = ArrowRight;
  readonly FileText = FileText;
  readonly Download = Download;
  readonly Edit = Edit;
  readonly RefreshCw = RefreshCw;
  readonly XCircle = XCircle;
  readonly Check = Check;
  readonly CheckCircle2 = CheckCircle2;
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly TrendingUp = TrendingUp;
  readonly Clock = Clock;
  readonly Repeat = Repeat;
  readonly Bell = Bell;
  readonly LineChart = LineChart;
  readonly ContractStatus = ContractStatus;

  private route = inject(ActivatedRoute);
  protected readonly facade = inject(ContractDetailFacade);

  readonly isLoading = this.facade.isLoading;
  readonly currentContract = this.facade.currentContract;
  readonly contractNumber = this.facade.contractNumber;
  readonly history = this.facade.history;
  readonly previousContract = this.facade.previousContract;
  readonly renewalContract = this.facade.renewalContract;

  constructor() {
    const contractId = this.route.snapshot.paramMap.get('id');
    if (contractId) {
      this.loadContract(parseInt(contractId));
    } else {
      this.goBack();
    }
  }

  loadContract(id: number): void {
    this.facade.loadContract(id);
  }

  /** Tono visual de cada estado del contrato para el timeline. */
  getStatusTone(status: ContractStatus): 'active' | 'warning' | 'expired' | 'renewed' | 'neutral' {
    switch (status) {
      case ContractStatus.ACTIVO:
      case ContractStatus.FIRMADO:
        return 'active';
      case ContractStatus.POR_VENCER:
        return 'warning';
      case ContractStatus.VENCIDO:
      case ContractStatus.CANCELADO:
        return 'expired';
      case ContractStatus.RENOVADO:
        return 'renewed';
      default:
        return 'neutral';
    }
  }

  isCurrentInHistory(contract: Contract): boolean {
    return contract.id === this.currentContract()?.id;
  }

  /** Clave de traducción del estado (distingue el borrador de renovación). */
  statusLabelKey(contract: Contract): string {
    return contractStatusLabelKey(contract);
  }

  viewHistoryContract(contract: Contract): void {
    this.facade.viewHistoryContract(contract);
  }

  canActivate(): boolean {
    const contract = this.currentContract();
    return contract?.status === ContractStatus.BORRADOR || false;
  }

  canEdit(): boolean {
    const contract = this.currentContract();
    return contract?.status === ContractStatus.BORRADOR || false;
  }

  canRenew(): boolean {
    const contract = this.currentContract();
    return (
      contract?.status === ContractStatus.ACTIVO ||
      contract?.status === ContractStatus.FINALIZADO ||
      false
    );
  }

  canFinalize(): boolean {
    const contract = this.currentContract();
    return contract?.status === ContractStatus.ACTIVO || false;
  }

  hasConditions(): boolean {
    const contract = this.currentContract();
    return Boolean(
      contract?.late_fee_percentage ||
      contract?.grace_days ||
      contract?.auto_renew !== undefined ||
      contract?.renewal_notice_days ||
      contract?.auto_increase_percentage ||
      (contract?.included_services && contract.included_services.length > 0),
    );
  }

  hasTerms(): boolean {
    const contract = this.currentContract();
    return Boolean(
      contract?.tenant_responsibilities ||
      contract?.owner_responsibilities ||
      contract?.prohibitions ||
      contract?.coexistence_rules ||
      contract?.renewal_terms ||
      contract?.termination_terms ||
      contract?.jurisdiction,
    );
  }

  hasBankInfo(): boolean {
    const contract = this.currentContract();
    return Boolean(
      contract?.bank_name ||
      contract?.bank_account_type ||
      contract?.bank_account_number ||
      contract?.bank_account_holder,
    );
  }

  hasSignatures(): boolean {
    const contract = this.currentContract();
    return Boolean(contract?.owner_signature_date || contract?.tenant_signature_date);
  }

  downloadPDF(): void {
    this.facade.downloadPDF();
  }

  editContract(): void {
    this.facade.editContract();
  }

  async renewContract(): Promise<void> {
    await this.facade.renewContract();
  }

  async finalizeContract(): Promise<void> {
    await this.facade.finalizeContract();
  }

  goBack(): void {
    this.facade.goBack();
  }

  getStatusClass(status: ContractStatus): string {
    return `status-${status.toLowerCase()}`;
  }
}
