import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  LucideAngularModule,
  Search,
  X,
  XCircle,
} from 'lucide-angular';
import { provideTranslocoScope, TranslocoModule } from '@jsverse/transloco';

import { ApplicationStatus } from '../../core/models/application.model';
import { TenantDatePipe } from '../../shared/pipes/tenant-date.pipe';
import { TenantCurrencyPipe } from '../../shared/pipes/tenant-currency.pipe';
import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { AppLoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { AppPageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import {
  AppStatusBadgeComponent,
  AppStatusTone,
} from '../../shared/ui/status-badge/status-badge.component';
import { AppTextFieldComponent } from '../../shared/ui/text-field/text-field.component';
import { AppSelectComponent, AppSelectOption } from '../../shared/ui/select/select.component';
import { SolicitudesFacade } from './solicitudes.facade';

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  providers: [provideTranslocoScope('solicitudes'), SolicitudesFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    FormsModule,
    LucideAngularModule,
    TranslocoModule,
    TenantDatePipe,
    TenantCurrencyPipe,
    AppButtonComponent,
    AppLoadingStateComponent,
    AppPageHeaderComponent,
    AppStatusBadgeComponent,
    AppTextFieldComponent,
    AppSelectComponent,
  ],
  templateUrl: './solicitudes.component.html',
  styleUrls: ['./solicitudes.component.css'],
})
export class SolicitudesComponent {
  readonly Search = Search;
  readonly FileText = FileText;
  readonly Eye = Eye;
  readonly CheckCircle2 = CheckCircle2;
  readonly XCircle = XCircle;
  readonly Clock = Clock;
  readonly X = X;

  readonly facade = inject(SolicitudesFacade);

  readonly statusOptions: AppSelectOption<string>[] = [
    { label: 'Todas', value: '' },
    { label: 'Pendiente', value: ApplicationStatus.PENDIENTE },
    { label: 'Aprobada', value: ApplicationStatus.APROBADA },
    { label: 'Rechazada', value: ApplicationStatus.RECHAZADA },
  ];

  constructor() {
    this.facade.loadApplications();
  }

  getStatusTone(status: ApplicationStatus): AppStatusTone {
    const tones: Record<ApplicationStatus, AppStatusTone> = {
      [ApplicationStatus.PENDIENTE]: 'warning',
      [ApplicationStatus.APROBADA]: 'success',
      [ApplicationStatus.RECHAZADA]: 'danger',
    };
    return tones[status] ?? 'neutral';
  }
}
