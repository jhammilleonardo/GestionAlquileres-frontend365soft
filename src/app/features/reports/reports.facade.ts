import { computed, Injectable, inject, signal } from '@angular/core';
import { FormBuilder } from '@angular/forms';
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

const TABLE_COLUMNS: Record<ReportType, readonly AppTableColumn<ApiRecord>[]> = {
  summary: [
    { key: 'metric', label: 'Métrica' },
    { key: 'value', label: 'Valor', align: 'right' },
    { key: 'status', label: 'Lectura' },
  ],
  'rent-roll': [
    { key: 'property_name', label: 'Propiedad' },
    { key: 'unit_number', label: 'Unidad' },
    { key: 'tenant_name', label: 'Inquilino' },
    { key: 'contract_status', label: 'Contrato' },
    { key: 'rent_amount', label: 'Renta', align: 'right', formatter: moneyCell('rent_amount') },
    {
      key: 'current_balance',
      label: 'Balance',
      align: 'right',
      formatter: moneyCell('current_balance'),
    },
  ],
  vacancies: [
    { key: 'property_name', label: 'Propiedad' },
    { key: 'unit_number', label: 'Unidad' },
    { key: 'bedrooms', label: 'Dorm.' },
    { key: 'bathrooms', label: 'Baños' },
    {
      key: 'market_rent',
      label: 'Renta mercado',
      align: 'right',
      formatter: moneyCell('market_rent'),
    },
    { key: 'days_vacant', label: 'Días vacante', align: 'right' },
  ],
  delinquency: [
    { key: 'tenant_name', label: 'Inquilino' },
    { key: 'property_name', label: 'Propiedad' },
    { key: 'unit_number', label: 'Unidad' },
    { key: 'total_owed', label: 'Deuda', align: 'right', formatter: moneyCell('total_owed') },
    { key: 'max_days_late', label: 'Días mora', align: 'right' },
  ],
  pnl: [
    { key: 'property_name', label: 'Propiedad' },
    { key: 'income', label: 'Ingresos', align: 'right', formatter: moneyCell('income') },
    { key: 'expenses', label: 'Gastos', align: 'right', formatter: moneyCell('expenses') },
    { key: 'net_result', label: 'Resultado', align: 'right', formatter: moneyCell('net_result') },
  ],
  maintenance: [
    { key: 'metric', label: 'Métrica' },
    { key: 'value', label: 'Valor', align: 'right' },
    { key: 'status', label: 'Lectura' },
  ],
  owners: [
    { key: 'property_name', label: 'Propiedad' },
    {
      key: 'gross_income',
      label: 'Renta bruta',
      align: 'right',
      formatter: moneyCell('gross_income'),
    },
    { key: 'commission', label: 'Comisión', align: 'right', formatter: moneyCell('commission') },
    { key: 'deductions', label: 'Deducciones', align: 'right', formatter: moneyCell('deductions') },
    {
      key: 'net_transfer',
      label: 'Neto propietario',
      align: 'right',
      formatter: moneyCell('net_transfer'),
    },
    { key: 'status', label: 'Estado' },
  ],
  'cash-flow': [
    { key: 'movement', label: 'Movimiento' },
    { key: 'inflow', label: 'Entrada', align: 'right', formatter: moneyCell('inflow') },
    { key: 'outflow', label: 'Salida', align: 'right', formatter: moneyCell('outflow') },
    { key: 'net', label: 'Neto', align: 'right', formatter: moneyCell('net') },
  ],
  'budget-vs-actual': [
    { key: 'line', label: 'Línea' },
    { key: 'budget', label: 'Presupuesto', align: 'right', formatter: moneyCell('budget') },
    { key: 'actual', label: 'Real', align: 'right', formatter: moneyCell('actual') },
    { key: 'variance', label: 'Variación', align: 'right', formatter: moneyCell('variance') },
  ],
};

