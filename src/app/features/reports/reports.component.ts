import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { finalize } from 'rxjs';

import {
  AdminOperationsService,
  ApiRecord,
  ReportKpis,
} from '../../core/services/admin/admin-operations.service';
import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { AppEmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AppLoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { AppPageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { AppTableColumn, AppTableComponent } from '../../shared/ui/table/table.component';
import { ToastService } from '../../shared/ui/toast/toast.service';

type ReportType = 'rent-roll' | 'vacancies' | 'delinquency' | 'pnl';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    AppButtonComponent,
    AppEmptyStateComponent,
    AppLoadingStateComponent,
    AppPageHeaderComponent,
    AppTableComponent,
    CurrencyPipe,
    DecimalPipe,
  ],
  template: `
    <section class="page">
      <app-page-header
        title="Reportes"
        description="Rent roll, vacantes, morosidad, P&L y KPIs operativos."
      >
        <div actions class="header-actions">
          <app-button appearance="secondary" size="s" (clicked)="loadDashboard()"
            >Recargar</app-button
          >
          @if (rows().length > 0) {
            <app-button appearance="secondary" size="s" (clicked)="exportCsv()">CSV</app-button>
            <app-button
              appearance="secondary"
              size="s"
              [disabled]="exporting()"
              (clicked)="downloadReport('excel')"
              >Excel</app-button
            >
            <app-button
              appearance="secondary"
              size="s"
              [disabled]="exporting()"
              (clicked)="downloadReport('pdf')"
              >PDF</app-button
            >
          }
        </div>
      </app-page-header>

      @if (isLoading()) {
        <app-loading-state label="Cargando reportes..." />
      } @else {
        <div class="kpi-grid">
          <article class="kpi">
            <span>Ocupación</span>
            <strong>{{ (kpis().occupancyRateValue ?? 0) * 100 | number: '1.0-1' }}%</strong>
          </article>
          <article class="kpi">
            <span>Ingresos del mes</span>
            <strong>{{ kpis().monthlyIncome ?? 0 | currency: 'USD' }}</strong>
          </article>
          <article class="kpi">
            <span>Pagos pendientes</span>
            <strong>{{ kpis().pendingPaymentsCount ?? 0 }}</strong>
          </article>
          <article class="kpi">
            <span>Mantenimientos activos</span>
            <strong>{{ kpis().activeMaintenanceCount ?? 0 }}</strong>
          </article>
        </div>

        <nav class="tabs" aria-label="Tipos de reporte">
          @for (report of reports; track report.type) {
            <button
              type="button"
              [class.active]="activeReport() === report.type"
              (click)="loadReport(report.type)"
            >
              {{ report.label }}
            </button>
          }
        </nav>

        @if (rows().length === 0) {
          <app-empty-state
            title="Sin datos"
            description="No hay filas para el reporte seleccionado."
          />
        } @else {
          <app-table
            [columns]="columns"
            [items]="rows()"
            emptyText="No hay datos para mostrar."
            ariaLabel="Reporte financiero"
          />
        }
      }
    </section>
  `,
  styles: `
    .page {
      display: grid;
      gap: var(--app-space-5);
      padding: var(--app-space-6);
    }

    .kpi-grid {
      display: grid;
      gap: var(--app-space-4);
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    }

    .kpi {
      background: var(--app-color-surface);
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-lg);
      display: grid;
      gap: var(--app-space-2);
      padding: var(--app-space-4);
    }

    .kpi span {
      color: var(--app-color-text-muted);
      font-size: 0.8125rem;
      font-weight: 650;
    }

    .kpi strong {
      color: var(--app-color-text);
      font-size: 1.4rem;
      font-weight: 800;
    }

    .tabs {
      display: flex;
      flex-wrap: wrap;
      gap: var(--app-space-2);
    }

    .tabs button {
      background: var(--app-color-surface);
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-md);
      color: var(--app-color-text-muted);
      cursor: pointer;
      font: inherit;
      font-weight: 650;
      padding: 0.6rem 0.9rem;
    }

    .tabs button.active {
      background: var(--app-color-primary);
      border-color: var(--app-color-primary);
      color: #fff;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsComponent {
  private readonly operations = inject(AdminOperationsService);
  private readonly toast = inject(ToastService);

  readonly reports: { type: ReportType; label: string }[] = [
    { type: 'rent-roll', label: 'Rent Roll' },
    { type: 'vacancies', label: 'Vacantes' },
    { type: 'delinquency', label: 'Morosidad' },
    { type: 'pnl', label: 'P&L' },
  ];

  readonly columns: AppTableColumn<ApiRecord>[] = [
    { key: 'property', label: 'Propiedad' },
    { key: 'unit', label: 'Unidad' },
    { key: 'tenant', label: 'Inquilino' },
    { key: 'status', label: 'Estado' },
    { key: 'amount', label: 'Monto', align: 'right' },
  ];

  readonly isLoading = signal(true);
  readonly exporting = signal(false);
  readonly activeReport = signal<ReportType>('rent-roll');
  readonly kpis = signal<ReportKpis>({});
  readonly rows = signal<ApiRecord[]>([]);

  constructor() {
    this.loadDashboard();
  }

  loadReport(type: ReportType): void {
    this.activeReport.set(type);
    this.isLoading.set(true);
    this.operations
      .getReportRows(type)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (rows) => this.rows.set(rows),
        error: (error: Error) => this.toast.error(error.message),
      });
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.operations.getReportsKpis().subscribe({
      next: (kpis) => this.kpis.set(kpis),
      error: (error: Error) => this.toast.error(error.message),
    });
    this.loadReport(this.activeReport());
  }

  /** Descarga el reporte activo en Excel o PDF generado por el backend. */
  downloadReport(format: 'excel' | 'pdf'): void {
    const report = this.activeReport();
    this.exporting.set(true);
    this.operations.downloadReport(report, format).subscribe({
      next: (blob) => {
        this.exporting.set(false);
        const ext = format === 'excel' ? 'xlsx' : 'pdf';
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${report}-${new Date().toISOString().slice(0, 10)}.${ext}`;
        link.click();
        URL.revokeObjectURL(url);
        this.toast.success('Reporte exportado');
      },
      error: () => {
        this.exporting.set(false);
        this.toast.error('No se pudo exportar el reporte');
      },
    });
  }

  /** Exporta el reporte activo a un archivo CSV descargable. */
  exportCsv(): void {
    const rows = this.rows();
    if (rows.length === 0) {
      this.toast.error('No hay datos para exportar');
      return;
    }

    const keys = this.columns.map((c) => c.key);
    const escape = (val: unknown): string => {
      let str = '';
      if (typeof val === 'string') str = val;
      else if (typeof val === 'number' || typeof val === 'boolean') str = String(val);
      else if (val !== null && val !== undefined) str = JSON.stringify(val);
      return `"${str.replace(/"/g, '""')}"`;
    };
    const header = this.columns.map((c) => c.label).join(',');
    const body = rows
      .map((row) => keys.map((k) => escape((row as Record<string, unknown>)[k])).join(','))
      .join('\n');

    const bom = String.fromCharCode(0xfeff);
    const blob = new Blob([`${bom}${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.activeReport()}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.toast.success('Reporte exportado');
  }
}
