import { Injectable, inject, signal } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  AdminOperationsService,
  ApiRecord,
  ReportKpis,
} from '../../core/services/admin/admin-operations.service';
import { QueryParams } from '../../core/http/api-client.service';
import { ToastService } from '../../shared/ui/toast/toast.service';

export type ReportType = 'rent-roll' | 'vacancies' | 'delinquency' | 'pnl';
export type ReportExportFormat = 'csv' | 'excel' | 'pdf';

export interface ReportOption {
  type: ReportType;
  label: string;
}

export interface ReportFiltersValue {
  property_id: string | null;
  status: string | null;
  from: string | null;
  to: string | null;
}

@Injectable()
export class ReportsFacade {
  private readonly fb = inject(FormBuilder);
  private readonly operations = inject(AdminOperationsService);
  private readonly toast = inject(ToastService);

  readonly reports: readonly ReportOption[] = [
    { type: 'rent-roll', label: 'Rent Roll' },
    { type: 'vacancies', label: 'Vacantes' },
    { type: 'delinquency', label: 'Morosidad' },
    { type: 'pnl', label: 'P&L' },
  ];

  readonly filterForm = this.fb.nonNullable.group({
    property_id: [''],
    status: [''],
    from: [''],
    to: [''],
  });

  readonly isLoading = signal(true);
  readonly exporting = signal(false);
  readonly activeReport = signal<ReportType>('rent-roll');
  readonly kpis = signal<ReportKpis>({});
  readonly rows = signal<ApiRecord[]>([]);

  loadDashboard(): void {
    this.isLoading.set(true);
    const params = this.buildParams();

    this.operations.getReportsKpis(params).subscribe({
      next: (kpis) => this.kpis.set(kpis),
      error: (error: Error) => this.toast.error(error.message),
    });
    this.loadReport(this.activeReport(), false);
  }

  loadReport(type: ReportType, markLoading = true): void {
    this.activeReport.set(type);
    if (markLoading) this.isLoading.set(true);

    this.operations
      .getReportRows(type, this.buildParams())
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
    const report = this.activeReport();
    this.exporting.set(true);
    this.operations.downloadReport(report, format, this.buildParams()).subscribe({
      next: (blob) => {
        this.exporting.set(false);
        this.downloadBlob(blob, this.buildFilename(report, format));
        this.toast.success('Reporte exportado');
      },
      error: () => {
        this.exporting.set(false);
        this.toast.error('No se pudo exportar el reporte');
      },
    });
  }

  exportCsv(columns: readonly { key: string; label: string }[]): void {
    const rows = this.rows();
    if (rows.length === 0) {
      this.toast.error('No hay datos para exportar');
      return;
    }

    const keys = columns.map((column) => column.key);
    const header = columns.map((column) => column.label).join(',');
    const body = rows
      .map((row) =>
        keys.map((key) => this.escapeCsv((row as Record<string, unknown>)[key])).join(','),
      )
      .join('\n');
    const bom = String.fromCharCode(0xfeff);
    const blob = new Blob([`${bom}${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, this.buildFilename(this.activeReport(), 'csv'));
    this.toast.success('Reporte exportado');
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
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
