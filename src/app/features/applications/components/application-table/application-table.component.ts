import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { Clock, Eye, FileText, LucideAngularModule, XCircle } from 'lucide-angular';

import { ApplicationListItem, ApplicationStatus } from '../../../../core/models/application.model';
import { TenantCurrencyPipe } from '../../../../shared/pipes/tenant-currency.pipe';
import { TenantDatePipe } from '../../../../shared/pipes/tenant-date.pipe';
import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { AppLoadingStateComponent } from '../../../../shared/ui/loading-state/loading-state.component';
import {
  AppStatusBadgeComponent,
  AppStatusTone,
} from '../../../../shared/ui/status-badge/status-badge.component';

@Component({
  selector: 'app-application-table',
  standalone: true,
  imports: [
    RouterModule,
    TranslocoModule,
    LucideAngularModule,
    TenantCurrencyPipe,
    TenantDatePipe,
    AppButtonComponent,
    AppLoadingStateComponent,
    AppStatusBadgeComponent,
  ],
  templateUrl: './application-table.component.html',
  styleUrl: '../../applications.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationTableComponent {
  readonly applications = input.required<readonly ApplicationListItem[]>();
  readonly total = input.required<number>();
  readonly loading = input.required<boolean>();
  readonly error = input<string | null>(null);

  readonly retryRequested = output<void>();

  readonly FileText = FileText;
  readonly Eye = Eye;
  readonly Clock = Clock;
  readonly XCircle = XCircle;

  getStatusTone(status: ApplicationStatus): AppStatusTone {
    const tones: Record<ApplicationStatus, AppStatusTone> = {
      [ApplicationStatus.PENDIENTE]: 'warning',
      [ApplicationStatus.APROBADA]: 'success',
      [ApplicationStatus.RECHAZADA]: 'danger',
    };
    return tones[status] ?? 'neutral';
  }
}