@Injectable()
export class ReportsFacade {
  private readonly fb = inject(FormBuilder);
  private readonly operations = inject(AdminOperationsService);
  private readonly fileDownload = inject(FileDownloadService);
  private readonly toast = inject(ToastService);

  readonly reports: readonly ReportOption[] = [
    {
      type: 'summary',
      label: 'Resumen',
      description: 'Vista ejecutiva con KPIs, ocupación y tendencia financiera.',
    },
    {
      type: 'rent-roll',
      label: 'Rent Roll',
      description: 'Unidades, contratos, renta esperada, depósitos y balances.',
      backendType: 'rent-roll',
    },
    {
      type: 'pnl',
      label: 'P&L',
      description: 'Ingresos, gastos y resultado neto por propiedad.',
      backendType: 'pnl',
    },
    {
      type: 'delinquency',
      label: 'Morosidad',
      description: 'Inquilinos con deuda, días de atraso y exposición por propiedad.',
      backendType: 'delinquency',
    },
    {
      type: 'vacancies',
      label: 'Vacancias',
      description: 'Unidades disponibles, días vacantes y renta de mercado.',
      backendType: 'vacancies',
    },
    {
      type: 'maintenance',
      label: 'Mantenimiento',
      description: 'Ordenes activas, presión operativa y costo estimado.',
      backendType: 'maintenance',
    },
    {
      type: 'owners',
      label: 'Owners',
      description: 'Liquidación estimada al propietario y deducciones.',
      backendType: 'owners',
    },
    {
      type: 'cash-flow',
      label: 'Cash Flow',
      description: 'Entradas, salidas y flujo neto operativo.',
      backendType: 'cash-flow',
    },
    {
      type: 'budget-vs-actual',
      label: 'Budget vs Actual',
      description: 'Comparación entre presupuesto esperado y resultado real.',
      backendType: 'budget-vs-actual',
    },
  ];

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

  readonly activeReportOption = computed(
    () => this.reports.find((report) => report.type === this.activeReport()) ?? this.reports[0],
  );
  readonly activeColumns = computed(() => TABLE_COLUMNS[this.activeReport()]);
  readonly canDownloadBackendExport = computed(() =>
    Boolean(this.activeReportOption().backendType),
  );

  readonly kpiCards = computed<readonly KpiCard[]>(() => {
    const kpis = this.kpis();
    const income = this.toNumber(kpis.monthlyIncome);
    const previousIncome = this.toNumber(kpis.monthlyIncomePrevious);
    const delta = previousIncome > 0 ? ((income - previousIncome) / previousIncome) * 100 : 0;

    return [
      {
        label: 'Ingresos del mes',
        value: MONEY_FORMAT.format(income),
        helper: `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}% vs mes anterior`,
        tone: delta >= 0 ? 'success' : 'warning',
      },
      {
        label: 'Ocupación',
        value: `${((kpis.occupancyRateValue ?? 0) * 100).toFixed(1)}%`,
        helper: `${NUMBER_FORMAT.format(kpis.occupiedUnits ?? 0)} de ${NUMBER_FORMAT.format(
          kpis.totalUnits ?? 0,
        )} unidades`,
        tone: (kpis.occupancyRateValue ?? 0) >= 0.85 ? 'success' : 'warning',
      },
      {
        label: 'Morosos',
        value: NUMBER_FORMAT.format(kpis.delinquentCount ?? 0),
        helper: 'Inquilinos con deuda vencida',
        tone: (kpis.delinquentCount ?? 0) > 0 ? 'danger' : 'success',
      },
      {
        label: 'Mantenimiento',
        value: NUMBER_FORMAT.format(kpis.activeMaintenanceCount ?? 0),
        helper: 'Solicitudes activas',
        tone: (kpis.activeMaintenanceCount ?? 0) > 0 ? 'warning' : 'neutral',
      },
      {
        label: 'Contratos por vencer',
        value: NUMBER_FORMAT.format(kpis.expiringContracts ?? 0),
        helper: 'Próximos 30 días',
        tone: (kpis.expiringContracts ?? 0) > 0 ? 'warning' : 'neutral',
      },
      {
        label: 'Pagos pendientes',
        value: NUMBER_FORMAT.format(kpis.pendingPaymentsCount ?? 0),
        helper: 'Requieren revisión',
        tone: (kpis.pendingPaymentsCount ?? 0) > 0 ? 'warning' : 'success',
      },
    ];
  });

