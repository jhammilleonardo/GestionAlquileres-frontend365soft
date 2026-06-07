import { ApiRecord, ReportKpis } from '../../core/services/admin/admin-operations.service';
import { AppTableColumn } from '../../shared/ui/table/table.component';
import type { ReportType } from './reports.facade';

export type ReportTranslateFn = (key: string, params?: Record<string, string | number>) => string;

const MONEY_FORMAT = new Intl.NumberFormat('es-BO', {
  currency: 'USD',
  maximumFractionDigits: 0,
  style: 'currency',
});

export function buildVirtualReportRows(
  type: ReportType,
  kpis: ReportKpis,
  t: ReportTranslateFn,
): ApiRecord[] {
  const income = toNumber(kpis.monthlyIncome);
  const pendingEstimate = toNumber(kpis.pendingPaymentsCount) * 100;
  const maintenanceEstimate = toNumber(kpis.activeMaintenanceCount) * 250;
  const commission = income * 0.1;

  if (type === 'owners') {
    return [
      {
        id: 1,
        property_name: t('virtual.allProperties'),
        gross_income: income,
        commission,
        deductions: maintenanceEstimate,
        net_transfer: Math.max(income - commission - maintenanceEstimate, 0),
        status: t('virtual.pendingClose'),
      },
    ];
  }

  if (type === 'cash-flow') {
    return [
      {
        id: 1,
        movement: t('virtual.approvedRents'),
        inflow: income,
        outflow: 0,
        net: income,
      },
      {
        id: 2,
        movement: t('virtual.estimatedPendingPayments'),
        inflow: pendingEstimate,
        outflow: 0,
        net: pendingEstimate,
      },
      {
        id: 3,
        movement: t('virtual.estimatedMaintenance'),
        inflow: 0,
        outflow: maintenanceEstimate,
        net: -maintenanceEstimate,
      },
    ];
  }

  if (type === 'budget-vs-actual') {
    const budgetIncome = Math.max(toNumber(kpis.monthlyIncomePrevious) * 1.05, income);
    const budgetExpenses = maintenanceEstimate * 1.15;
    return [
      {
        id: 1,
        line: t('virtual.incomeLine'),
        budget: budgetIncome,
        actual: income,
        variance: income - budgetIncome,
      },
      {
        id: 2,
        line: t('virtual.operatingExpenses'),
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
        metric: t('virtual.activeRequests'),
        value: toNumber(kpis.activeMaintenanceCount),
        status: t('virtual.operationalTracking'),
      },
      {
        id: 2,
        metric: t('virtual.estimatedCost'),
        value: MONEY_FORMAT.format(maintenanceEstimate),
        status: t('virtual.basedOnActivity'),
      },
    ];
  }

  return [
    {
      id: 1,
      metric: t('virtual.monthIncome'),
      value: MONEY_FORMAT.format(income),
      status: t('virtual.financial'),
    },
    {
      id: 2,
      metric: t('virtual.occupancy'),
      value: `${((kpis.occupancyRateValue ?? 0) * 100).toFixed(1)}%`,
      status: t('virtual.operational'),
    },
    {
      id: 3,
      metric: t('virtual.activeMaintenance'),
      value: toNumber(kpis.activeMaintenanceCount),
      status: t('virtual.operational'),
    },
  ];
}

