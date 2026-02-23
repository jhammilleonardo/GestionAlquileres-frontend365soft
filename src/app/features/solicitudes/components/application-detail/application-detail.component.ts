import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Observable, switchMap, tap, catchError, of } from 'rxjs';
import { ApplicationService } from '../../../../core/services/application.service';
import { Application, ApplicationStatus } from '../../../../core/models/application.model';

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './application-detail.component.html',
  styleUrls: ['./application-detail.component.css']
})
export class ApplicationDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private applicationService = inject(ApplicationService);
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  error: string | null = null;
  application: Application | null = null;

  ngOnInit(): void {
    console.log('[ApplicationDetail] Component initialized');
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      console.log('[ApplicationDetail] Loading application with ID:', id);
      if (!id) {
        this.error = 'ID de solicitud no válido';
        this.loading = false;
        this.cdr.markForCheck();
        return;
      }

      this.applicationService.getApplicationById(id).subscribe({
        next: (data) => {
          console.log('[ApplicationDetail] Application loaded:', data);
          this.application = data;
          this.loading = false;
          this.error = null;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('[ApplicationDetail] Error loading application:', err);
          this.loading = false;
          this.error = err.error?.message || err.message || 'Error al cargar la solicitud';
          this.cdr.markForCheck();
        }
      });
    });
  }

  getStatusBadgeClass(status: string): string {
    return this.applicationService.getStatusBadgeClass(status);
  }

  getStatusIcon(status: string): string {
    return this.applicationService.getStatusIcon(status);
  }

  canBeApproved(status: ApplicationStatus): boolean {
    return status === 'PENDIENTE';
  }

  canBeRejected(status: ApplicationStatus): boolean {
    return status === 'PENDIENTE';
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
