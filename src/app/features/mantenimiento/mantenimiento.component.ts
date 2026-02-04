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
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { LucideAngularModule, Plus, Search, Filter, MoreVertical, Clock, AlertCircle, CheckCircle2, XCircle, Wrench, Home, User, Calendar, TrendingUp } from 'lucide-angular';
import { MaintenanceService } from '../../core/services/maintenance.service';
import { MaintenanceRequest, MaintenanceStatus, MaintenancePriority, MaintenanceCategory } from '../../core/models/maintenance-request.model';
import { RequestDetailComponent } from './components/request-detail.component';
import { RequestFormComponent } from './components/request-form.component';

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
    MatTabsModule,
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
  readonly Plus = Plus;
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

  // Enums for template
  MaintenanceStatus = MaintenanceStatus;
  MaintenancePriority = MaintenancePriority;
  MaintenanceCategory = MaintenanceCategory;

  // State
  searchQuery = signal('');
  selectedStatus = signal<MaintenanceStatus | 'all'>('all');
  selectedPriority = signal<MaintenancePriority | 'all'>('all');
  selectedCategory = signal<MaintenanceCategory | 'all'>('all');
  selectedTab = signal(0);

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
        req.propertyName.toLowerCase().includes(query) ||
        req.tenantName.toLowerCase().includes(query) ||
        req.id.toLowerCase().includes(query)
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
    return requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  });

  // Actions
  onTabChange(index: number): void {
    this.selectedTab.set(index);

    // Auto-filter based on tab
    switch (index) {
      case 0: // All
        this.selectedStatus.set('all');
        break;
      case 1: // Pending
        this.selectedStatus.set(MaintenanceStatus.PENDING);
        break;
      case 2: // In Progress
        this.selectedStatus.set(MaintenanceStatus.IN_PROGRESS);
        break;
      case 3: // Completed
        this.selectedStatus.set(MaintenanceStatus.COMPLETED);
        break;
    }
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedStatus.set('all');
    this.selectedPriority.set('all');
    this.selectedCategory.set('all');
  }

  openNewRequestDialog(): void {
    const dialogRef = this.dialog.open(RequestFormComponent, {
      width: '800px',
      maxWidth: '95vw',
      panelClass: 'request-form-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Request was created, list will update automatically via signal
      }
    });
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
    this.maintenanceService.updateStatus(request.id, newStatus);
  }

  updateRequestPriority(request: MaintenanceRequest, newPriority: MaintenancePriority): void {
    this.maintenanceService.updatePriority(request.id, newPriority);
  }

  deleteRequest(request: MaintenanceRequest): void {
    if (confirm(`¿Estás seguro de eliminar la solicitud "${request.title}"?`)) {
      this.maintenanceService.deleteRequest(request.id);
    }
  }

  getStatusColor(status: MaintenanceStatus): string {
    switch (status) {
      case MaintenanceStatus.PENDING:
        return 'status-pending';
      case MaintenanceStatus.IN_PROGRESS:
        return 'status-in-progress';
      case MaintenanceStatus.COMPLETED:
        return 'status-completed';
      case MaintenanceStatus.CANCELLED:
        return 'status-cancelled';
      default:
        return '';
    }
  }

  getPriorityColor(priority: MaintenancePriority): string {
    switch (priority) {
      case MaintenancePriority.LOW:
        return 'priority-low';
      case MaintenancePriority.MEDIUM:
        return 'priority-medium';
      case MaintenancePriority.HIGH:
        return 'priority-high';
      case MaintenancePriority.EMERGENCY:
        return 'priority-emergency';
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

