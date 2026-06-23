import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { ApiClientService, QueryParams } from '../../http/api-client.service';
import { SlugService } from '../slug.service';
import { environment } from '../../../../environments/environment';

export type ApiRecord = Record<string, unknown> & { id: number };

export interface PaginatedResponse<TItem> {
  data: TItem[];
  total: number;
}

export interface DashboardMaintenanceItem {
  id: number;
  title: string;
  propertyName: string;
  stage: string;
  daysOpen: number;
}

export interface DashboardContractItem {
  id: number;
  tenantName: string;
  propertyName: string;
  endDate: string;
  daysLeft: number;
}

export interface DashboardDelinquentItem {
  tenantId: number;
  tenantName: string;
  propertyName: string;
  amountOwed: number;
  daysOverdue: number;
}

export interface DashboardApplicationItem {
  id: number;
  applicantName: string;
  propertyName: string;
  status: string;
  createdAt: string;
}

export interface ReportKpis {
  occupancyRate?: string;
  occupancyRateValue?: number;
  totalUnits?: number;
  occupiedUnits?: number;
  availableUnits?: number;
  monthlyIncome?: number;
  monthlyIncomePrevious?: number;
  monthlyExpected?: number;
  pendingPaymentsCount?: number;
  delinquentCount?: number;
  activeMaintenanceCount?: number;
  expiringContracts?: number;
  recentMaintenance?: DashboardMaintenanceItem[];
  expiringContractsList?: DashboardContractItem[];
  delinquentList?: DashboardDelinquentItem[];
  pendingApplicationsList?: DashboardApplicationItem[];
  openViolationsCount?: number;
  openViolationsList?: DashboardViolationItem[];
  upcomingInspectionsCount?: number;
  upcomingInspectionsList?: DashboardInspectionItem[];
  monthlyExpenses?: number;
  recentExpensesList?: DashboardExpenseItem[];
}

export interface DashboardViolationItem {
  id: number;
  type: string;
  description: string;
  propertyName: string;
  tenantName: string;
  status: string;
  createdAt: string;
}

export interface DashboardInspectionItem {
  id: number;
  type: string;
  propertyName: string;
  scheduledDate: string;
  status: string;
  daysUntil: number;
}

export interface DashboardExpenseItem {
  id: number;
  category: string;
  amount: number;
  propertyName: string;
  vendorName: string;
  date: string;
}

@Injectable({ providedIn: 'root' })
export class AdminOperationsService {
  private readonly api = inject(ApiClientService);
  private readonly slugService = inject(SlugService);

  getReportsKpis(params: QueryParams = {}): Observable<ReportKpis> {
    return this.api.get<ReportKpis>(this.endpoint('admin/reports/kpis'), { params });
  }

  getReportRows(
    report:
      | 'rent-roll'
      | 'vacancies'
      | 'delinquency'
      | 'pnl'
      | 'maintenance'
      | 'owners'
      | 'cash-flow'
      | 'budget-vs-actual',
    params: QueryParams = {},
  ): Observable<ApiRecord[]> {
    return this.api.get<ApiRecord[]>(this.endpoint(`admin/reports/${report}`), { params });
  }

  getVendors(params: QueryParams = {}): Observable<ApiRecord[]> {
    return this.api.get<ApiRecord[]>(this.endpoint('admin/vendors'), { params });
  }

  createVendor(body: Record<string, unknown>): Observable<ApiRecord> {
    return this.api.post<ApiRecord>(this.endpoint('admin/vendors'), body);
  }

  deleteVendor(id: number): Observable<void> {
    return this.api.delete<void>(this.endpoint(`admin/vendors/${id}`));
  }

  getExpenses(params: QueryParams = {}): Observable<ApiRecord[]> {
    return this.api
      .get<PaginatedResponse<ApiRecord> | ApiRecord[]>(this.endpoint('admin/expenses'), { params })
      .pipe(map((response) => (Array.isArray(response) ? response : response.data)));
  }

  createExpense(body: Record<string, unknown>): Observable<ApiRecord> {
    return this.api.post<ApiRecord>(this.endpoint('admin/expenses'), body);
  }

  deleteExpense(id: number): Observable<void> {
    return this.api.delete<void>(this.endpoint(`admin/expenses/${id}`));
  }

  getViolations(params: QueryParams = {}): Observable<ApiRecord[]> {
    return this.api
      .get<
        PaginatedResponse<ApiRecord> | ApiRecord[]
      >(this.endpoint('admin/violations'), { params })
      .pipe(map((response) => (Array.isArray(response) ? response : response.data)));
  }

  createViolation(body: Record<string, unknown>): Observable<ApiRecord> {
    return this.api.post<ApiRecord>(this.endpoint('admin/violations'), body);
  }

  deleteViolation(id: number): Observable<void> {
    return this.api.delete<void>(this.endpoint(`admin/violations/${id}`));
  }

  getInspections(params: QueryParams = {}): Observable<ApiRecord[]> {
    return this.api.get<ApiRecord[]>(this.endpoint('admin/inspections'), { params });
  }

  createInspection(body: Record<string, unknown>): Observable<ApiRecord> {
    return this.api.post<ApiRecord>(this.endpoint('admin/inspections'), body);
  }

  deleteInspection(id: number): Observable<void> {
    return this.api.delete<void>(this.endpoint(`admin/inspections/${id}`));
  }

  /**
   * Descarga un reporte (rent-roll/vacancies/delinquency/pnl/kpis) en formato
   * binario Excel o PDF generado por el backend.
   */
  downloadReport(
    report:
      | 'rent-roll'
      | 'vacancies'
      | 'delinquency'
      | 'pnl'
      | 'maintenance'
      | 'owners'
      | 'cash-flow'
      | 'budget-vs-actual'
      | 'kpis',
    format: 'excel' | 'pdf',
    params: QueryParams = {},
  ): Observable<Blob> {
    const url = `${environment.apiUrl}${this.endpoint(`admin/reports/${report}`)}`;
    return this.http.get(url, {
      params: { ...this.toStringParams(params), format },
      responseType: 'blob',
    });
  }

  private toStringParams(params: QueryParams): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined) {
        result[key] = String(value);
      }
    }
    return result;
  }

  private readonly http = inject(HttpClient);

  private endpoint(path: string): string {
    return this.slugService.buildApiEndpoint(path);
  }
}
