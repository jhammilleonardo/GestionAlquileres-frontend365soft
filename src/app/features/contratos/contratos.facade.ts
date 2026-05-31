import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AdminContractService } from '../../core/services/admin/admin-contract.service';
import { SlugService } from '../../core/services/slug.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { Contract, ContractFilters, ContractStatus } from '../../core/models/contract.model';

@Injectable()
export class ContratosFacade {
  private readonly contractService = inject(AdminContractService);
  private readonly router = inject(Router);
  private readonly slugService = inject(SlugService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);

  readonly isLoading = this.contractService.isLoading;
  readonly contracts = this.contractService.contracts;
  readonly dashboard = this.contractService.dashboard;

  readonly searchTerm = signal('');
  readonly statusFilter = signal('');

  get searchTermValue(): string {
    return this.searchTerm();
  }
  set searchTermValue(v: string) {
    this.searchTerm.set(v);
  }

  get statusFilterValue(): string {
    return this.statusFilter();
  }
  set statusFilterValue(v: string) {
    this.statusFilter.set(v);
  }

  readonly filteredContracts = computed<Contract[]>(() => {
    const term = this.searchTerm().toLowerCase();
    return this.contracts().filter((c) => {
      if (
        term &&
        !c.tenant?.name?.toLowerCase().includes(term) &&
        !c.tenant?.email?.toLowerCase().includes(term) &&
        !c.property?.title?.toLowerCase().includes(term) &&
        !c.contract_number?.toLowerCase().includes(term)
      ) {
        return false;
      }
      return true;
    });
  });

  readonly hasActiveFilters = computed(
    () => Boolean(this.statusFilter()) || Boolean(this.searchTerm()),
  );

  init(): void {
    this.loadContracts();
    this.contractService.loadDashboard();
  }

  loadContracts(): void {
    const filters: ContractFilters = {};
    if (this.statusFilter()) filters.status = this.statusFilter() as ContractStatus;
    this.contractService.loadContracts(filters);
  }

  onStatusChange(value: string): void {
    this.statusFilter.set(value);
    this.loadContracts();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.statusFilter.set('');
    this.loadContracts();
  }

  createContract(): void {
    void this.router.navigateByUrl(this.slugService.buildUrl('/contratos/nuevo'));
  }

  buildDetailUrl(id: number): string {
    return this.slugService.buildUrl(`/contratos/${id}`);
  }

  buildEditUrl(id: number): string {
    return this.slugService.buildUrl(`/contratos/${id}/editar`);
  }

  downloadPDF(id: number): void {
    this.contractService.downloadPDF(id);
  }

  async renewContract(id: number): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Renovar contrato',
      message: 'Se creará un nuevo contrato basado en el contrato actual.',
      confirmLabel: 'Renovar',
    });
    if (!confirmed) return;

    this.contractService.renewContract(id).subscribe({
      next: (response) => {
        this.toast.success('Contrato renovado exitosamente');
        void this.router.navigateByUrl(this.slugService.buildUrl(`/contratos/${response.id}`));
      },
      error: () => this.toast.error('Error al renovar el contrato'),
    });
  }
}