export function buildReportColumns(
  type: ReportType,
  t: ReportTranslateFn,
): readonly AppTableColumn<ApiRecord>[] {
  const columns: Record<ReportType, readonly AppTableColumn<ApiRecord>[]> = {
    summary: [
      { key: 'metric', label: t('columns.metric') },
      { key: 'value', label: t('columns.value'), align: 'right' },
      { key: 'status', label: t('columns.reading') },
    ],
    'rent-roll': [
      { key: 'property_name', label: t('columns.property') },
      { key: 'unit_number', label: t('columns.unit') },
      { key: 'tenant_name', label: t('columns.tenant') },
      { key: 'contract_status', label: t('columns.contract') },
      {
        key: 'rent_amount',
        label: t('columns.rent'),
        align: 'right',
        formatter: moneyCell('rent_amount'),
      },
      {
        key: 'current_balance',
        label: t('columns.balance'),
        align: 'right',
        formatter: moneyCell('current_balance'),
      },
    ],
    vacancies: [
      { key: 'property_name', label: t('columns.property') },
      { key: 'unit_number', label: t('columns.unit') },
      { key: 'bedrooms', label: t('columns.beds') },
      { key: 'bathrooms', label: t('columns.baths') },
      {
        key: 'market_rent',
        label: t('columns.marketRent'),
        align: 'right',
        formatter: moneyCell('market_rent'),
      },
      { key: 'days_vacant', label: t('columns.daysVacant'), align: 'right' },
    ],
    delinquency: [
      { key: 'tenant_name', label: t('columns.tenant') },
      { key: 'property_name', label: t('columns.property') },
      { key: 'unit_number', label: t('columns.unit') },
      {
        key: 'total_owed',
        label: t('columns.debt'),
        align: 'right',
        formatter: moneyCell('total_owed'),
      },
      { key: 'max_days_late', label: t('columns.daysLate'), align: 'right' },
    ],
    pnl: [
      { key: 'property_name', label: t('columns.property') },
      {
        key: 'income',
        label: t('columns.income'),
        align: 'right',
        formatter: moneyCell('income'),
      },
      {
        key: 'expenses',
        label: t('columns.expenses'),
        align: 'right',
        formatter: moneyCell('expenses'),
      },
      {
        key: 'net_result',
        label: t('columns.result'),
        align: 'right',
        formatter: moneyCell('net_result'),
      },
    ],
    maintenance: [
      { key: 'metric', label: t('columns.metric') },
      { key: 'value', label: t('columns.value'), align: 'right' },
      { key: 'status', label: t('columns.reading') },
    ],
    owners: [
      { key: 'property_name', label: t('columns.property') },
      {
        key: 'gross_income',
        label: t('columns.grossRent'),
        align: 'right',
        formatter: moneyCell('gross_income'),
      },
      {
        key: 'commission',
        label: t('columns.commission'),
        align: 'right',
        formatter: moneyCell('commission'),
      },
      {
        key: 'deductions',
        label: t('columns.deductions'),
        align: 'right',
        formatter: moneyCell('deductions'),
      },
      {
        key: 'net_transfer',
        label: t('columns.ownerNet'),
        align: 'right',
        formatter: moneyCell('net_transfer'),
      },
      { key: 'status', label: t('columns.state') },
    ],
    'cash-flow': [
      { key: 'movement', label: t('columns.movement') },
      {
        key: 'inflow',
        label: t('columns.inflow'),
        align: 'right',
        formatter: moneyCell('inflow'),
      },
      {
        key: 'outflow',
        label: t('columns.outflow'),
        align: 'right',
        formatter: moneyCell('outflow'),
      },
      { key: 'net', label: t('columns.net'), align: 'right', formatter: moneyCell('net') },
    ],
    'budget-vs-actual': [
      { key: 'line', label: t('columns.line') },
      {
        key: 'budget',
        label: t('columns.budget'),
        align: 'right',
        formatter: moneyCell('budget'),
      },
      {
        key: 'actual',
        label: t('columns.actual'),
        align: 'right',
        formatter: moneyCell('actual'),
      },
      {
        key: 'variance',
        label: t('columns.variance'),
        align: 'right',
        formatter: moneyCell('variance'),
      },
    ],
  };

  return columns[type];
}

function moneyCell(key: string): (row: ApiRecord) => string {
  return (row: ApiRecord) => MONEY_FORMAT.format(readNumberFromRow(row, key));
}

function readNumberFromRow(row: ApiRecord, key: string): number {
  return toNumber(row[key] as string | number | null | undefined);
}

function toNumber(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}
