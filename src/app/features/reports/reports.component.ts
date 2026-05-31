import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { ApiRecord } from '../../core/services/admin/admin-operations.service';
import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { AppDatePickerComponent } from '../../shared/ui/date-picker/date-picker.component';
import { AppEmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AppLoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { AppPageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { AppSelectComponent, AppSelectOption } from '../../shared/ui/select/select.component';
import { AppTableColumn, AppTableComponent } from '../../shared/ui/table/table.component';
import { AppTextFieldComponent } from '../../shared/ui/text-field/text-field.component';
import { ReportsFacade } from './reports.facade';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    AppButtonComponent,
    AppDatePickerComponent,
    AppEmptyStateComponent,
    AppLoadingStateComponent,
    AppPageHeaderComponent,
    AppSelectComponent,
    AppTableComponent,
    AppTextFieldComponent,
    CurrencyPipe,
    DecimalPipe,
    ReactiveFormsModule,
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

  readonly columns: AppTableColumn<ApiRecord>[] = [
    { key: 'property', label: 'Propiedad' },
    { key: 'unit', label: 'Unidad' },
    { key: 'tenant', label: 'Inquilino' },
    { key: 'status', label: 'Estado' },
    { key: 'amount', label: 'Monto', align: 'right' },
  ];

  constructor() {
    this.facade.loadDashboard();
  }
}
