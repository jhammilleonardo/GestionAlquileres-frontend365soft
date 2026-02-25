import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  LucideAngularModule,
  ArrowLeft, User, Briefcase, Home, Phone, CheckCircle2,
  XCircle, AlertCircle, FileText, Calendar, MessageSquare, Zap, Mail
} from 'lucide-angular';
import { ApplicationService } from '../../../../core/services/application.service';
import { Application, ApplicationStatus } from '../../../../core/models/application.model';

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatCardModule, MatButtonModule, MatChipsModule,
    MatProgressSpinnerModule, MatTooltipModule,
    LucideAngularModule
  ],
  templateUrl: './application-detail.component.html',
  styleUrls: ['./application-detail.component.css']
})
export class ApplicationDetailComponent implements OnInit {
  // Icons
  readonly ArrowLeft = ArrowLeft;
  readonly User = User;
  readonly Briefcase = Briefcase;
  readonly Home = Home;
  readonly Phone = Phone;
  readonly CheckCircle2 = CheckCircle2;
  readonly XCircle = XCircle;
  readonly AlertCircle = AlertCircle;
  readonly FileText = FileText;
  readonly Calendar = Calendar;
  readonly MessageSquare = MessageSquare;
  readonly Zap = Zap;
  readonly Mail = Mail;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private applicationService = inject(ApplicationService);
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  error: string | null = null;
  application: Application | null = null;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (!id) {
        this.error = 'ID de solicitud no válido';
        this.loading = false;
        this.cdr.markForCheck();
        return;
      }

      this.applicationService.getApplicationById(id).subscribe({
        next: (data) => {
          this.application = data;
          this.loading = false;
          this.error = null;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.message || err.message || 'Error al cargar la solicitud';
          this.cdr.markForCheck();
        }
      });
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PENDIENTE': return '#f59e0b';
      case 'APROBADA':  return '#10b981';
      case 'RECHAZADA': return '#ef4444';
      default:          return '#64748b';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PENDIENTE': return 'Pendiente';
      case 'APROBADA':  return 'Aprobada';
      case 'RECHAZADA': return 'Rechazada';
      default:          return status;
    }
  }

  canBeApproved(status: ApplicationStatus): boolean {
    return status === 'PENDIENTE';
  }

  canBeRejected(status: ApplicationStatus): boolean {
    return status === 'PENDIENTE';
  }

  createContract(app: Application): void {
    this.router.navigate(['../../contratos/nuevo'], {
      relativeTo: this.route,
      queryParams: {
        tenant_id: app.applicant_id,
        property_id: app.property_id
      }
    });
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
