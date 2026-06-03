import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';

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
import { AppTextFieldComponent } from '../../shared/ui/text-field/text-field.component';
import { AppToolbarComponent } from '../../shared/ui/toolbar/toolbar.component';
import { ReportBarChartComponent } from './components/report-bar-chart.component';
import { ReportDonutChartComponent } from './components/report-donut-chart.component';
import { ReportLineChartComponent } from './components/report-line-chart.component';
import { ReportType, ReportsFacade } from './reports.facade';

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
    AppTextFieldComponent,
    AppToolbarComponent,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule,
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
  private readonly transloco = inject(TranslocoService);

  // Refresca etiquetas traducidas al cargar el scope y al cambiar de idioma.
  private readonly translations = toSignal(this.transloco.selectTranslation('reports'), {
    initialValue: {},
  });

  readonly statusOptions = computed<readonly AppSelectOption<string>[]>(() => {
    this.translations();
    return [
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
    this.facade.loadDashboard();
  }

  protected selectReport(type: string | null): void {
    if (type) this.facade.loadReport(type as ReportType);
  }
}
