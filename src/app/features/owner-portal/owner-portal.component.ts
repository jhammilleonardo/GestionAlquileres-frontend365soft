import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { forkJoin, finalize } from 'rxjs';
import { LucideAngularModule, Download, CheckCircle2, Home, User, Calendar } from 'lucide-angular';

import {
  OwnerDashboard,
  OwnerPortalRecord,
  OwnerPortalService,
} from '../../core/services/owner/owner-portal.service';
import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { AppEmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AppLoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { AppPageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { AppStatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { ToastService } from '../../shared/ui/toast/toast.service';

type OwnerTab = 'properties' | 'statements' | 'maintenance' | 'contracts';

@Component({
  selector: 'app-owner-portal',
  standalone: true,
  imports: [
    CurrencyPipe,
    LucideAngularModule,
    AppButtonComponent,
    AppEmptyStateComponent,
    AppLoadingStateComponent,
    AppPageHeaderComponent,
    AppStatusBadgeComponent,
  ],
  templateUrl: './owner-portal.component.html',
  styleUrl: './owner-portal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OwnerPortalComponent {
  private readonly ownerPortal = inject(OwnerPortalService);
  private readonly toast = inject(ToastService);

  readonly Download = Download;
  readonly CheckCircle2 = CheckCircle2;
  readonly Home = Home;
  readonly User = User;
  readonly Calendar = Calendar;

  // Etapas del pipeline de mantenimiento para el timeline visual
  readonly stages = ['REPORTED', 'ASSIGNED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'];

  readonly tabs: { id: OwnerTab; label: string }[] = [
    { id: 'properties', label: 'Propiedades' },
    { id: 'statements', label: 'Liquidaciones' },
    { id: 'maintenance', label: 'Mantenimiento' },
    { id: 'contracts', label: 'Documentos' },
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

  constructor() {
    this.load();
  }

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
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return '';
  }

  num(record: OwnerPortalRecord, key: string): number {
    return Number(record[key] ?? 0);
  }

  /** Índice de la etapa actual dentro del pipeline (para el timeline). */
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
        this.toast.success('Gasto autorizado');
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
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `liquidacion_${record.id}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.downloadingId.set(null);
        this.toast.error('No se pudo descargar el PDF');
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
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `contrato_${this.str(record, 'contract_number') || record.id}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      },
      error: (error: Error) => {
        this.downloadingContractId.set(null);
        this.toast.error(error.message || 'No se pudo descargar el contrato');
      },
    });
  }
}
