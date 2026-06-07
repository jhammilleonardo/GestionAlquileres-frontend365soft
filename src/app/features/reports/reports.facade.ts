import { computed, Injectable, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder } from '@angular/forms';
import { Translation, TranslocoService } from '@jsverse/transloco';
import { finalize } from 'rxjs';

import {
  AdminOperationsService,
  ApiRecord,
  ReportKpis,
} from '../../core/services/admin/admin-operations.service';
import { QueryParams } from '../../core/http/api-client.service';
import { FileDownloadService } from '../../core/services/file-download.service';
import { AppTableColumn } from '../../shared/ui/table/table.component';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { ReportBarDatum } from './components/report-bar-chart.component';
import { ReportChartSegment } from './components/report-donut-chart.component';
import { ReportLineDatum } from './components/report-line-chart.component';
import { buildReportColumns, buildVirtualReportRows } from './reports-data.builders';

export type BackendReportType =
  | 'rent-roll'
  | 'vacancies'
  | 'delinquency'
  | 'pnl'
  | 'maintenance'
  | 'owners'
  | 'cash-flow'
  | 'budget-vs-actual';
export type ReportType = 'summary' | BackendReportType;
export type ReportExportFormat = 'csv' | 'excel' | 'pdf';

export interface ReportOption {
  type: ReportType;
  label: string;
  description: string;
  backendType?: BackendReportType;
}

export interface ReportFiltersValue {
  property_id: string | null;
  status: string | null;
  from: string | null;
  to: string | null;
}

interface KpiCard {
  label: string;
  value: string;
  helper: string;
  tone: 'neutral' | 'success' | 'warning' | 'danger';
}

const MONEY_FORMAT = new Intl.NumberFormat('es-BO', {
  currency: 'USD',
  maximumFractionDigits: 0,
  style: 'currency',
});

const NUMBER_FORMAT = new Intl.NumberFormat('es-BO', {
  maximumFractionDigits: 0,
});

interface ReportTypeMeta {
  type: ReportType;
  backendType?: BackendReportType;
}

const REPORT_TYPES: readonly ReportTypeMeta[] = [
  { type: 'summary' },
  { type: 'rent-roll', backendType: 'rent-roll' },
  { type: 'pnl', backendType: 'pnl' },
  { type: 'delinquency', backendType: 'delinquency' },
  { type: 'vacancies', backendType: 'vacancies' },
  { type: 'maintenance', backendType: 'maintenance' },
  { type: 'owners', backendType: 'owners' },
  { type: 'cash-flow', backendType: 'cash-flow' },
  { type: 'budget-vs-actual', backendType: 'budget-vs-actual' },
];

