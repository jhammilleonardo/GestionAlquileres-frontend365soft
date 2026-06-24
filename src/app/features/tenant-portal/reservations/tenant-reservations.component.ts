import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { LucideAngularModule, CalendarCheck, MapPin, Moon } from 'lucide-angular';
import { TranslocoModule, provideTranslocoScope } from '@jsverse/transloco';

import { MyReservation } from '../../../core/services/reservation.service';
import { TenantReservationsFacade } from './tenant-reservations.facade';
import { ReservationPaymentDialogComponent } from './reservation-payment-dialog.component';
import { ReservationReviewDialogComponent } from './reservation-review-dialog.component';
import { ReservationExtendDialogComponent } from './reservation-extend-dialog.component';
import { ReservationCountdownComponent } from './reservation-countdown.component';
import { TenantDatePipe } from '../../../shared/pipes/tenant-date.pipe';
import { TenantCurrencyPipe } from '../../../shared/pipes/tenant-currency.pipe';
import { AppButtonComponent } from '../../../shared/ui/button/button.component';
import { AppEmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { AppLoadingStateComponent } from '../../../shared/ui/loading-state/loading-state.component';
import { AppPageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { AppStatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tenant-reservations',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    LucideAngularModule,
    TranslocoModule,
    TenantDatePipe,
    TenantCurrencyPipe,
    AppButtonComponent,
    AppEmptyStateComponent,
    AppLoadingStateComponent,
    AppPageHeaderComponent,
    AppStatusBadgeComponent,
    ReservationPaymentDialogComponent,
    ReservationReviewDialogComponent,
    ReservationExtendDialogComponent,
    ReservationCountdownComponent,
  ],
  providers: [
    TenantReservationsFacade,
    provideTranslocoScope({ scope: 'tenant-reservas', alias: 'tenantReservations' }),
  ],
  templateUrl: './tenant-reservations.component.html',
  styleUrls: ['./tenant-reservations.component.scss'],
})
export class TenantReservationsComponent extends TenantReservationsFacade {
  readonly CalendarCheck = CalendarCheck;
  readonly MapPin = MapPin;
  readonly Moon = Moon;

  onCancel(reservation: MyReservation): void {
    void this.cancel(reservation);
  }

  onPay(reservation: MyReservation): void {
    this.openPayment(reservation);
  }

  onReview(reservation: MyReservation): void {
    this.openReview(reservation);
  }

  onExtend(reservation: MyReservation): void {
    this.openExtend(reservation);
  }
}
