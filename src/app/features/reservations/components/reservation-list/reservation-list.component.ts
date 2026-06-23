import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { SlicePipe } from '@angular/common';

import {
  AdminReservation,
  ReservationAction,
  ReservationStatus,
} from '../../../../core/models/reservation-admin.model';
import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import {
  AppStatusBadgeComponent,
  AppStatusTone,
} from '../../../../shared/ui/status-badge/status-badge.component';

export interface ReservationActionEvent {
  reservation: AdminReservation;
  action: ReservationAction;
}

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [SlicePipe, TranslocoModule, AppButtonComponent, AppStatusBadgeComponent],
  templateUrl: './reservation-list.component.html',
  styleUrl: '../../reservations.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationListComponent {
  readonly reservations = input.required<readonly AdminReservation[]>();
  readonly busyId = input<number | null>(null);
  /** Calcula las acciones disponibles para un estado (provisto por la fachada). */
  readonly actionsFor = input.required<(r: AdminReservation) => readonly ReservationAction[]>();
  readonly toneFor = input.required<(s: ReservationStatus) => AppStatusTone>();

  readonly actionRequested = output<ReservationActionEvent>();

  emitAction(reservation: AdminReservation, action: ReservationAction): void {
    this.actionRequested.emit({ reservation, action });
  }
}