@Injectable()
export class ReportsFacade {
  private readonly fb = inject(FormBuilder);
  private readonly operations = inject(AdminOperationsService);
  private readonly fileDownload = inject(FileDownloadService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  // Mantiene el scope cargado y refresca las etiquetas traducidas al cambiar de idioma.
  private readonly reportTranslations = toSignal(this.transloco.selectTranslation('reports'), {
    initialValue: {} as Translation,
  });

  readonly reports = computed<readonly ReportOption[]>(() => {
    this.reportTranslations();
    return REPORT_TYPES.map(({ type, backendType }) => ({
      type,
      backendType,
      label: this.t(`types.${type}.label`),
      description: this.t(`types.${type}.description`),
    }));
  });

  readonly filterForm = this.fb.nonNullable.group({
    property_id: [''],
    status: [''],
    from: [''],
    to: [''],
  });

  readonly isLoading = signal(true);
  readonly exporting = signal(false);
  readonly activeReport = signal<ReportType>('summary');
  readonly kpis = signal<ReportKpis>({});
  readonly rows = signal<ApiRecord[]>([]);

  readonly activeReportOption = computed(() => {
    const reports = this.reports();
    return reports.find((report) => report.type === this.activeReport()) ?? reports[0];
  });
  readonly activeColumns = computed<readonly AppTableColumn<ApiRecord>[]>(() => {
    this.reportTranslations();
    return buildReportColumns(this.activeReport(), (key, params) => this.t(key, params));
  });
  readonly canDownloadBackendExport = computed(() =>
    Boolean(this.activeReportOption().backendType),
  );

  readonly kpiCards = computed<readonly KpiCard[]>(() => {
    this.reportTranslations();
    const kpis = this.kpis();
    const income = this.toNumber(kpis.monthlyIncome);
    const previousIncome = this.toNumber(kpis.monthlyIncomePrevious);
    const delta = previousIncome > 0 ? ((income - previousIncome) / previousIncome) * 100 : 0;
    const deltaLabel = `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}`;

    return [
      {
        label: this.t('kpis.incomeMonth.label'),
        value: MONEY_FORMAT.format(income),
        helper: this.t('kpis.incomeMonth.helper', { delta: deltaLabel }),
        tone: delta >= 0 ? 'success' : 'warning',
      },
      {
        label: this.t('kpis.occupancy.label'),
        value: `${((kpis.occupancyRateValue ?? 0) * 100).toFixed(1)}%`,
        helper: this.t('kpis.occupancy.helper', {
          occupied: NUMBER_FORMAT.format(kpis.occupiedUnits ?? 0),
          total: NUMBER_FORMAT.format(kpis.totalUnits ?? 0),
        }),
        tone: (kpis.occupancyRateValue ?? 0) >= 0.85 ? 'success' : 'warning',
      },
      {
        label: this.t('kpis.delinquent.label'),
        value: NUMBER_FORMAT.format(kpis.delinquentCount ?? 0),
        helper: this.t('kpis.delinquent.helper'),
        tone: (kpis.delinquentCount ?? 0) > 0 ? 'danger' : 'success',
      },
      {
        label: this.t('kpis.maintenance.label'),
        value: NUMBER_FORMAT.format(kpis.activeMaintenanceCount ?? 0),
        helper: this.t('kpis.maintenance.helper'),
        tone: (kpis.activeMaintenanceCount ?? 0) > 0 ? 'warning' : 'neutral',
      },
      {
        label: this.t('kpis.expiring.label'),
        value: NUMBER_FORMAT.format(kpis.expiringContracts ?? 0),
        helper: this.t('kpis.expiring.helper'),
        tone: (kpis.expiringContracts ?? 0) > 0 ? 'warning' : 'neutral',
      },
      {
        label: this.t('kpis.pending.label'),
        value: NUMBER_FORMAT.format(kpis.pendingPaymentsCount ?? 0),
        helper: this.t('kpis.pending.helper'),
        tone: (kpis.pendingPaymentsCount ?? 0) > 0 ? 'warning' : 'success',
      },
    ];
  });

  readonly occupancySegments = computed<readonly ReportChartSegment[]>(() => {
    this.reportTranslations();
    const kpis = this.kpis();
    return [
      {
        label: this.t('segments.occupied'),
        value: this.toNumber(kpis.occupiedUnits),
        color: 'var(--app-color-success)',
      },
      {
        label: this.t('segments.available'),
        value: this.toNumber(kpis.availableUnits),
        color: 'var(--app-color-primary)',
      },
      {
        label: this.t('segments.inService'),
        value: this.toNumber(kpis.activeMaintenanceCount),
        color: 'var(--app-color-warning)',
      },
    ];
  });

  readonly delinquencyAgingSegments = computed<readonly ReportChartSegment[]>(() => {
    this.reportTranslations();
    const buckets = { short: 0, medium: 0, long: 0, severe: 0 };
    for (const row of this.rows()) {
      const days = this.readNumber(row, 'max_days_late');
      const amount = Math.max(this.readNumber(row, 'total_owed'), 1);
      if (days <= 7) buckets.short += amount;
      else if (days <= 15) buckets.medium += amount;
      else if (days <= 30) buckets.long += amount;
      else buckets.severe += amount;
    }

    if (Object.values(buckets).every((value) => value === 0)) {
      buckets.short = this.toNumber(this.kpis().delinquentCount);
    }

    return [
      { label: this.t('segments.aging1'), value: buckets.short, color: 'var(--app-color-success)' },
      {
        label: this.t('segments.aging2'),
        value: buckets.medium,
        color: 'var(--app-color-warning)',
      },
      { label: this.t('segments.aging3'), value: buckets.long, color: '#f97316' },
      {
        label: this.t('segments.aging4'),
        value: buckets.severe,
        color: 'var(--app-color-danger)',
      },
    ];
  });

  readonly financialBars = computed<readonly ReportBarDatum[]>(() => {
    this.reportTranslations();
    const rows = this.rows();
    if (this.activeReport() === 'pnl' && rows.length > 0) {
      return rows.slice(0, 6).map((row, index) => ({
        label: this.readString(
          row,
          'property_name',
          this.t('bars.propertyFallback', { n: index + 1 }),
        ),
        value: this.readNumber(row, 'net_result'),
        color: this.readNumber(row, 'net_result') >= 0 ? 'var(--app-color-success)' : '#f97316',
      }));
    }

    return [
      {
        label: this.t('bars.income'),
        value: this.toNumber(this.kpis().monthlyIncome),
        color: 'var(--app-color-success)',
      },
      {
        label: this.t('bars.pending'),
        value: this.toNumber(this.kpis().pendingPaymentsCount) * 100,
        color: 'var(--app-color-warning)',
      },
      {
        label: this.t('bars.maintenance'),
        value: this.toNumber(this.kpis().activeMaintenanceCount) * 250,
        color: 'var(--app-color-primary)',
      },
    ];
  });

  readonly vacancyBars = computed<readonly ReportBarDatum[]>(() => {
    this.reportTranslations();
    const rows = this.activeReport() === 'vacancies' ? this.rows() : [];
    if (rows.length > 0) {
      return rows.slice(0, 6).map((row, index) => ({
        label:
          this.readString(row, 'unit_number') ||
          this.readString(row, 'property_name', this.t('bars.unitFallback', { n: index + 1 })),
        value: this.readNumber(row, 'days_vacant'),
        color: 'var(--app-color-warning)',
      }));
    }

    return [
      {
        label: this.t('bars.available'),
        value: this.toNumber(this.kpis().availableUnits),
        color: 'var(--app-color-primary)',
      },
      {
        label: this.t('bars.occupied'),
        value: this.toNumber(this.kpis().occupiedUnits),
        color: 'var(--app-color-success)',
      },
    ];
  });

  readonly incomeTrend = computed<readonly ReportLineDatum[]>(() => {
    this.reportTranslations();
    const previous = this.toNumber(this.kpis().monthlyIncomePrevious);
    const current = this.toNumber(this.kpis().monthlyIncome);
    const projected = current > 0 ? current * 1.06 : previous;

    return [
      { label: this.t('trend.previous'), value: previous },
      { label: this.t('trend.current'), value: current },
      { label: this.t('trend.projection'), value: projected },
    ];
  });

  loadDashboard(): void {
    this.isLoading.set(true);
    const params = this.buildParams();

    this.operations.getReportsKpis(params).subscribe({
      next: (kpis) => {
        this.kpis.set(kpis);
        if (!this.activeReportOption().backendType) {
          this.rows.set(
            buildVirtualReportRows(this.activeReport(), this.kpis(), (key, params) =>
              this.t(key, params),
            ),
          );
        }
      },
      error: (error: Error) => this.toast.error(error.message),
    });
    this.loadReport(this.activeReport(), false);
  }

  loadReport(type: ReportType, markLoading = true): void {
    this.activeReport.set(type);
    const backendType = this.activeReportOption().backendType;
    if (!backendType) {
      this.rows.set(
        buildVirtualReportRows(type, this.kpis(), (key, params) => this.t(key, params)),
      );
      this.isLoading.set(false);
      return;
    }

    if (markLoading) this.isLoading.set(true);

    this.operations
      .getReportRows(backendType, this.buildParams())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (rows) => this.rows.set(rows),
        error: (error: Error) => this.toast.error(error.message),
      });
  }

  applyFilters(): void {
    this.loadDashboard();
  }

  clearFilters(): void {
    this.filterForm.reset({
      property_id: '',
      status: '',
      from: '',
      to: '',
    });
    this.loadDashboard();
  }

  downloadReport(format: Exclude<ReportExportFormat, 'csv'>): void {
    const backendType = this.activeReportOption().backendType;
    if (!backendType) {
      this.toast.error(this.t('toast.noBackendExport'));
      return;
    }

    this.exporting.set(true);
    this.operations.downloadReport(backendType, format, this.buildParams()).subscribe({
      next: (blob) => {
        this.exporting.set(false);
        this.downloadBlob(blob, this.buildFilename(backendType, format));
        this.toast.success(this.t('toast.exported'));
      },
      error: () => {
        this.exporting.set(false);
        this.toast.error(this.t('toast.exportError'));
      },
    });
  }

  exportCsv(columns: readonly { key: string; label: string }[]): void {
    const rows = this.rows();
    if (rows.length === 0) {
      this.toast.error(this.t('toast.noDataToExport'));
      return;
    }

    const keys = columns.map((column) => column.key);
    const header = columns.map((column) => column.label).join(',');
    const body = rows
      .map((row) => keys.map((key) => this.escapeCsv(row[key])).join(','))
      .join('\n');
    const bom = String.fromCharCode(0xfeff);
    const blob = new Blob([`${bom}${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, this.buildFilename(this.activeReport(), 'csv'));
    this.toast.success(this.t('toast.exported'));
  }

  private buildParams(): QueryParams {
    const value = this.filterForm.getRawValue();
    const params: QueryParams = {};

    if (value.property_id.trim()) params['property_id'] = value.property_id.trim();
    if (value.status.trim()) params['status'] = value.status.trim();
    if (value.from) params['from'] = value.from;
    if (value.to) params['to'] = value.to;

    return params;
  }

  private t(key: string, params?: Record<string, string | number>): string {
    return this.transloco.translate(`reports.${key}`, params);
  }

  private buildFilename(report: string, format: ReportExportFormat): string {
    const ext = format === 'excel' ? 'xlsx' : format;
    return `${report}-${new Date().toISOString().slice(0, 10)}.${ext}`;
  }

  private escapeCsv(value: unknown): string {
    let str = '';
    if (typeof value === 'string') str = value;
    else if (typeof value === 'number' || typeof value === 'boolean') str = String(value);
    else if (value !== null && value !== undefined) str = JSON.stringify(value);
    return `"${str.replace(/"/g, '""')}"`;
  }

  private downloadBlob(blob: Blob, filename: string): void {
    this.fileDownload.downloadBlob(blob, filename);
  }

  private toNumber(value: string | number | null | undefined): number {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private readNumber(row: ApiRecord, key: string): number {
    return this.toNumber(row[key] as string | number | null | undefined);
  }

  private readString(row: ApiRecord, key: string, fallback = ''): string {
    const value = row[key];
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return fallback;
  }
}
