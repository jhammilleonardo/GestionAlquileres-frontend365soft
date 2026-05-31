import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AdminOperationsService,
  ApiRecord,
} from '../../core/services/admin/admin-operations.service';
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
      ],
    });
    facade = TestBed.inject(ReportsFacade);
  });

  it('loads kpis and the active report with filters', () => {
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
    expect(operations.getReportRows).toHaveBeenCalledWith('rent-roll', params);
    expect(facade.kpis().occupancyRateValue).toBe(0.9);
    expect(facade.rows()).toEqual([{ id: 1, property: 'Casa Centro' } as ApiRecord]);
  });

  it('switches report type and reloads rows', () => {
    facade.loadReport('pnl');

    expect(facade.activeReport()).toBe('pnl');
    expect(operations.getReportRows).toHaveBeenCalledWith('pnl', {});
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

    facade.downloadReport('pdf');

    expect(toast.error).toHaveBeenCalledWith('No se pudo exportar el reporte');
    expect(facade.exporting()).toBe(false);
  });
});
