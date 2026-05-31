import { Component, computed, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PermissionsService } from '../../core/services/permissions.service';
import { TecnicoMantenimientoComponent } from './tecnico/tecnico-mantenimiento.component';
import { ActivatedRoute } from '@angular/router';
import {
  LucideAngularModule,
  Search,
  Filter,
  MoreVertical,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Wrench,
  Home,
  User,
  Calendar,
  TrendingUp,
  MessageSquare,
  type LucideIconData,
} from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { MaintenanceService } from '../../core/services/admin/maintenance.service';
import { TenantDatePipe } from '../../shared/pipes/tenant-date.pipe';
import {
  MaintenanceRequest,
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceCategory,
  MaintenanceStatusLabels,
  MaintenancePriorityLabels,
  MaintenanceCategoryLabels,
} from '../../core/models/maintenance-request.model';
import { RequestDetailComponent } from './components/request-detail.component';
import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { AppDialogComponent } from '../../shared/ui/dialog/dialog.component';
import { AppPageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { AppSelectComponent, AppSelectOption } from '../../shared/ui/select/select.component';
import {
  AppStatusBadgeComponent,
  AppStatusTone,
} from '../../shared/ui/status-badge/status-badge.component';
import { AppTextFieldComponent } from '../../shared/ui/text-field/text-field.component';
import { ToastService } from '../../shared/ui/toast/toast.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-mantenimiento',
  standalone: true,
  imports: [
    NgClass,
    FormsModule,
    LucideAngularModule,
    RequestDetailComponent,
    TecnicoMantenimientoComponent,
    TranslocoModule,
    TenantDatePipe,
    AppButtonComponent,
    AppDialogComponent,
    AppPageHeaderComponent,
    AppSelectComponent,
    AppStatusBadgeComponent,
    AppTextFieldComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'mantenimiento', alias: 'maintenance' })],
  templateUrl: './mantenimiento.component.html',
  styleUrl: './mantenimiento.component.scss',
})
export class MantenimientoComponent {
  private permissionsService = inject(PermissionsService);
  readonly isTecnico = computed(() => this.permissionsService.role() === 'TECNICO');
  // Icons
  readonly Search = Search;
  readonly Filter = Filter;
  readonly MoreVertical = MoreVertical;
  readonly Clock = Clock;
  readonly AlertCircle = AlertCircle;
  readonly CheckCircle2 = CheckCircle2;
  readonly XCircle = XCircle;
  readonly Wrench = Wrench;
  readonly Home = Home;
  readonly User = User;
  readonly Calendar = Calendar;
  readonly TrendingUp = TrendingUp;
  readonly MessageSquare = MessageSquare;

  // Enums for template
  MaintenanceStatus = MaintenanceStatus;
  MaintenancePriority = MaintenancePriority;
  MaintenanceCategory = MaintenanceCategory;

  // Labels for display (Spanish translations)
  statusLabels = MaintenanceStatusLabels;
  priorityLabels = MaintenancePriorityLabels;
  categoryLabels = MaintenanceCategoryLabels;

  // State
  searchQuery = signal('');
  selectedStatus = signal<MaintenanceStatus | 'all'>('all');
  selectedPriority = signal<MaintenancePriority | 'all'>('all');
  selectedCategory = signal<MaintenanceCategory | 'all'>('all');
  selectedRequest = signal<MaintenanceRequest | null>(null);

  // Services
  private maintenanceService = inject(MaintenanceService);
  private route = inject(ActivatedRoute);
  private confirmDialog = inject(ConfirmDialogService);
  private toast = inject(ToastService);
  readonly priorityOptions: readonly AppSelectOption<MaintenancePriority | 'all'>[] = [
    { value: 'all', label: 'Todas' },
    ...this.getPriorityValues().map((priority) => ({
      value: priority,
      label: MaintenancePriorityLabels[priority],
    })),
  ];
  readonly categoryOptions: readonly AppSelectOption<MaintenanceCategory | 'all'>[] = [
    { value: 'all', label: 'Todas' },
    ...this.getCategoryValues().map((category) => ({
      value: category,
      label: MaintenanceCategoryLabels[category],
    })),
  ];

  constructor() {
    // Load data when component initializes
    // This ensures the slug is already set by the authGuard
    this.maintenanceService.loadAllRequests();
    this.maintenanceService.loadStats();

    // Check for query param 'open' to auto-open a request detail
    this.route.queryParams.subscribe((params) => {
      if (params['open']) {
        const id = parseInt(params['open'] as string, 10);
        if (!isNaN(id)) {
          this.maintenanceService.getRequestById(id).subscribe({
            next: (request) => {
              this.selectedRequest.set(request);
            },
            error: () => {
              /* Silently ignore if not found */
            },
          });
        }
      }
    });
  }

