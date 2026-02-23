import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, combineLatest, map } from 'rxjs';
import { ApplicationService } from '../../core/services/application.service';
import { ApplicationListItem, ApplicationStatus } from '../../core/models/application.model';

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './solicitudes.component.html',
  styleUrls: ['./solicitudes.component.css']
})
export class SolicitudesComponent implements OnInit {
  private applicationService = inject(ApplicationService);

  applications$?: Observable<ApplicationListItem[]>;
  filteredApplications$?: Observable<ApplicationListItem[]>;

  selectedStatus: string = '';
  searchTerm: string = '';

  statuses = [
    { value: '', label: 'Todos' },
    { value: 'PENDIENTE', label: 'Pendientes' },
    { value: 'APROBADA', label: 'Aprobadas' },
    { value: 'RECHAZADA', label: 'Rechazadas' }
  ];

  metrics$?: Observable<Metrics>;

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.applications$ = this.applicationService.getAllApplications(
      this.selectedStatus ? { status: this.selectedStatus as ApplicationStatus } : undefined
    );

    this.filteredApplications$ = combineLatest([this.applications$]).pipe(
      map(([applications]) => {
        if (!this.searchTerm) return applications;
        const search = this.searchTerm.toLowerCase();
        return applications.filter(app =>
          app.personal_data.full_name.toLowerCase().includes(search) ||
          app.applicant_email.toLowerCase().includes(search) ||
          app.property_title.toLowerCase().includes(search)
        );
      })
    );

    this.metrics$ = this.applications$.pipe(
      map(applications => this.calculateMetrics(applications))
    );
  }

  onStatusChange(): void {
    this.loadApplications();
  }

  onSearch(): void {
    // El filtering se hace en el cliente con combineLatest
  }

  clearSearch(): void {
    this.searchTerm = '';
  }

  getStatusBadgeClass(status: string): string {
    return this.applicationService.getStatusBadgeClass(status);
  }

  getStatusIcon(status: string): string {
    return this.applicationService.getStatusIcon(status);
  }

  private calculateMetrics(applications: ApplicationListItem[]): Metrics {
    return {
      total: applications.length,
      pendientes: applications.filter(a => a.status === 'PENDIENTE').length,
      aprobadas: applications.filter(a => a.status === 'APROBADA').length,
      rechazadas: applications.filter(a => a.status === 'RECHAZADA').length
    };
  }
}

interface Metrics {
  total: number;
  pendientes: number;
  aprobadas: number;
  rechazadas: number;
}
