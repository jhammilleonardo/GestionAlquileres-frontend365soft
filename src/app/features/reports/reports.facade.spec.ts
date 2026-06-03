import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminOperationsService } from '../../core/services/admin/admin-operations.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { ReportsFacade } from './reports.facade';

describe('ReportsFacade', () => {
  let operations: {
    getReportsKpis: ReturnType<typeof vi.fn>;
    getReportRows: ReturnType<typeof vi.fn>;
    downloadReport: ReturnType<typeof vi.fn>;
  };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let facade: ReportsFacade;

  // El mock devuelve la clave tal cual; así las aserciones validan la rama/clave correcta.
  const transloco = {
    translate: (key: string) => key,
    selectTranslation: () => of({}),
  };

  beforeEach(() => {
    operations = {
      getReportsKpis: vi.fn(),
      getReportRows: vi.fn(),
      downloadReport: vi.fn(),
    };
    toast = { success: vi.fn(), error: vi.fn() };
    operations.getReportsKpis.mockReturnValue(of({ occupancyRateValue: 0.9 }));
    operations.getReportRows.mockReturnValue(of([{ id: 1, property: 'Casa Centro' }]));

    TestBed.configureTestingModule({
      providers: [
        ReportsFacade,
        { provide: AdminOperationsService, useValue: operations },
        { provide: ToastService, useValue: toast },
        { provide: TranslocoService, useValue: transloco },
      ],
    });
    facade = TestBed.inject(ReportsFacade);
  });

  it('loads kpis and builds the executive summary with filters', () => {
    facade.filterForm.patchValue({
      property_id: '44',
      status: 'active',
      from: '2026-01-01',
      to: '2026-01-31',
    });

    facade.loadDashboard();

    const params = {
      property_id: '44',
      status: 'active',
      from: '2026-01-01',
      to: '2026-01-31',
    };
    expect(operations.getReportsKpis).toHaveBeenCalledWith(params);
    expect(operations.getReportRows).not.toHaveBeenCalled();
    expect(facade.kpis().occupancyRateValue).toBe(0.9);
    expect(facade.rows()[0]).toMatchObject({ metric: 'reports.virtual.monthIncome' });
  });

  it('switches report type and reloads rows', () => {
    facade.loadReport('pnl');

    expect(facade.activeReport()).toBe('pnl');
    expect(operations.getReportRows).toHaveBeenCalledWith('pnl', {});
  });

  it('uses backend exports only for backend-backed reports', () => {
    facade.downloadReport('pdf');

    expect(operations.downloadReport).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('reports.toast.noBackendExport');
  });

  it('clears filters and reloads dashboard', () => {
    facade.filterForm.patchValue({ property_id: '44', status: 'active' });

    facade.clearFilters();

    expect(facade.filterForm.getRawValue()).toEqual({
      property_id: '',
      status: '',
      from: '',
      to: '',
    });
    expect(operations.getReportsKpis).toHaveBeenCalledWith({});
  });

  it('shows export errors from backend downloads', () => {
    operations.downloadReport.mockReturnValue(throwError(() => new Error('fail')));

    facade.loadReport('pnl');
    facade.downloadReport('pdf');

    expect(toast.error).toHaveBeenCalledWith('reports.toast.exportError');
    expect(facade.exporting()).toBe(false);
  });
});
