import { Component, inject, computed, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { LucideAngularModule, Home, Plus, FileEdit, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-angular';
import { TenantAuthService } from '../../../core/services/tenant-auth.service';
import { SlugService } from '../../../core/services/slug.service';
import { ApplicationService } from '../../../core/services/application.service';
import { Application, ApplicationListItem, ApplicationStatus } from '../../../core/models/application.model';

@Component({
  selector: 'app-home-pre-contract',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    LucideAngularModule
  ],
  template: `
    <div class="home-pre-contract">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <lucide-icon [img]="Home" [size]="32"></lucide-icon>
          </div>
          <div class="header-text">
            <h1>Bienvenido, {{ userName() }}</h1>
            <p class="subtitle">Gestiona tus solicitudes de alquiler</p>
          </div>
        </div>
        <button
          mat-raised-button
          color="primary"
          class="new-app-btn"
          (click)="goToNewApplication()">
          <lucide-icon [img]="Plus" [size]="20"></lucide-icon>
          <span>Nueva Solicitud</span>
        </button>
      </div>

      <!-- Content -->
      <div class="content-grid">
        <!-- Welcome Card -->
        <mat-card class="welcome-card">
          <div class="welcome-content">
            <div class="welcome-icon">
              <lucide-icon [img]="Home" [size]="48"></lucide-icon>
            </div>
            <h2>¡Hola de nuevo!</h2>
            <p class="welcome-text">
              Actualmente no tienes un contrato activo. Puedes explorar nuestras propiedades
              disponibles y enviar una solicitud de alquiler.
            </p>
            <div class="welcome-actions">
              <button
                mat-raised-button
                color="primary"
                (click)="goToNewApplication()">
                <lucide-icon [img]="Plus" [size]="18"></lucide-icon>
                Ver Propiedades Disponibles
              </button>
            </div>
          </div>
        </mat-card>

        <!-- My Applications Card -->
        <mat-card class="applications-card">
          <div class="card-header">
            <div class="header-title">
              <lucide-icon [img]="FileEdit" [size]="24"></lucide-icon>
              <h3>Mis Solicitudes</h3>
            </div>
            @if (applications().length > 0) {
              <button
                mat-stroked-button
                (click)="viewAllApplications()">
                Ver Todas
              </button>
            }
          </div>

          <mat-card-content>
            @if (isLoading()) {
              <div class="loading-state">
                <mat-spinner diameter="40"></mat-spinner>
                <p>Cargando tus solicitudes...</p>
              </div>
            } @else if (applications().length === 0) {
              <div class="empty-state">
                <lucide-icon [img]="FileEdit" [size]="48" class="empty-icon"></lucide-icon>
                <h4>Aún no has enviado solicitudes</h4>
                <p>Explora nuestras propiedades disponibles y envía tu primera solicitud</p>
                <button
                  mat-flat-button
                  color="primary"
                  (click)="goToNewApplication()">
                  Explorar Propiedades
                </button>
              </div>
            } @else {
              <div class="applications-list">
                @for (app of applications().slice(0, 3); track app.id) {
                  <div class="application-item" [class]="'status-' + app.status.toLowerCase()">
                    <div class="application-header">
                      <h4 class="property-title">{{ app.property_title }}</h4>
                      <span [class]="'status-chip status-' + app.status.toLowerCase()">
                        {{ getStatusLabel(app.status) }}
                      </span>
                    </div>

                    <div class="application-details">
                      <div class="detail-item">
                        <lucide-icon [img]="Clock" [size]="16"></lucide-icon>
                        <span>Enviada: {{ formatDate(app.created_at) }}</span>
                      </div>

                      @if (app.status === ApplicationStatus.PENDIENTE) {
                        <div class="detail-item pending">
                          <lucide-icon [img]="AlertCircle" [size]="16"></lucide-icon>
                          <span>Esperando revisión del administrador</span>
                        </div>
                      } @else if (app.status === ApplicationStatus.APROBADA) {
                        <div class="detail-item approved">
                          <lucide-icon [img]="CheckCircle2" [size]="16"></lucide-icon>
                          <span>¡Felicitaciones! Tu solicitud fue aprobada</span>
                        </div>
                      } @else if (app.status === ApplicationStatus.RECHAZADA && app.admin_feedback) {
                        <div class="detail-item rejected">
                          <lucide-icon [img]="XCircle" [size]="16"></lucide-icon>
                          <span>{{ app.admin_feedback }}</span>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .home-pre-contract {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-icon {
      width: 56px;
      height: 56px;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-text h1 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--mat-sys-on-surface);
    }

    .subtitle {
      margin: 4px 0 0;
      font-size: 1rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .new-app-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      height: 48px;
      padding: 0 24px;
      font-size: 1rem;
      font-weight: 600;
      border-radius: 8px;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
    }

    .welcome-card {
      background: linear-gradient(135deg, var(--mat-sys-primary-container) 0%, var(--mat-sys-surface-container-low) 100%);
      border: 1px solid var(--mat-sys-outline-variant);
    }

    .welcome-content {
      padding: 32px;
      text-align: center;
    }

    .welcome-icon {
      color: var(--mat-sys-primary);
      margin-bottom: 16px;
    }

    .welcome-content h2 {
      margin: 0 0 12px;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--mat-sys-on-surface);
    }

    .welcome-text {
      margin: 0 0 24px;
      font-size: 1rem;
      line-height: 1.6;
      color: var(--mat-sys-on-surface-variant);
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    .welcome-actions button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .applications-card {
      border: 1px solid var(--mat-sys-outline-variant);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-title h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
    }

    .card-header mat-chip {
      color: var(--mat-sys-primary);
    }

    mat-card-content {
      padding: 24px;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 48px 24px;
      color: var(--mat-sys-on-surface-variant);
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 48px 24px;
      text-align: center;
    }

    .empty-icon {
      color: var(--mat-sys-outline-variant);
      opacity: 0.5;
    }

    .empty-state h4 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
    }

    .empty-state p {
      margin: 0 0 16px;
      font-size: 0.9375rem;
      color: var(--mat-sys-on-surface-variant);
      max-width: 400px;
    }

    .applications-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .application-item {
      padding: 16px;
      border-radius: 12px;
      border: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface-container-low);
      transition: all 0.2s;
    }

    .application-item:hover {
      border-color: var(--mat-sys-primary);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .application-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
      gap: 12px;
    }

    .property-title {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      flex: 1;
    }

    .status-chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 36px;
      padding: 0 24px;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 500;
      letter-spacing: 0.0892857143em;
      text-transform: uppercase;
      white-space: nowrap;
      border: none;
      line-height: 1;
    }

    .status-chip.status-pendiente {
      background: #1d4ed8;
      color: #ffffff;
    }

    .status-chip.status-aprobada {
      background: #10b981;
      color: #ffffff;
    }

    .status-chip.status-rechazada {
      background: #b91c1c;
      color: #ffffff;
    }

    .application-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .detail-item.pending {
      color: #2563eb;
    }

    .detail-item.approved {
      color: #0f5132;
      font-weight: 500;
    }

    .detail-item.rejected {
      color: #842029;
    }

    @media (max-width: 768px) {
      .home-pre-contract {
        padding: 16px;
      }

      .page-header {
        flex-direction: column;
        align-items: stretch;
      }

      .header-content {
        flex-direction: column;
        text-align: center;
      }

      .new-app-btn {
        width: 100%;
        justify-content: center;
      }

      .card-header {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
      }

      .application-header {
        flex-direction: column;
      }
    }
  `]
})
export class HomePreContractComponent implements OnInit {
  readonly Home = Home;
  readonly Plus = Plus;
  readonly FileEdit = FileEdit;
  readonly Clock = Clock;
  readonly CheckCircle2 = CheckCircle2;
  readonly XCircle = XCircle;
  readonly AlertCircle = AlertCircle;
  readonly ApplicationStatus = ApplicationStatus;

