import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoModule, provideTranslocoScope } from '@jsverse/transloco';

import { AppEmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AppLoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { AppPageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { AppPaginationComponent } from '../../shared/ui/pagination/pagination.component';
import { ReservationFiltersComponent } from './components/reservation-filters/reservation-filters.component';
import {
  ReservationActionEvent,
  ReservationListComponent,
} from './components/reservation-list/reservation-list.component';
import { ReservationsAdminFacade } from './reservations.facade';
import { ReservationAnalyticsComponent } from './analytics/reservation-analytics.component';

@Component({
  selector: 'app-reservations',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslocoModule,
    AppLoadingStateComponent,
    AppEmptyStateComponent,
    AppPageHeaderComponent,
    AppPaginationComponent,
    ReservationFiltersComponent,
    ReservationListComponent,
    ReservationAnalyticsComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'reservas', alias: 'reservations' })],
  templateUrl: './reservations.component.html',
  styleUrl: './reservations.component.scss',
})
export class ReservationsComponent extends ReservationsAdminFacade {
  onActionRequested(event: ReservationActionEvent): void {
    void this.applyAction(event.reservation, event.action);
  }
}