  readonly occupancySegments = computed<readonly ReportChartSegment[]>(() => {
    const kpis = this.kpis();
    return [
      {
        label: 'Ocupadas',
        value: this.toNumber(kpis.occupiedUnits),
        color: 'var(--app-color-success)',
      },
      {
        label: 'Disponibles',
        value: this.toNumber(kpis.availableUnits),
        color: 'var(--app-color-primary)',
      },
      {
        label: 'En atención',
        value: this.toNumber(kpis.activeMaintenanceCount),
        color: 'var(--app-color-warning)',
      },
    ];
  });

  readonly delinquencyAgingSegments = computed<readonly ReportChartSegment[]>(() => {
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
      { label: '1-7 días', value: buckets.short, color: 'var(--app-color-success)' },
      { label: '8-15 días', value: buckets.medium, color: 'var(--app-color-warning)' },
      { label: '16-30 días', value: buckets.long, color: '#f97316' },
      { label: '+30 días', value: buckets.severe, color: 'var(--app-color-danger)' },
    ];
  });

  readonly financialBars = computed<readonly ReportBarDatum[]>(() => {
    const rows = this.rows();
    if (this.activeReport() === 'pnl' && rows.length > 0) {
      return rows.slice(0, 6).map((row, index) => ({
        label: this.readString(row, 'property_name', `Propiedad ${index + 1}`),
        value: this.readNumber(row, 'net_result'),
        color: this.readNumber(row, 'net_result') >= 0 ? 'var(--app-color-success)' : '#f97316',
      }));
    }

    return [
      {
        label: 'Ingresos',
        value: this.toNumber(this.kpis().monthlyIncome),
        color: 'var(--app-color-success)',
      },
      {
        label: 'Pendientes',
        value: this.toNumber(this.kpis().pendingPaymentsCount) * 100,
        color: 'var(--app-color-warning)',
      },
      {
        label: 'Mantenimiento',
        value: this.toNumber(this.kpis().activeMaintenanceCount) * 250,
        color: 'var(--app-color-primary)',
      },
    ];
  });

  readonly vacancyBars = computed<readonly ReportBarDatum[]>(() => {
    const rows = this.activeReport() === 'vacancies' ? this.rows() : [];
    if (rows.length > 0) {
      return rows.slice(0, 6).map((row, index) => ({
        label:
          this.readString(row, 'unit_number') ||
          this.readString(row, 'property_name', `Unidad ${index + 1}`),
        value: this.readNumber(row, 'days_vacant'),
        color: 'var(--app-color-warning)',
      }));
    }

    return [
      {
        label: 'Disponibles',
        value: this.toNumber(this.kpis().availableUnits),
        color: 'var(--app-color-primary)',
      },
      {
        label: 'Ocupadas',
        value: this.toNumber(this.kpis().occupiedUnits),
        color: 'var(--app-color-success)',
      },
    ];
  });

  readonly incomeTrend = computed<readonly ReportLineDatum[]>(() => {
    const previous = this.toNumber(this.kpis().monthlyIncomePrevious);
    const current = this.toNumber(this.kpis().monthlyIncome);
    const projected = current > 0 ? current * 1.06 : previous;

    return [
      { label: 'Mes anterior', value: previous },
      { label: 'Mes actual', value: current },
      { label: 'Proyección', value: projected },
    ];
  });

  loadDashboard(): void {
    this.isLoading.set(true);
    const params = this.buildParams();

    this.operations.getReportsKpis(params).subscribe({
      next: (kpis) => {
        this.kpis.set(kpis);
        if (!this.activeReportOption().backendType) {
          this.rows.set(this.buildVirtualRows(this.activeReport()));
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
      this.rows.set(this.buildVirtualRows(type));
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
      this.toast.error('Este reporte todavia no tiene exportacion backend');
      return;
    }

    this.exporting.set(true);
    this.operations.downloadReport(backendType, format, this.buildParams()).subscribe({
      next: (blob) => {
        this.exporting.set(false);
        this.downloadBlob(blob, this.buildFilename(backendType, format));
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
      .map((row) => keys.map((key) => this.escapeCsv(row[key])).join(','))
      .join('\n');
    const bom = String.fromCharCode(0xfeff);
    const blob = new Blob([`${bom}${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, this.buildFilename(this.activeReport(), 'csv'));
    this.toast.success('Reporte exportado');
  }

  private buildVirtualRows(type: ReportType): ApiRecord[] {
    const kpis = this.kpis();
    const income = this.toNumber(kpis.monthlyIncome);
    const pendingEstimate = this.toNumber(kpis.pendingPaymentsCount) * 100;
    const maintenanceEstimate = this.toNumber(kpis.activeMaintenanceCount) * 250;
    const commission = income * 0.1;

    if (type === 'owners') {
      return [
        {
          id: 1,
          property_name: 'Todas las propiedades',
          gross_income: income,
          commission,
          deductions: maintenanceEstimate,
          net_transfer: Math.max(income - commission - maintenanceEstimate, 0),
          status: 'Pendiente de cierre',
        },
      ];
    }

    if (type === 'cash-flow') {
      return [
        {
          id: 1,
          movement: 'Rentas aprobadas',
          inflow: income,
          outflow: 0,
          net: income,
        },
        {
          id: 2,
          movement: 'Pagos pendientes estimados',
          inflow: pendingEstimate,
          outflow: 0,
          net: pendingEstimate,
        },
        {
          id: 3,
          movement: 'Mantenimiento estimado',
          inflow: 0,
          outflow: maintenanceEstimate,
          net: -maintenanceEstimate,
        },
      ];
    }

    if (type === 'budget-vs-actual') {
      const budgetIncome = Math.max(this.toNumber(kpis.monthlyIncomePrevious) * 1.05, income);
      const budgetExpenses = maintenanceEstimate * 1.15;
      return [
        {
          id: 1,
          line: 'Ingresos',
          budget: budgetIncome,
          actual: income,
          variance: income - budgetIncome,
        },
        {
          id: 2,
          line: 'Gastos operativos',
          budget: budgetExpenses,
          actual: maintenanceEstimate,
          variance: budgetExpenses - maintenanceEstimate,
        },
      ];
    }

    if (type === 'maintenance') {
      return [
        {
          id: 1,
          metric: 'Solicitudes activas',
          value: this.toNumber(kpis.activeMaintenanceCount),
          status: 'Seguimiento operativo',
        },
        {
          id: 2,
          metric: 'Costo estimado',
          value: MONEY_FORMAT.format(maintenanceEstimate),
          status: 'Basado en actividad actual',
        },
      ];
    }

    return [
      {
        id: 1,
        metric: 'Ingresos del mes',
        value: MONEY_FORMAT.format(income),
        status: 'Financiero',
      },
      {
        id: 2,
        metric: 'Ocupacion',
        value: `${((kpis.occupancyRateValue ?? 0) * 100).toFixed(1)}%`,
        status: 'Operativo',
      },
      {
        id: 3,
        metric: 'Mantenimientos activos',
        value: this.toNumber(kpis.activeMaintenanceCount),
        status: 'Operativo',
      },
    ];
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

function moneyCell(key: string): (row: ApiRecord) => string {
  return (row: ApiRecord) => MONEY_FORMAT.format(readNumberFromRow(row, key));
}

function readNumberFromRow(row: ApiRecord, key: string): number {
  const value = row[key];
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}