  private router = inject(Router);
  private slugService = inject(SlugService);
  private authService = inject(TenantAuthService);
  private applicationService = inject(ApplicationService);

  // Signals - Managing state locally
  isLoading = signal(false);
  applications = signal<ApplicationListItem[]>([]);
  userName = computed(() => this.authService.currentUser()?.name || 'Usuario');

  ngOnInit(): void {
    console.log('[HomePreContract] ===== ngOnInit START =====');
    console.log('[HomePreContract] Component loaded');
    console.log('[HomePreContract] Current URL:', this.router.url);
    console.log('[HomePreContract] Current user:', this.authService.currentUser());
    console.log('[HomePreContract] ===== ngOnInit END =====');
    this.loadApplications();
  }

  loadApplications(): void {
    this.isLoading.set(true);
    this.applicationService.getMyApplications().subscribe({
      next: (apps) => {
        this.applications.set(apps);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  goToNewApplication(): void {
    this.slugService.navigateTo(['portal', 'new-application']);
  }

  viewAllApplications(): void {
    this.slugService.navigateTo(['portal', 'my-applications']);
  }

  getStatusLabel(status: ApplicationStatus): string {
    switch (status) {
      case ApplicationStatus.PENDIENTE:
        return 'Pendiente';
      case ApplicationStatus.APROBADA:
        return 'Aprobada';
      case ApplicationStatus.RECHAZADA:
        return 'Rechazada';
      default:
        return status;
    }
  }

  getStatusColor(status: ApplicationStatus): string {
    switch (status) {
      case ApplicationStatus.PENDIENTE:
        return 'warn';
      case ApplicationStatus.APROBADA:
        return '';
      case ApplicationStatus.RECHAZADA:
        return 'accent';
      default:
        return '';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
