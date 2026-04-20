import { Component, inject, computed, OnInit, signal } from '@angular/core';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import {
  LucideAngularModule,
  FileEdit,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Eye,
  FileSignature,
} from 'lucide-angular';
import { TenantAuthService } from '../../../core/services/tenant/tenant-auth.service';
import { SlugService } from '../../../core/services/slug.service';
import { ApplicationService } from '../../../core/services/admin/application.service';
import { ApplicationListItem, ApplicationStatus } from '../../../core/models/application.model';

@Component({
  selector: 'app-my-applications',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTabsModule,
    LucideAngularModule,
    TranslocoModule,
  ],
  providers: [provideTranslocoScope('rentalApp')],
  template: `
    <div class="my-applications">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <lucide-icon [img]="FileEdit" [size]="28"></lucide-icon>
          </div>
          <div class="header-text">
            <h1>{{ 'tenantApplications.title' | transloco }}</h1>
            <p class="subtitle">{{ 'tenantApplications.subtitle' | transloco }}</p>
          </div>
        </div>
        <button
          mat-raised-button
          color="primary"
          class="new-app-btn"
          (click)="goToNewApplication()"
        >
          <lucide-icon [img]="Plus" [size]="20"></lucide-icon>
          <span>{{ 'tenantApplications.newApplication' | transloco }}</span>
        </button>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="loading-state">
          <mat-spinner diameter="48"></mat-spinner>
          <p>{{ 'tenantApplications.loading' | transloco }}</p>
        </div>
      }

      <!-- Content -->
      @if (!isLoading()) {
        <!-- Tabs para filtrar por estado -->
        <mat-tab-group
          class="status-tabs"
          [selectedIndex]="selectedTab()"
          (selectedTabChange)="onTabChange($event)"
        >
          <!-- Todas -->
          <mat-tab [label]="'tenantApplications.tabs.all' | transloco">
            <ng-template matTabContent>
              <div class="tab-content">
                @if (applications().length === 0) {
                  <div class="empty-state">
                    <lucide-icon [img]="FileEdit" [size]="64" class="empty-icon"></lucide-icon>
                    <h3>{{ 'tenantApplications.empty.title' | transloco }}</h3>
                    <p>{{ 'tenantApplications.empty.desc' | transloco }}</p>
                    <button mat-flat-button color="primary" (click)="goToNewApplication()">
                      {{ 'tenantApplications.empty.action' | transloco }}
                    </button>
                  </div>
                } @else {
                  <div class="applications-grid">
                    @for (app of applications(); track app.id) {
                      <mat-card
                        class="application-card"
                        [class]="'status-' + app.status.toLowerCase()"
                      >
                        <div class="card-header">
                          <div class="property-info">
                            <h3 class="property-title">{{ app.property_title }}</h3>
                            <div class="application-id">
                              {{ 'tenantApplications.card.id' | transloco: { id: app.id } }}
                            </div>
                          </div>
                          <span [class]="'status-chip status-' + app.status.toLowerCase()">
                            {{ 'tenantApplications.status.' + app.status | transloco }}
                          </span>
                        </div>

                        <mat-card-content>
                          <div class="application-details">
                            <div class="detail-row">
                              <lucide-icon [img]="Clock" [size]="16"></lucide-icon>
                              <span>{{
                                'tenantApplications.card.sent'
                                  | transloco: { date: formatDate(app.created_at) }
                              }}</span>
                            </div>

                            @if (app.status === ApplicationStatus.PENDIENTE) {
                              <div class="detail-row pending">
                                <lucide-icon [img]="AlertCircle" [size]="16"></lucide-icon>
                                <span>{{
                                  'tenantApplications.card.waitingReview' | transloco
                                }}</span>
                              </div>
                            } @else if (app.status === ApplicationStatus.APROBADA) {
                              <div class="detail-row approved">
                                <lucide-icon [img]="CheckCircle2" [size]="16"></lucide-icon>
                                <span>
                                  <strong>{{
                                    'tenantApplications.card.approvedTitleLabel' | transloco
                                  }}</strong>
                                  {{ 'tenantApplications.card.approvedTitleRest' | transloco }}
                                </span>
                              </div>
                            } @else if (app.status === ApplicationStatus.RECHAZADA) {
                              <div class="detail-row rejected">
                                <lucide-icon [img]="XCircle" [size]="16"></lucide-icon>
                                <span>{{
                                  'tenantApplications.card.rejectedTitle' | transloco
                                }}</span>
                              </div>
                              @if (app.admin_feedback) {
                                <div class="feedback-box">
                                  <strong>{{
                                    'tenantApplications.card.feedbackLabel' | transloco
                                  }}</strong>
                                  <p>{{ app.admin_feedback }}</p>
                                </div>
                              }
                            }

                            <div class="applicant-info">
                              <div class="info-item">
                                <span class="label">{{
                                  'tenantApplications.card.nameLabel' | transloco
                                }}</span>
                                <span class="value">{{ app.personal_data.full_name }}</span>
                              </div>
                              <div class="info-item">
                                <span class="label">{{
                                  'tenantApplications.card.phoneLabel' | transloco
                                }}</span>
                                <span class="value">{{ app.personal_data.phone }}</span>
                              </div>
                            </div>
                          </div>
                        </mat-card-content>

                        <mat-card-actions class="card-actions">
                          <button mat-stroked-button color="primary" (click)="viewDetails(app.id)">
                            <lucide-icon [img]="Eye" [size]="16"></lucide-icon>
                            {{ 'tenantApplications.card.viewDetails' | transloco }}
                          </button>

                          @if (app.status === ApplicationStatus.PENDIENTE) {
                            <button mat-flat-button color="primary" (click)="goToNewApplication()">
                              <lucide-icon [img]="Plus" [size]="16"></lucide-icon>
                              {{ 'tenantApplications.newApplication' | transloco }}
                            </button>
                          }

                          @if (app.status === ApplicationStatus.APROBADA) {
                            <button mat-flat-button color="primary" (click)="goToContracts()">
                              <lucide-icon [img]="FileSignature" [size]="16"></lucide-icon>
                              {{ 'tenantApplications.card.signContract' | transloco }}
                            </button>
                          }
                        </mat-card-actions>
                      </mat-card>
                    }
                  </div>
                }
              </div>
            </ng-template>
          </mat-tab>

          <!-- Pendientes -->
          <mat-tab [label]="'tenantApplications.tabs.pending' | transloco">
            <ng-template matTabContent>
              <div class="tab-content">
                @if (pendingApplications().length === 0) {
                  <div class="empty-state">
                    <lucide-icon [img]="Clock" [size]="64" class="empty-icon"></lucide-icon>
                    <h3>{{ 'tenantApplications.empty.noPending' | transloco }}</h3>
                  </div>
                } @else {
                  <div class="applications-grid">
                    @for (app of pendingApplications(); track app.id) {
                      <mat-card class="application-card status-pendiente">
                        <div class="card-header">
                          <div class="property-info">
                            <h3 class="property-title">{{ app.property_title }}</h3>
                            <div class="application-id">
                              {{ 'tenantApplications.card.id' | transloco: { id: app.id } }}
                            </div>
                          </div>
                          <span class="status-chip status-pendiente">{{
                            'tenantApplications.status.PENDIENTE' | transloco
                          }}</span>
                        </div>

                        <mat-card-content>
                          <div class="application-details">
                            <div class="detail-row pending">
                              <lucide-icon [img]="AlertCircle" [size]="16"></lucide-icon>
                              <span>{{ 'tenantApplications.card.waitingReview' | transloco }}</span>
                            </div>
                            <div class="detail-row">
                              <lucide-icon [img]="Clock" [size]="16"></lucide-icon>
                              <span>{{
                                'tenantApplications.card.sent'
                                  | transloco: { date: formatDate(app.created_at) }
                              }}</span>
                            </div>
                          </div>
                        </mat-card-content>

                        <mat-card-actions class="card-actions">
                          <button mat-stroked-button color="primary" (click)="viewDetails(app.id)">
                            <lucide-icon [img]="Eye" [size]="16"></lucide-icon>
                            {{ 'tenantApplications.card.viewDetails' | transloco }}
                          </button>
                        </mat-card-actions>
                      </mat-card>
                    }
                  </div>
                }
              </div>
            </ng-template>
          </mat-tab>

          <!-- Aprobadas -->
          <mat-tab [label]="'tenantApplications.tabs.approved' | transloco">
            <ng-template matTabContent>
              <div class="tab-content">
                @if (approvedApplications().length === 0) {
                  <div class="empty-state">
                    <lucide-icon [img]="CheckCircle2" [size]="64" class="empty-icon"></lucide-icon>
                    <h3>{{ 'tenantApplications.empty.noApproved' | transloco }}</h3>
                  </div>
                } @else {
                  <div class="applications-grid">
                    @for (app of approvedApplications(); track app.id) {
                      <mat-card class="application-card status-aprobada">
                        <div class="card-header">
                          <div class="property-info">
                            <h3 class="property-title">{{ app.property_title }}</h3>
                            <div class="application-id">
                              {{ 'tenantApplications.card.id' | transloco: { id: app.id } }}
                            </div>
                          </div>
                          <span class="status-chip status-aprobada">{{
                            'tenantApplications.status.APROBADA' | transloco
                          }}</span>
                        </div>

                        <mat-card-content>
                          <div class="application-details">
                            <div class="detail-row approved">
                              <lucide-icon [img]="CheckCircle2" [size]="16"></lucide-icon>
                              <span>
                                <strong>{{
                                  'tenantApplications.card.approvedTitleLabel' | transloco
                                }}</strong>
                                {{ 'tenantApplications.card.approvedTitleRest' | transloco }}
                              </span>
                            </div>
                            <div class="detail-row">
                              <lucide-icon [img]="Clock" [size]="16"></lucide-icon>
                              <span>{{
                                'tenantApplications.card.sent'
                                  | transloco: { date: formatDate(app.created_at) }
                              }}</span>
                            </div>
                          </div>
                        </mat-card-content>

                        <mat-card-actions class="card-actions">
                          <button mat-stroked-button color="primary" (click)="viewDetails(app.id)">
                            <lucide-icon [img]="Eye" [size]="16"></lucide-icon>
                            {{ 'tenantApplications.card.viewDetails' | transloco }}
                          </button>
                          <button mat-flat-button color="primary" (click)="goToContracts()">
                            <lucide-icon [img]="FileSignature" [size]="16"></lucide-icon>
                            {{ 'tenantApplications.card.signContract' | transloco }}
                          </button>
                        </mat-card-actions>
                      </mat-card>
                    }
                  </div>
                }
              </div>
            </ng-template>
          </mat-tab>

          <!-- Rechazadas -->
          <mat-tab [label]="'tenantApplications.tabs.rejected' | transloco">
            <ng-template matTabContent>
              <div class="tab-content">
                @if (rejectedApplications().length === 0) {
                  <div class="empty-state">
                    <lucide-icon [img]="XCircle" [size]="64" class="empty-icon"></lucide-icon>
                    <h3>{{ 'tenantApplications.empty.noRejected' | transloco }}</h3>
                  </div>
                } @else {
                  <div class="applications-grid">
                    @for (app of rejectedApplications(); track app.id) {
                      <mat-card class="application-card status-rechazada">
                        <div class="card-header">
                          <div class="property-info">
                            <h3 class="property-title">{{ app.property_title }}</h3>
                            <div class="application-id">
                              {{ 'tenantApplications.card.id' | transloco: { id: app.id } }}
                            </div>
                          </div>
                          <span class="status-chip status-rechazada">{{
                            'tenantApplications.status.RECHAZADA' | transloco
                          }}</span>
                        </div>

                        <mat-card-content>
                          <div class="application-details">
                            <div class="detail-row rejected">
                              <lucide-icon [img]="XCircle" [size]="16"></lucide-icon>
                              <span>{{ 'tenantApplications.card.rejectedTitle' | transloco }}</span>
                            </div>
                            <div class="detail-row">
                              <lucide-icon [img]="Clock" [size]="16"></lucide-icon>
                              <span>{{
                                'tenantApplications.card.sent'
                                  | transloco: { date: formatDate(app.created_at) }
                              }}</span>
                            </div>
                            @if (app.admin_feedback) {
                              <div class="feedback-box">
                                <strong>{{
                                  'tenantApplications.card.feedbackLabel' | transloco
                                }}</strong>
                                <p>{{ app.admin_feedback }}</p>
                              </div>
                            }
                          </div>
                        </mat-card-content>

                        <mat-card-actions class="card-actions">
                          <button mat-stroked-button color="primary" (click)="viewDetails(app.id)">
                            <lucide-icon [img]="Eye" [size]="16"></lucide-icon>
                            {{ 'tenantApplications.card.viewDetails' | transloco }}
                          </button>
                          <button mat-flat-button color="primary" (click)="goToNewApplication()">
                            <lucide-icon [img]="Plus" [size]="16"></lucide-icon>
                            {{ 'tenantApplications.newApplication' | transloco }}
                          </button>
                        </mat-card-actions>
                      </mat-card>
                    }
                  </div>
                }
              </div>
            </ng-template>
          </mat-tab>
        </mat-tab-group>
      }
    </div>
  `,
  styles: [
    `
      .my-applications {
        max-width: 1400px;
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

      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        padding: 64px 24px;
        color: var(--mat-sys-on-surface-variant);
      }

      .status-tabs {
        margin-bottom: 24px;
      }

      .tab-content {
        padding: 24px 0;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        padding: 64px 24px;
        text-align: center;
      }

      .empty-icon {
        color: var(--mat-sys-outline-variant);
        opacity: 0.3;
      }

      .empty-state h3 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--mat-sys-on-surface);
      }

      .applications-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
        gap: 24px;
      }

      .application-card {
        border: 1px solid var(--mat-sys-outline-variant);
        transition: all 0.2s;
      }

      .application-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .application-card.status-pendiente {
        border-left: 4px solid #f59e0b;
      }

      .application-card.status-aprobada {
        border-left: 4px solid #10b981;
      }

      .application-card.status-rechazada {
        border-left: 4px solid #ef4444;
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 20px 24px 16px;
        gap: 12px;
      }

      .property-info {
        flex: 1;
      }

      .property-title {
        margin: 0 0 4px;
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--mat-sys-on-surface);
        line-height: 1.4;
      }

      .application-id {
        font-size: 0.8125rem;
        color: var(--mat-sys-on-surface-variant);
        font-family: monospace;
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
        flex-shrink: 0;
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

      mat-card-content {
        padding: 0 24px 20px;
      }

      .application-details {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .detail-row {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.9375rem;
        color: var(--mat-sys-on-surface-variant);
      }

      .detail-row.pending {
        color: #92400e;
        font-weight: 500;
      }

      .detail-row.approved {
        color: #065f46;
        font-weight: 500;
      }

      .detail-row.rejected {
        color: #991b1b;
        font-weight: 500;
      }

      .feedback-box {
        margin-top: 12px;
        padding: 12px;
        background: #fee2e2;
        border-radius: 8px;
        border-left: 3px solid #ef4444;
      }

      .feedback-box strong {
        display: block;
        font-size: 0.875rem;
        color: #991b1b;
        margin-bottom: 4px;
      }

      .feedback-box p {
        margin: 0;
        font-size: 0.875rem;
        color: #7f1d1d;
        line-height: 1.4;
      }

      .applicant-info {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid var(--mat-sys-outline-variant);
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .info-item {
        display: flex;
        gap: 8px;
        font-size: 0.875rem;
      }

      .info-item .label {
        color: var(--mat-sys-on-surface-variant);
        font-weight: 500;
      }

      .info-item .value {
        color: var(--mat-sys-on-surface);
      }

      .card-actions {
        padding: 16px 24px;
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      .card-actions button {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      @media (max-width: 768px) {
        .my-applications {
          padding: 16px;
        }

        .page-header {
          flex-direction: column;
          align-items: stretch;
        }

        .new-app-btn {
          width: 100%;
          justify-content: center;
        }

        .applications-grid {
          grid-template-columns: 1fr;
        }

        .card-header {
          flex-direction: column;
        }

        .status-chip {
          align-self: flex-start;
        }
      }
    `,
  ],
})
export class MyApplicationsComponent implements OnInit {
  readonly FileEdit = FileEdit;
  readonly Clock = Clock;
  readonly CheckCircle2 = CheckCircle2;
  readonly XCircle = XCircle;
  readonly AlertCircle = AlertCircle;
  readonly Plus = Plus;
  readonly Eye = Eye;
  readonly FileSignature = FileSignature;
  readonly ApplicationStatus = ApplicationStatus;

