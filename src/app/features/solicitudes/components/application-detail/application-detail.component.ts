import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgClass, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { provideTranslocoScope, TranslocoModule } from '@jsverse/transloco';
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle2,
  FileText,
  Home,
  LucideAngularModule,
  Mail,
  MessageSquare,
  Phone,
  User,
  XCircle,
  Zap,
} from 'lucide-angular';

import { Application, ApplicationStatus } from '../../../../core/models/application.model';
import { TenantCurrencyPipe } from '../../../../shared/pipes/tenant-currency.pipe';
import { TenantDatePipe } from '../../../../shared/pipes/tenant-date.pipe';
import {
  AppButtonComponent,
  AppEmptyStateComponent,
  AppLoadingStateComponent,
  AppStatusBadgeComponent,
  AppStatusTone,
} from '../../../../shared/ui';
import { ApplicationDetailFacade } from './application-detail.facade';

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [
    TitleCasePipe,
    NgClass,
    RouterModule,
    LucideAngularModule,
    TranslocoModule,
    TenantDatePipe,
    TenantCurrencyPipe,
    AppButtonComponent,
    AppEmptyStateComponent,
    AppLoadingStateComponent,
    AppStatusBadgeComponent,
  ],
  providers: [provideTranslocoScope('solicitudes'), ApplicationDetailFacade],
  templateUrl: './application-detail.component.html',
  styleUrls: ['./application-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationDetailComponent {
  protected readonly facade = inject(ApplicationDetailFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly AlertCircle = AlertCircle;
  protected readonly ArrowLeft = ArrowLeft;
  protected readonly Briefcase = Briefcase;
  protected readonly Calendar = Calendar;
  protected readonly CheckCircle2 = CheckCircle2;
  protected readonly FileText = FileText;
  protected readonly Home = Home;
  protected readonly Mail = Mail;
  protected readonly MessageSquare = MessageSquare;
  protected readonly Phone = Phone;
  protected readonly User = User;
  protected readonly XCircle = XCircle;
  protected readonly Zap = Zap;

  protected readonly applicationId = computed(() => this.facade.application()?.id ?? null);

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.facade.load(Number(params.get('id')));
    });
  }

  protected getStatusTone(status: ApplicationStatus): AppStatusTone {
    const toneByStatus: Record<ApplicationStatus, AppStatusTone> = {
      [ApplicationStatus.PENDIENTE]: 'warning',
      [ApplicationStatus.APROBADA]: 'success',
      [ApplicationStatus.RECHAZADA]: 'danger',
    };

    return toneByStatus[status];
  }

  protected canBeApproved(status: ApplicationStatus): boolean {
    return this.facade.canBeApproved(status);
  }

  protected canBeRejected(status: ApplicationStatus): boolean {
    return this.facade.canBeRejected(status);
  }

  protected createContract(application: Application): void {
    void this.router.navigate(['../../contratos/nuevo'], {
      relativeTo: this.route,
      queryParams: {
        tenant_id: application.applicant_id,
        property_id: application.property_id,
      },
    });
  }

  protected goBack(): void {
    void this.router.navigate(['../'], { relativeTo: this.route });
  }
}
