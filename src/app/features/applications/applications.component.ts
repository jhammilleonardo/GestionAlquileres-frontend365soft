import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { provideTranslocoScope, TranslocoModule } from '@jsverse/transloco';

import { ApplicationStatus } from '../../core/models/application.model';
import { AppPageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { AppSelectOption } from '../../shared/ui/select/select.component';
import { ApplicationFiltersComponent } from './components/application-filters/application-filters.component';
import { ApplicationStatsComponent } from './components/application-stats/application-stats.component';
import { ApplicationTableComponent } from './components/application-table/application-table.component';
import { ApplicationsFacade } from './applications.facade';

@Component({
  selector: 'app-applications',
  standalone: true,
  providers: [provideTranslocoScope('solicitudes'), ApplicationsFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslocoModule,
    AppPageHeaderComponent,
    ApplicationFiltersComponent,
    ApplicationStatsComponent,
    ApplicationTableComponent,
  ],
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.css'],
})
export class ApplicationsComponent {
  readonly facade = inject(ApplicationsFacade);

  readonly statusOptions: AppSelectOption<string>[] = [
    { label: 'Todas', value: '' },
    { label: 'Pendiente', value: ApplicationStatus.PENDIENTE },
    { label: 'Aprobada', value: ApplicationStatus.APROBADA },
    { label: 'Rechazada', value: ApplicationStatus.RECHAZADA },
  ];

  constructor() {
    this.facade.loadApplications();
  }
}