  private router = inject(Router);
  private slugService = inject(SlugService);
  private authService = inject(TenantAuthService);
  private applicationService = inject(ApplicationService);
  private translocoService = inject(TranslocoService);

  // Signals - Managing state locally
  isLoading = signal(false);
  applications = signal<ApplicationListItem[]>([]);
  selectedTab = signal(0);

  // Computed properties for filtering
  pendingApplications = computed(() =>
    this.applications().filter(
      (app: ApplicationListItem) => app.status === ApplicationStatus.PENDIENTE,
    ),
  );

  approvedApplications = computed(() =>
    this.applications().filter(
      (app: ApplicationListItem) => app.status === ApplicationStatus.APROBADA,
    ),
  );

  rejectedApplications = computed(() =>
    this.applications().filter(
      (app: ApplicationListItem) => app.status === ApplicationStatus.RECHAZADA,
    ),
  );

  ngOnInit(): void {
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
      },
    });
  }

  onTabChange(event: any): void {
    this.selectedTab.set(event.index);
  }

  goToNewApplication(): void {
    this.slugService.navigateTo(['portal', 'new-application']);
  }

  goToContracts(): void {
    this.slugService.navigateTo(['portal', 'documentos', 'contratos']);
  }

  viewDetails(applicationId: number): void {
    // Por ahora, solo mostramos un alert
    // TODO: Implementar vista de detalles
    alert(`Ver detalles de la solicitud #${applicationId}`);
  }

  getStatusLabel(status: ApplicationStatus): string {
    return this.translocoService.translate('tenantApplications.status.' + status);
  }

  getStatusColor(status: ApplicationStatus): string {
    switch (status) {
      case ApplicationStatus.PENDIENTE:
        return 'warn';
      case ApplicationStatus.APROBADA:
        return 'primary';
      case ApplicationStatus.RECHAZADA:
        return 'accent';
      default:
        return 'primary';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0)
      return this.translocoService.translate('tenantApplications.relativeDate.today');
    if (diffDays === 1)
      return this.translocoService.translate('tenantApplications.relativeDate.yesterday');
    if (diffDays < 7)
      return this.translocoService.translate('tenantApplications.relativeDate.daysAgo', {
        count: diffDays,
      });
    if (diffDays < 30)
      return this.translocoService.translate('tenantApplications.relativeDate.weeksAgo', {
        count: Math.floor(diffDays / 7),
      });

    const locale = this.translocoService.getActiveLang() === 'es' ? 'es-ES' : 'en-US';
    return date.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
