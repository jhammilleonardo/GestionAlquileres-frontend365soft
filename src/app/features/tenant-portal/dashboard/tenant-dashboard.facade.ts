import { Injectable, computed, inject } from '@angular/core';
import { TenantAuthService } from '../../../core/services/tenant/tenant-auth.service';
import { TenantMaintenanceService } from '../../../core/services/tenant/tenant-maintenance.service';
import { TenantPaymentService } from '../../../core/services/tenant/tenant-payment.service';
import { InternalMessageService } from '../../../core/services/internal-message.service';
import { TenantDocumentService } from '../../../core/services/tenant/tenant-document.service';
import { SlugService } from '../../../core/services/slug.service';
import {
  MaintenanceStatus,
  MaintenanceStatusLabels,
  MaintenancePriorityLabels,
} from '../../../core/models/maintenance-request.model';
import { PaymentStatus, PaymentStatusLabels } from '../../../core/models/payment.model';
import { AppStatusTone } from '../../../shared/ui/status-badge/status-badge.component';

@Injectable()
export class TenantDashboardFacade {
  readonly auth = inject(TenantAuthService);
  readonly maintenance = inject(TenantMaintenanceService);
  readonly payments = inject(TenantPaymentService);
  readonly messages = inject(InternalMessageService);
  readonly documents = inject(TenantDocumentService);
  private readonly slugService = inject(SlugService);

  readonly statusLabels = MaintenanceStatusLabels;
  readonly priorityLabels = MaintenancePriorityLabels;
  readonly paymentStatusLabels = PaymentStatusLabels;

  readonly pagosNuevoUrl = computed(() => this.slugService.buildUrl('/portal/pagos/nuevo'));
  readonly mantenimientoUrl = computed(() => this.slugService.buildUrl('/portal/mantenimiento'));
  readonly mantenimientoNuevoUrl = computed(() =>
    this.slugService.buildUrl('/portal/mantenimiento/nueva'),
  );
  readonly pagosUrl = computed(() => this.slugService.buildUrl('/portal/pagos'));
  readonly mensajesUrl = computed(() => this.slugService.buildUrl('/portal/mensajes'));
  readonly documentosUrl = computed(() => this.slugService.buildUrl('/portal/documentos'));

  constructor() {
    this.maintenance.loadMyRequests();
    this.maintenance.loadStats();
    this.payments.loadPayments();
    this.payments.loadStats();
    this.messages.refreshUnread().subscribe({ error: () => undefined });
  }

  readonly buildRequestDetailUrl = (requestId: number): string =>
    this.slugService.buildUrl(`/portal/mantenimiento/${requestId}`);

  getFirstName(): string {
    const name = this.auth.currentUser()?.name || '';
    return name.split(' ')[0] || 'Usuario';
  }

  readonly getMaintenanceStatusTone = (status: MaintenanceStatus): AppStatusTone => {
    const tones: Record<MaintenanceStatus, AppStatusTone> = {
      [MaintenanceStatus.NEW]: 'info',
      [MaintenanceStatus.IN_PROGRESS]: 'warning',
      [MaintenanceStatus.COMPLETED]: 'success',
      [MaintenanceStatus.DEFERRED]: 'neutral',
      [MaintenanceStatus.CLOSED]: 'neutral',
    };

    return tones[status] ?? 'neutral';
  };

  readonly getPaymentStatusTone = (status: PaymentStatus): AppStatusTone => {
    const tones: Record<PaymentStatus, AppStatusTone> = {
      [PaymentStatus.PENDING]: 'warning',
      [PaymentStatus.PROCESSING]: 'info',
      [PaymentStatus.APPROVED]: 'success',
      [PaymentStatus.REJECTED]: 'danger',
      [PaymentStatus.FAILED]: 'danger',
      [PaymentStatus.REFUNDED]: 'info',
      [PaymentStatus.REVERSED]: 'neutral',
      [PaymentStatus.DISPUTED]: 'warning',
    };

    return tones[status] ?? 'neutral';
  };
}
