import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Location } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { catchError, EMPTY } from 'rxjs';
import {
  Download,
  FileSpreadsheet,
  FileText,
  LucideAngularModule,
  RefreshCw,
} from 'lucide-angular';

import { toDateOnly } from '../../core/utils/date-only.util';
import { PropertyService } from '../../core/services/admin/property.service';
import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { AppDatePickerComponent } from '../../shared/ui/date-picker/date-picker.component';
import { AppEmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AppLoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { AppPageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import {
  AppSegmentedControlComponent,
  AppSegmentedControlOption,
} from '../../shared/ui/segmented-control/segmented-control.component';
import { AppSelectComponent, AppSelectOption } from '../../shared/ui/select/select.component';
import { AppTableComponent } from '../../shared/ui/table/table.component';
import { ReportBarChartComponent } from './components/report-bar-chart.component';
import { ReportDonutChartComponent } from './components/report-donut-chart.component';
import { ReportLineChartComponent } from './components/report-line-chart.component';
import { ReportType, ReportsFacade, VALID_REPORT_TYPES } from './reports.facade';

type DatePreset = 'current' | 'previous' | 'quarter' | 'custom';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    AppButtonComponent,
    AppDatePickerComponent,
    AppEmptyStateComponent,
    AppLoadingStateComponent,
    AppPageHeaderComponent,
    AppSegmentedControlComponent,
    AppSelectComponent,
    AppTableComponent,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule,
    LucideAngularModule,
    ReportBarChartComponent,
    ReportDonutChartComponent,
    ReportLineChartComponent,
  ],
  providers: [ReportsFacade, provideTranslocoScope('reports')],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsComponent {
  protected readonly facade = inject(ReportsFacade);

  protected readonly RefreshCw = RefreshCw;
  protected readonly Download = Download;
  protected readonly FileText = FileText;
  protected readonly FileSpreadsheet = FileSpreadsheet;
  private readonly transloco = inject(TranslocoService);
  private readonly propertyService = inject(PropertyService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);

  private readonly translations = toSignal(this.transloco.selectTranslation('reports'), {
    initialValue: {},
  });

  private readonly properties = toSignal(
    this.propertyService.getProperties().pipe(catchError(() => EMPTY)),
    { initialValue: [] },
  );

  readonly datePreset = signal<DatePreset>('current');

  readonly propertyOptions = computed<readonly AppSelectOption<string>[]>(() => {
    this.translations();
    const all: AppSelectOption<string> = {
      value: '',
      label: this.transloco.translate('reports.filters.allProperties'),
    };
    return [all, ...this.properties().map((p) => ({ value: String(p.id), label: p.title }))];
  });

  readonly statusOptions = computed<readonly AppSelectOption<string>[]>(() => {
    this.translations();
    return [
      { value: '', label: this.transloco.translate('reports.filters.allStatuses') },
      { value: 'active', label: this.transloco.translate('reports.status.active') },
      { value: 'available', label: this.transloco.translate('reports.status.available') },
      { value: 'occupied', label: this.transloco.translate('reports.status.occupied') },
      { value: 'pending', label: this.transloco.translate('reports.status.pending') },
      { value: 'overdue', label: this.transloco.translate('reports.status.overdue') },
    ];
  });

  readonly reportOptions = computed<readonly AppSegmentedControlOption<string>[]>(() =>
    this.facade.reports().map((report) => ({
      label: report.label,
      value: report.type,
    })),
  );

  constructor() {
    // Restaura el reporte activo desde el query param al cargar/recargar
    const reportParam = this.route.snapshot.queryParamMap.get('report') as ReportType | null;
    const initialReport: ReportType =
      reportParam && VALID_REPORT_TYPES.includes(reportParam) ? reportParam : 'summary';

    this.facade.loadDashboard(initialReport);
  }

  protected selectReport(type: string | null): void {
    if (!type) return;
    // Actualiza la URL sin disparar navegación de Angular (evita scroll-to-top)
    const urlTree = this.router.createUrlTree([], {
      relativeTo: this.route,
      queryParams: { report: type === 'summary' ? null : type },
      queryParamsHandling: 'merge',
    });
    this.location.replaceState(this.router.serializeUrl(urlTree));
    this.facade.loadReport(type as ReportType);
  }

  setDatePreset(preset: DatePreset): void {
    this.datePreset.set(preset);
    if (preset === 'custom') return;

    const now = new Date();
    let from: Date;
    let to: Date;

    if (preset === 'current') {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (preset === 'previous') {
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to = new Date(now.getFullYear(), now.getMonth(), 0);
    } else {
      from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    this.facade.filterForm.patchValue({ from: toDateOnly(from), to: toDateOnly(to) });
    this.facade.applyFilters();
  }

  clearAll(): void {
    this.datePreset.set('current');
    this.facade.clearFilters();
  }
}
