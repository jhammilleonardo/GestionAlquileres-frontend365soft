import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  LucideAngularModule,
  ArrowLeft,
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
} from 'lucide-angular';
import { AdminContractService } from '../../../core/services/admin/admin-contract.service';
import { SlugService } from '../../../core/services/slug.service';
import { TenantDatePipe } from '../../../shared/pipes/tenant-date.pipe';
import { TenantCurrencyPipe } from '../../../shared/pipes/tenant-currency.pipe';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { Contract, ContractStatus } from '../../../core/models/contract.model';
import { ConfirmDialogService } from '../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { AppButtonComponent } from '../../../shared/ui/button/button.component';
import { AppLoadingStateComponent } from '../../../shared/ui/loading-state/loading-state.component';

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
  providers: [provideTranslocoScope({ scope: 'contratos', alias: 'contracts' })],
  templateUrl: './contract-detail.component.html',
  styleUrl: './contract-detail.component.scss',
})
export class ContractDetailComponent {
  readonly ArrowLeft = ArrowLeft;
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

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private contractService = inject(AdminContractService);
  private slugService = inject(SlugService);
  private transloco = inject(TranslocoService);
  private confirmDialog = inject(ConfirmDialogService);
  private toast = inject(ToastService);

  isLoading = signal(true);
  currentContract = signal<Contract | null>(null);
  contractNumber = signal<string>('');
  history = signal<Contract[]>([]);

  constructor() {
    const contractId = this.route.snapshot.paramMap.get('id');
    if (contractId) {
      this.loadContract(parseInt(contractId));
    } else {
      this.isLoading.set(false);
      this.goBack();
    }
  }

  loadContract(id: number): void {
    this.contractService.getContract(id).subscribe({
      next: (contract) => {
        this.currentContract.set(contract);
        this.contractNumber.set(contract.contract_number);
        this.isLoading.set(false);
        this.loadHistory(id);
      },
      error: () => {
        this.isLoading.set(false);
        this.goBack();
      },
    });
  }

  private loadHistory(id: number): void {
    this.contractService.getContractHistory(id).subscribe({
      next: (history) => this.history.set(history),
      error: () => this.history.set([]),
    });
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

  viewHistoryContract(contract: Contract): void {
    if (this.isCurrentInHistory(contract)) return;
    const url = this.slugService.buildUrl(`/contratos/${contract.id}`);
    void this.router.navigateByUrl(url);
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
    const contract = this.currentContract();
    if (!contract) return;

    this.contractService.downloadPDF(contract.id);
  }

  editContract(): void {
    const contract = this.currentContract();
    if (!contract) return;

    const editUrl = this.slugService.buildUrl(`/contratos/${contract.id}/editar`);
    void this.router.navigateByUrl(editUrl);
  }

  async renewContract(): Promise<void> {
    const contract = this.currentContract();
    if (!contract) return;

    const confirmed = await this.confirmDialog.confirm({
      title: this.transloco.translate('contracts.detail.renew'),
      message: this.transloco.translate('contracts.detail.confirmRenew', {
        number: contract.contract_number,
      }),
      confirmLabel: this.transloco.translate('contracts.detail.renew'),
      cancelLabel: this.transloco.translate('common.cancel'),
    });

    if (!confirmed) return;

    this.contractService.renewContract(contract.id).subscribe({
      next: (response) => {
        this.toast.success(this.transloco.translate('contracts.detail.renewedSuccess'));
        const newContractUrl = this.slugService.buildUrl(`/contratos/${response.id}`);
        void this.router.navigateByUrl(newContractUrl);
      },
      error: () => {
        this.toast.error(this.transloco.translate('contracts.detail.renewError'));
      },
    });
  }

  async finalizeContract(): Promise<void> {
    const contract = this.currentContract();
    if (!contract) return;

    const confirmed = await this.confirmDialog.confirm({
      title: this.transloco.translate('contracts.detail.finalize'),
      message: this.transloco.translate('contracts.detail.confirmFinalize', {
        number: contract.contract_number,
      }),
      confirmLabel: this.transloco.translate('contracts.detail.finalize'),
      cancelLabel: this.transloco.translate('common.cancel'),
      variant: 'danger',
    });

    if (!confirmed) return;

    this.contractService
      .updateStatus(contract.id, {
        status: ContractStatus.FINALIZADO,
        reason: this.transloco.translate('contracts.detail.finalizedReason'),
      })
      .subscribe({
        next: () => {
          this.toast.success(this.transloco.translate('contracts.detail.finalizedSuccess'));
          this.loadContract(contract.id);
        },
        error: () => {
          this.toast.error(this.transloco.translate('contracts.detail.finalizeError'));
        },
      });
  }

  goBack(): void {
    const contractsUrl = this.slugService.buildUrl('/contratos');
    void this.router.navigateByUrl(contractsUrl);
  }

  getStatusClass(status: ContractStatus): string {
    return `status-${status.toLowerCase()}`;
  }
}
