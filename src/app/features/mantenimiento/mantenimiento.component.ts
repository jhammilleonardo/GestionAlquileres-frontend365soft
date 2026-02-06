import { Component, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { LucideAngularModule, Search, Filter, MoreVertical, Clock, AlertCircle, CheckCircle2, XCircle, Wrench, Home, User, Calendar, TrendingUp, MessageSquare } from 'lucide-angular';
import { MaintenanceService } from '../../core/services/maintenance.service';
import {
  MaintenanceRequest,
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceCategory,
  MaintenanceStatusLabels,
  MaintenancePriorityLabels,
  MaintenanceCategoryLabels
} from '../../core/models/maintenance-request.model';
import { RequestDetailComponent } from './components/request-detail.component';

@Component({
  selector: 'app-mantenimiento',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatBadgeModule,
    MatCardModule,
    MatMenuModule,
    MatDialogModule,
    MatTooltipModule,
    MatDividerModule,
    LucideAngularModule
  ],
  templateUrl: './mantenimiento.component.html',
  styleUrl: './mantenimiento.component.scss'
})
export class MantenimientoComponent {
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

  // Services
  private maintenanceService = inject(MaintenanceService);
  private dialog = inject(MatDialog);

  // Computed data
  allRequests = this.maintenanceService.requests;
  stats = this.maintenanceService.stats;

  filteredRequests = computed(() => {
    let requests = this.allRequests();

    // Filter by search query
    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      requests = requests.filter(req =>
        req.title.toLowerCase().includes(query) ||
        req.description.toLowerCase().includes(query) ||
        req.ticket_number.toLowerCase().includes(query) ||
        req.property?.title?.toLowerCase().includes(query) ||
        req.id.toString().includes(query)
      );
    }

    // Filter by status
    if (this.selectedStatus() !== 'all') {
      requests = requests.filter(req => req.status === this.selectedStatus());
    }

    // Filter by priority
    if (this.selectedPriority() !== 'all') {
      requests = requests.filter(req => req.priority === this.selectedPriority());
    }

    // Filter by category
    if (this.selectedCategory() !== 'all') {
      requests = requests.filter(req => req.category === this.selectedCategory());
    }

    // Sort by date (newest first)
    return requests.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
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
    // TODO: Implementar formulario de nueva solicitud
    console.log('Abrir formulario de nueva solicitud');
  }

  viewRequestDetails(request: MaintenanceRequest): void {
    const dialogRef = this.dialog.open(RequestDetailComponent, {
      width: '800px',
      maxWidth: '95vw',
      data: { request },
      panelClass: 'request-detail-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.deleted) {
        // Request was deleted, no need to do anything as service already updated
      }
      // Dialog automatically updates the service, so changes are reflected
    });
  }

  updateRequestStatus(request: MaintenanceRequest, newStatus: MaintenanceStatus): void {
    this.maintenanceService.updateStatus(request.id, newStatus).subscribe({
      next: () => {
        console.log('Status updated successfully');
      },
      error: (error) => {
        console.error('Error updating status:', error);
        alert('Error al actualizar el estado de la solicitud');
      }
    });
  }

  updateRequestPriority(request: MaintenanceRequest, newPriority: MaintenancePriority): void {
    this.maintenanceService.updatePriority(request.id, newPriority).subscribe({
      next: () => {
        console.log('Priority updated successfully');
      },
      error: (error) => {
        console.error('Error updating priority:', error);
        alert('Error al actualizar la prioridad de la solicitud');
      }
    });
  }

  deleteRequest(request: MaintenanceRequest): void {
    if (confirm(`¿Estás seguro de eliminar la solicitud "${request.title}"?`)) {
      this.maintenanceService.deleteRequest(request.id).subscribe({
        next: () => {
          console.log('Request deleted successfully');
        },
        error: (error) => {
          console.error('Error deleting request:', error);
          alert('Error al eliminar la solicitud');
        }
      });
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

  getCategoryIcon(category: MaintenanceCategory): any {
    // Return appropriate icon based on category
    return this.Wrench; // Default icon for now
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Hoy';
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    }
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

