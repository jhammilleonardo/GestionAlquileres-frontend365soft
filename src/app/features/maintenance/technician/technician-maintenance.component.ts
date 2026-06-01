import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import {
  LucideAngularModule,
  Wrench,
  AlertCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
} from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { MaintenanceService } from '../../../core/services/admin/maintenance.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  MaintenanceRequest,
  MaintenanceStatus,
} from '../../../core/models/maintenance-request.model';
import { OrderDetailComponent } from './components/order-detail/order-detail.component';
import { AppLoadingStateComponent } from '../../../shared/ui/loading-state/loading-state.component';

type FilterTab =
  | 'all'
  | MaintenanceStatus.NEW
  | MaintenanceStatus.IN_PROGRESS
  | MaintenanceStatus.COMPLETED;

@Component({
  selector: 'app-technician-maintenance',
  standalone: true,
  providers: [provideTranslocoScope('tecnico')],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppLoadingStateComponent, LucideAngularModule, OrderDetailComponent, TranslocoModule],
  templateUrl: './technician-maintenance.component.html',
  styleUrl: './technician-maintenance.component.scss',
})
export class TechnicianMaintenanceComponent {
  // Icons
  readonly WrenchIcon = Wrench;
  readonly AlertCircleIcon = AlertCircle;
  readonly ClockIcon = Clock;
  readonly CheckCircle2Icon = CheckCircle2;
  readonly ChevronRightIcon = ChevronRight;
  readonly RefreshCwIcon = RefreshCw;

  // Services
  private maintenanceService = inject(MaintenanceService);
  private authService = inject(AuthService);

  readonly MaintenanceStatus = MaintenanceStatus;

  // Estado local — solo el tab activo y la orden seleccionada
  activeTab = signal<FilterTab>('all');
  selectedRequest = signal<MaintenanceRequest | null>(null);

  // isLoading viene del servicio: refleja el estado real de la petición HTTP
  readonly isLoading = this.maintenanceService.isLoading;

  // My user ID
  private readonly myUserId = computed(() => {
    const user = this.authService.currentUser();
    return user ? parseInt(user.id, 10) : null;
  });

  // All requests assigned to this TECNICO — computed reactivo al signal del servicio
  private readonly myRequests = computed(() => {
    const myId = this.myUserId();
    if (!myId) return [];
    return this.maintenanceService.requests().filter((r) => r.assigned_to === myId);
  });

  // Filtered by active tab, sorted by priority then date
  readonly filteredRequests = computed(() => {
    const tab = this.activeTab();
    const requests = this.myRequests();
    const filtered = tab === 'all' ? requests : requests.filter((r) => r.status === tab);
    return [...filtered].sort((a, b) => {
      const priorityOrder = { HIGH: 0, NORMAL: 1, LOW: 2 };
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (pDiff !== 0) return pDiff;
      return b.created_at.getTime() - a.created_at.getTime();
    });
  });

  // Tab counts
  readonly tabCounts = computed(() => {
    const reqs = this.myRequests();
    return {
      all: reqs.length,
      new: reqs.filter((r) => r.status === MaintenanceStatus.NEW).length,
      inProgress: reqs.filter((r) => r.status === MaintenanceStatus.IN_PROGRESS).length,
      completed: reqs.filter((r) => r.status === MaintenanceStatus.COMPLETED).length,
    };
  });

  selectRequest(request: MaintenanceRequest): void {
    this.selectedRequest.set(request);
  }

  closeDetail(): void {
    this.selectedRequest.set(null);
  }

  onStatusAdvanced(updated: MaintenanceRequest): void {
    // El tap() en MaintenanceService.updateRequest() ya recargó la lista.
    // Solo actualizamos la vista del detalle con el objeto ya devuelto por el backend.
    this.selectedRequest.set(updated);
  }

  refresh(): void {
    this.maintenanceService.loadAllRequests();
  }

  setTab(tab: FilterTab): void {
    this.activeTab.set(tab);
  }

  getStatusColor(status: MaintenanceStatus): string {
    switch (status) {
      case MaintenanceStatus.NEW:
        return 'status-new';
      case MaintenanceStatus.IN_PROGRESS:
        return 'status-in-progress';
      case MaintenanceStatus.COMPLETED:
        return 'status-completed';
      default:
        return 'status-other';
    }
  }
}