  // Computed data
  allRequests = this.maintenanceService.requests;
  stats = this.maintenanceService.stats;

  filteredRequests = computed(() => {
    let requests = this.allRequests();

    // Filter by search query
    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      requests = requests.filter(
        (req) =>
          req.title.toLowerCase().includes(query) ||
          req.description.toLowerCase().includes(query) ||
          req.ticket_number.toLowerCase().includes(query) ||
          req.property?.title?.toLowerCase().includes(query) ||
          req.id.toString().includes(query),
      );
    }

    // Filter by status
    if (this.selectedStatus() !== 'all') {
      requests = requests.filter((req) => req.status === this.selectedStatus());
    }

    // Filter by priority
    if (this.selectedPriority() !== 'all') {
      requests = requests.filter((req) => req.priority === this.selectedPriority());
    }

    // Filter by category
    if (this.selectedCategory() !== 'all') {
      requests = requests.filter((req) => req.category === this.selectedCategory());
    }

    // Sort by date (newest first) - spread to avoid mutating the original signal array
    return [...requests].sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  });

  // Actions
  filterByStatus(status: MaintenanceStatus | 'all'): void {
    this.selectedStatus.set(status);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedStatus.set('all');
    this.selectedPriority.set('all');
    this.selectedCategory.set('all');
  }

  openRequestForm(): void {
    this.toast.info('El formulario de nueva solicitud se implementa en el flujo correspondiente.');
  }

  viewRequestDetails(request: MaintenanceRequest): void {
    this.selectedRequest.set(request);
  }

  closeRequestDetails(): void {
    this.selectedRequest.set(null);
  }

  onRequestChanged(request: MaintenanceRequest): void {
    this.selectedRequest.set(request);
  }

  onRequestDeleted(): void {
    this.selectedRequest.set(null);
  }

  updateRequestStatus(request: MaintenanceRequest, newStatus: MaintenanceStatus): void {
    this.maintenanceService.updateStatus(request.id, newStatus).subscribe({
      next: () => {
        this.toast.success('Estado actualizado');
      },
      error: () => {
        this.toast.error('Error al actualizar el estado de la solicitud');
      },
    });
  }

  updateRequestPriority(request: MaintenanceRequest, newPriority: MaintenancePriority): void {
    this.maintenanceService.updatePriority(request.id, newPriority).subscribe({
      next: () => {
        this.toast.success('Prioridad actualizada');
      },
      error: () => {
        this.toast.error('Error al actualizar la prioridad de la solicitud');
      },
    });
  }

  async deleteRequest(request: MaintenanceRequest): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Eliminar solicitud',
      message: `¿Eliminar la solicitud "${request.title}"? Esta accion no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    this.maintenanceService.deleteRequest(request.id).subscribe({
      next: () => {
        this.toast.success('Solicitud eliminada');
      },
      error: () => {
        this.toast.error('Error al eliminar la solicitud');
      },
    });
  }

  getStatusTone(status: MaintenanceStatus): AppStatusTone {
    switch (status) {
      case MaintenanceStatus.COMPLETED:
      case MaintenanceStatus.CLOSED:
        return 'success';
      case MaintenanceStatus.IN_PROGRESS:
        return 'info';
      case MaintenanceStatus.DEFERRED:
        return 'warning';
      case MaintenanceStatus.NEW:
      default:
        return 'neutral';
    }
  }

  getStatusColor(status: MaintenanceStatus): string {
    switch (status) {
      case MaintenanceStatus.NEW:
        return 'status-new';
      case MaintenanceStatus.IN_PROGRESS:
        return 'status-in-progress';
      case MaintenanceStatus.COMPLETED:
        return 'status-completed';
      case MaintenanceStatus.DEFERRED:
        return 'status-deferred';
      case MaintenanceStatus.CLOSED:
        return 'status-closed';
      default:
        return '';
    }
  }

  getPriorityColor(priority: MaintenancePriority): string {
    switch (priority) {
      case MaintenancePriority.LOW:
        return 'priority-low';
      case MaintenancePriority.NORMAL:
        return 'priority-normal';
      case MaintenancePriority.HIGH:
        return 'priority-high';
      default:
        return '';
    }
  }

  getCategoryIcon(_category: MaintenanceCategory): LucideIconData {
    // Return appropriate icon based on category
    return this.Wrench; // Default icon for now
  }

  getStatusValues(): MaintenanceStatus[] {
    return Object.values(MaintenanceStatus);
  }

  getPriorityValues(): MaintenancePriority[] {
    return Object.values(MaintenancePriority);
  }

  getCategoryValues(): MaintenanceCategory[] {
    return Object.values(MaintenanceCategory);
  }
}
