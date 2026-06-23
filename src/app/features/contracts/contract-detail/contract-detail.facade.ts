import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AdminContractService } from '../../../core/services/admin/admin-contract.service';
import { SlugService } from '../../../core/services/slug.service';
import { Contract, ContractStatus } from '../../../core/models/contract.model';
import { ConfirmDialogService } from '../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { TranslocoService } from '@jsverse/transloco';

@Injectable()
export class ContractDetailFacade {
  private readonly router = inject(Router);
  private readonly contractService = inject(AdminContractService);
  private readonly slugService = inject(SlugService);
  private readonly transloco = inject(TranslocoService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);

  readonly isLoading = signal(true);
  readonly currentContract = signal<Contract | null>(null);
  readonly contractNumber = signal('');
  readonly history = signal<Contract[]>([]);

  /** Contrato del que proviene esta renovación (el firmado anterior), si existe. */
  readonly previousContract = computed<Contract | null>(() => {
    const previousId = this.currentContract()?.previous_contract_id;
    if (!previousId) return null;
    return this.history().find((contract) => contract.id === previousId) ?? null;
  });

  /** Contrato de renovación generado a partir de este (el nuevo), si existe. */
  readonly renewalContract = computed<Contract | null>(() => {
    const currentId = this.currentContract()?.id;
    if (!currentId) return null;
    return this.history().find((contract) => contract.previous_contract_id === currentId) ?? null;
  });

  loadContract(id: number): void {
    this.isLoading.set(true);
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

  loadHistory(id: number): void {
    this.contractService.getContractHistory(id).subscribe({
      next: (history) => this.history.set(history),
      error: () => this.history.set([]),
    });
  }

  downloadPDF(): void {
    const contract = this.currentContract();
    if (!contract) return;
    this.contractService.downloadPDF(contract.id);
  }

  editContract(): void {
    const contract = this.currentContract();
    if (!contract) return;
    void this.router.navigateByUrl(this.slugService.buildUrl(`/contratos/${contract.id}/editar`));
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
        void this.router.navigateByUrl(this.slugService.buildUrl(`/contratos/${response.id}`));
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
    void this.router.navigateByUrl(this.slugService.buildUrl('/contratos'));
  }

  viewHistoryContract(contract: Contract): void {
    if (contract.id === this.currentContract()?.id) return;
    void this.router.navigateByUrl(this.slugService.buildUrl(`/contratos/${contract.id}`));
  }
}
