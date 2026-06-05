import { computed, inject, Injectable, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { finalize, forkJoin } from 'rxjs';

import {
  OwnerDashboard,
  OwnerPortalRecord,
  OwnerPortalService,
} from '../../core/services/owner/owner-portal.service';
import { FileDownloadService } from '../../core/services/file-download.service';
import { ToastService } from '../../shared/ui/toast/toast.service';

export type OwnerTab = 'properties' | 'statements' | 'maintenance' | 'contracts';

@Injectable()
export class OwnerPortalFacade {
  private readonly ownerPortal = inject(OwnerPortalService);
  private readonly fileDownload = inject(FileDownloadService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly stages = ['REPORTED', 'ASSIGNED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'];
  readonly tabs: { id: OwnerTab; labelKey: string }[] = [
    { id: 'properties', labelKey: 'ownerPortal.tabs.properties' },
    { id: 'statements', labelKey: 'ownerPortal.tabs.statements' },
    { id: 'maintenance', labelKey: 'ownerPortal.tabs.maintenance' },
    { id: 'contracts', labelKey: 'ownerPortal.tabs.contracts' },
  ];

  readonly isLoading = signal(true);
  readonly activeTab = signal<OwnerTab>('properties');
  readonly dashboard = signal<OwnerDashboard>({});
  readonly properties = signal<OwnerPortalRecord[]>([]);
  readonly statements = signal<OwnerPortalRecord[]>([]);
  readonly maintenance = signal<OwnerPortalRecord[]>([]);
  readonly contracts = signal<OwnerPortalRecord[]>([]);
  readonly downloadingId = signal<number | null>(null);
  readonly downloadingContractId = signal<number | null>(null);
  readonly authorizingId = signal<number | null>(null);

  readonly activeCount = computed(() => {
    switch (this.activeTab()) {
      case 'properties':
        return this.properties().length;
      case 'statements':
        return this.statements().length;
      case 'maintenance':
        return this.maintenance().length;
      case 'contracts':
        return this.contracts().length;
    }
  });

  load(): void {
    this.isLoading.set(true);
    forkJoin({
      dashboard: this.ownerPortal.getDashboard(),
      properties: this.ownerPortal.getProperties(),
      statements: this.ownerPortal.getStatements(),
      maintenance: this.ownerPortal.getMaintenance(),
      contracts: this.ownerPortal.getContracts(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ dashboard, properties, statements, maintenance, contracts }) => {
          this.dashboard.set(dashboard);
          this.properties.set(properties);
          this.statements.set(statements);
          this.maintenance.set(maintenance);
          this.contracts.set(contracts);
        },
        error: (error: Error) => this.toast.error(error.message),
      });
  }

  str(record: OwnerPortalRecord, key: string): string {
    const value = record[key];
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '';
  }

  num(record: OwnerPortalRecord, key: string): number {
    return Number(record[key] ?? 0);
  }

  stageIndex(record: OwnerPortalRecord): number {
    return this.stages.indexOf(this.str(record, 'current_stage'));
  }

  canAuthorize(record: OwnerPortalRecord): boolean {
    return this.str(record, 'current_stage') === 'SCHEDULED';
  }

  authorize(record: OwnerPortalRecord): void {
    this.authorizingId.set(record.id);
    this.ownerPortal.authorizeMaintenance(record.id).subscribe({
      next: () => {
        this.authorizingId.set(null);
        this.toast.success(this.transloco.translate('ownerPortal.maintenance.authorized'));
        this.load();
      },
      error: (error: Error) => {
        this.authorizingId.set(null);
        this.toast.error(error.message);
      },
    });
  }

  downloadStatement(record: OwnerPortalRecord): void {
    this.downloadingId.set(record.id);
    this.ownerPortal.downloadStatementPdf(record.id).subscribe({
      next: (blob) => {
        this.downloadingId.set(null);
        this.downloadBlob(blob, `liquidacion_${record.id}.pdf`);
      },
      error: () => {
        this.downloadingId.set(null);
        this.toast.error(this.transloco.translate('ownerPortal.documents.downloadPdfError'));
      },
    });
  }

  hasContractPdf(record: OwnerPortalRecord): boolean {
    return Boolean(this.str(record, 'pdf_url'));
  }

  downloadContract(record: OwnerPortalRecord): void {
    this.downloadingContractId.set(record.id);
    this.ownerPortal.downloadContractPdf(record).subscribe({
      next: (blob) => {
        this.downloadingContractId.set(null);
        this.downloadBlob(blob, `contrato_${this.str(record, 'contract_number') || record.id}.pdf`);
      },
      error: (error: Error) => {
        this.downloadingContractId.set(null);
        this.toast.error(
          error.message || this.transloco.translate('ownerPortal.documents.downloadContractError'),
        );
      },
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    this.fileDownload.downloadBlob(blob, filename);
  }
}
