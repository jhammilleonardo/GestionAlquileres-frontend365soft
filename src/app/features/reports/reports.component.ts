import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

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
    ReportBarChartComponent,
    ReportDonutChartComponent,
    ReportLineChartComponent,
  ],
  providers: [ReportsFacade],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsComponent {
  protected readonly facade = inject(ReportsFacade);

  readonly statusOptions: readonly AppSelectOption<string>[] = [
    { value: 'active', label: 'Activo' },
    { value: 'available', label: 'Disponible' },
    { value: 'occupied', label: 'Ocupado' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'overdue', label: 'En mora' },
  ];

  readonly reportOptions: readonly AppSegmentedControlOption<string>[] = this.facade.reports.map(
    (report) => ({
      label: report.label,
      value: report.type,
    }),
  );

  constructor() {
    this.facade.loadDashboard();
  }

  protected selectReport(type: string | null): void {
    if (type) this.facade.loadReport(type as ReportType);
  }
}
