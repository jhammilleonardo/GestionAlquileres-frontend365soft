import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideTranslocoScope, TranslocoModule, TranslocoService } from '@jsverse/transloco';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  FileEdit,
  FileSignature,
  Plus,
  XCircle,
} from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';
import { ApplicationService } from '../../../core/services/admin/application.service';
import { SlugService } from '../../../core/services/slug.service';
import { ApplicationListItem, ApplicationStatus } from '../../../core/models/application.model';
import {
  AppButtonComponent,
  AppEmptyStateComponent,
  AppLoadingStateComponent,
  AppPageHeaderComponent,
  AppStatusBadgeComponent,
  AppStatusTone,
  AppTabsComponent,
  AppTabOption,
  ToastService,
} from '../../../shared/ui';

type ApplicationsTab = 'all' | 'pending' | 'approved' | 'rejected';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-my-applications',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    TranslocoModule,
    AppButtonComponent,
    AppEmptyStateComponent,
    AppLoadingStateComponent,
    AppPageHeaderComponent,
    AppStatusBadgeComponent,
    AppTabsComponent,
  ],
  providers: [provideTranslocoScope('rentalApp')],
  template: `
    <section class="applications-page">
      <app-page-header
        [eyebrow]="'tenantApplications.headerEyebrow' | transloco"
        [title]="'tenantApplications.title' | transloco"
        [description]="'tenantApplications.subtitle' | transloco"
      >
        <app-button actions appearance="primary" (clicked)="goToNewApplication()">
          <lucide-icon [img]="Plus" [size]="18"></lucide-icon>
          {{ 'tenantApplications.newApplication' | transloco }}
        </app-button>
      </app-page-header>

      @if (isLoading()) {
        <div class="state-box">
          <app-loading-state [label]="'tenantApplications.loading' | transloco" />
        </div>
      } @else {
        <app-tabs
          class="applications-tabs"
          [(ngModel)]="activeTab"
          [tabs]="tabs()"
          [ariaLabel]="'tenantApplications.title' | transloco"
        />

        @if (selectedApplications().length === 0) {
          <app-empty-state [title]="emptyTitle()" [description]="emptyDescription()">
            <lucide-icon icon [img]="emptyIcon()" [size]="28"></lucide-icon>
            @if (activeTab === 'all') {
              <app-button actions appearance="primary" (clicked)="goToNewApplication()">
                {{ 'tenantApplications.empty.action' | transloco }}
              </app-button>
            }
          </app-empty-state>
        } @else {
          <div class="applications-grid">
            @for (application of selectedApplications(); track application.id) {
              <article class="application-card" [class]="cardClass(application.status)">
                <header class="application-card__header">
                  <div>
                    <h2>{{ application.property_title }}</h2>
                    <p>{{ 'tenantApplications.card.id' | transloco: { id: application.id } }}</p>
                  </div>
                  <app-status-badge
                    [label]="'tenantApplications.status.' + application.status | transloco"
                    [tone]="statusTone(application.status)"
                  />
                </header>

                <div class="application-card__body">
                  <div class="detail-row" [class]="statusClass(application.status)">
                    <lucide-icon [img]="statusIcon(application.status)" [size]="16"></lucide-icon>
                    <span>{{ statusMessage(application.status) }}</span>
                  </div>

                  <div class="detail-row">
                    <lucide-icon [img]="Clock" [size]="16"></lucide-icon>
                    <span>
                      {{
                        'tenantApplications.card.sent'
                          | transloco: { date: formatDate(application.created_at) }
                      }}
                    </span>
                  </div>

                  @if (
                    application.status === ApplicationStatus.RECHAZADA && application.admin_feedback
                  ) {
                    <div class="feedback-box">
                      <strong>{{ 'tenantApplications.card.feedbackLabel' | transloco }}</strong>
                      <p>{{ application.admin_feedback }}</p>
                    </div>
                  }

                  <dl class="applicant-info">
                    <div>
                      <dt>{{ 'tenantApplications.card.nameLabel' | transloco }}</dt>
                      <dd>{{ application.personal_data.full_name }}</dd>
                    </div>
                    <div>
                      <dt>{{ 'tenantApplications.card.phoneLabel' | transloco }}</dt>
                      <dd>{{ application.personal_data.phone }}</dd>
                    </div>
                  </dl>
                </div>

                <footer class="application-card__actions">
                  <app-button appearance="outline" size="s" (clicked)="viewDetails(application.id)">
                    <lucide-icon [img]="Eye" [size]="16"></lucide-icon>
                    {{ 'tenantApplications.card.viewDetails' | transloco }}
                  </app-button>

                  @if (application.status === ApplicationStatus.PENDIENTE) {
                    <app-button appearance="primary" size="s" (clicked)="goToNewApplication()">
                      <lucide-icon [img]="Plus" [size]="16"></lucide-icon>
                      {{ 'tenantApplications.newApplication' | transloco }}
                    </app-button>
                  }

                  @if (application.status === ApplicationStatus.APROBADA) {
                    <app-button appearance="primary" size="s" (clicked)="goToContracts()">
                      <lucide-icon [img]="FileSignature" [size]="16"></lucide-icon>
                      {{ 'tenantApplications.card.signContract' | transloco }}
                    </app-button>
                  }
                </footer>
              </article>
            }
          </div>
        }
      }
    </section>
  `,
  styles: `
    .applications-page {
      max-inline-size: 1240px;
      margin-inline: auto;
    }

    .applications-tabs {
      margin-block-end: var(--app-space-5);
    }

    .state-box {
      display: grid;
      min-block-size: 20rem;
      place-items: center;
    }

    .applications-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 360px), 1fr));
      gap: var(--app-space-4);
    }

    .application-card {
      display: grid;
      grid-template-rows: auto minmax(0, 1fr) auto;
      gap: var(--app-space-4);
      border: 1px solid var(--app-color-border);
      border-inline-start-width: 4px;
      border-radius: var(--app-radius-lg);
      background: var(--app-color-surface);
      box-shadow: var(--app-shadow-sm);
      padding: var(--app-space-4);
    }

    .application-card.status-pendiente {
      border-inline-start-color: var(--tui-status-warning);
    }

    .application-card.status-aprobada {
      border-inline-start-color: var(--tui-status-positive);
    }

    .application-card.status-rechazada {
      border-inline-start-color: var(--tui-status-negative);
    }

    .application-card__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--app-space-3);
    }

    .application-card h2,
    .application-card p,
    .applicant-info,
    .applicant-info dd {
      margin: 0;
    }

    .application-card h2 {
      color: var(--app-color-text);
      font-size: 1.05rem;
      font-weight: 800;
      line-height: 1.3;
    }

    .application-card__header p {
      margin-block-start: 0.25rem;
      color: var(--app-color-text-muted);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.78rem;
      font-weight: 700;
    }

    .application-card__body {
      display: grid;
      gap: var(--app-space-3);
    }

    .detail-row {
      display: flex;
      align-items: center;
      gap: var(--app-space-2);
      color: var(--app-color-text-muted);
      font-size: 0.9rem;
      line-height: 1.4;
    }

    .detail-row.pending {
      color: var(--tui-status-warning);
      font-weight: 700;
    }

    .detail-row.approved {
      color: var(--tui-status-positive);
      font-weight: 700;
    }

    .detail-row.rejected {
      color: var(--tui-status-negative);
      font-weight: 700;
    }

    .feedback-box {
      border-radius: var(--app-radius-md);
      background: var(--tui-status-negative-pale);
      color: var(--tui-status-negative);
      padding: var(--app-space-3);
    }

    .feedback-box strong {
      display: block;
      margin-block-end: var(--app-space-1);
      font-size: 0.82rem;
      font-weight: 800;
    }

    .feedback-box p {
      line-height: 1.45;
    }

    .applicant-info {
      display: grid;
      gap: var(--app-space-2);
      border-top: 1px solid var(--app-color-border);
      padding-block-start: var(--app-space-3);
    }

    .applicant-info div {
      display: flex;
      justify-content: space-between;
      gap: var(--app-space-3);
    }

    .applicant-info dt {
      color: var(--app-color-text-muted);
      font-size: 0.82rem;
      font-weight: 700;
    }

    .applicant-info dd {
      color: var(--app-color-text);
      font-size: 0.88rem;
      font-weight: 750;
      text-align: end;
    }

    .application-card__actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--app-space-2);
      border-top: 1px solid var(--app-color-border);
      padding-block-start: var(--app-space-3);
    }
  `,
})
export class MyApplicationsComponent {
  protected readonly FileEdit = FileEdit;
  protected readonly Clock = Clock;
  protected readonly CheckCircle2 = CheckCircle2;
  protected readonly XCircle = XCircle;
  protected readonly AlertCircle = AlertCircle;
  protected readonly Plus = Plus;
  protected readonly Eye = Eye;
  protected readonly FileSignature = FileSignature;
  protected readonly ApplicationStatus = ApplicationStatus;

  private readonly slugService = inject(SlugService);
  private readonly applicationService = inject(ApplicationService);
  private readonly translocoService = inject(TranslocoService);
  private readonly toast = inject(ToastService);

  protected readonly isLoading = signal(false);
  protected readonly applications = signal<ApplicationListItem[]>([]);
  protected activeTab: ApplicationsTab = 'all';

  protected readonly pendingApplications = computed(() =>
    this.applications().filter((application) => application.status === ApplicationStatus.PENDIENTE),
  );

  protected readonly approvedApplications = computed(() =>
    this.applications().filter((application) => application.status === ApplicationStatus.APROBADA),
  );

  protected readonly rejectedApplications = computed(() =>
    this.applications().filter((application) => application.status === ApplicationStatus.RECHAZADA),
  );

  protected selectedApplications(): ApplicationListItem[] {
    if (this.activeTab === 'pending') return this.pendingApplications();
    if (this.activeTab === 'approved') return this.approvedApplications();
    if (this.activeTab === 'rejected') return this.rejectedApplications();
    return this.applications();
  }

  protected readonly tabs = computed<readonly AppTabOption<ApplicationsTab>[]>(() => [
    {
      label: this.translocoService.translate('tenantApplications.tabs.all'),
      value: 'all',
      badge: this.applications().length,
    },
    {
      label: this.translocoService.translate('tenantApplications.tabs.pending'),
      value: 'pending',
      badge: this.pendingApplications().length,
    },
    {
      label: this.translocoService.translate('tenantApplications.tabs.approved'),
      value: 'approved',
      badge: this.approvedApplications().length,
    },
    {
      label: this.translocoService.translate('tenantApplications.tabs.rejected'),
      value: 'rejected',
      badge: this.rejectedApplications().length,
    },
  ]);

  constructor() {
    this.loadApplications();
  }

  protected loadApplications(): void {
    this.isLoading.set(true);
    this.applicationService.getMyApplications().subscribe({
      next: (applications) => {
        this.applications.set(applications);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toast.error(this.translocoService.translate('tenantApplications.loadError'));
      },
    });
  }

  protected goToNewApplication(): void {
    this.slugService.navigateTo(['portal', 'new-application']);
  }

  protected goToContracts(): void {
    this.slugService.navigateTo(['portal', 'documentos', 'contratos']);
  }

  protected viewDetails(applicationId: number): void {
    this.toast.info(
      this.translocoService.translate('tenantApplications.detailsPending', {
        id: applicationId,
      }),
    );
  }

  protected statusTone(status: ApplicationStatus): AppStatusTone {
    if (status === ApplicationStatus.APROBADA) return 'success';
    if (status === ApplicationStatus.RECHAZADA) return 'danger';
    return 'warning';
  }

  protected statusClass(status: ApplicationStatus): string {
    if (status === ApplicationStatus.APROBADA) return 'approved';
    if (status === ApplicationStatus.RECHAZADA) return 'rejected';
    return 'pending';
  }

  protected cardClass(status: ApplicationStatus): string {
    return `status-${status.toLowerCase()}`;
  }

  protected statusIcon(status: ApplicationStatus): typeof AlertCircle {
    if (status === ApplicationStatus.APROBADA) return CheckCircle2;
    if (status === ApplicationStatus.RECHAZADA) return XCircle;
    return AlertCircle;
  }

  protected statusMessage(status: ApplicationStatus): string {
    if (status === ApplicationStatus.APROBADA) {
      return `${this.translocoService.translate(
        'tenantApplications.card.approvedTitleLabel',
      )} ${this.translocoService.translate('tenantApplications.card.approvedTitleRest')}`;
    }

    if (status === ApplicationStatus.RECHAZADA) {
      return this.translocoService.translate('tenantApplications.card.rejectedTitle');
    }

    return this.translocoService.translate('tenantApplications.card.waitingReview');
  }

  protected emptyIcon(): typeof FileEdit {
    if (this.activeTab === 'pending') return Clock;
    if (this.activeTab === 'approved') return CheckCircle2;
    if (this.activeTab === 'rejected') return XCircle;
    return FileEdit;
  }

  protected emptyTitle(): string {
    if (this.activeTab === 'pending') {
      return this.translocoService.translate('tenantApplications.empty.noPending');
    }
    if (this.activeTab === 'approved') {
      return this.translocoService.translate('tenantApplications.empty.noApproved');
    }
    if (this.activeTab === 'rejected') {
      return this.translocoService.translate('tenantApplications.empty.noRejected');
    }
    return this.translocoService.translate('tenantApplications.empty.title');
  }

  protected emptyDescription(): string | null {
    return this.activeTab === 'all'
      ? this.translocoService.translate('tenantApplications.empty.desc')
      : null;
  }

  protected formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return this.translocoService.translate('tenantApplications.relativeDate.today');
    }
    if (diffDays === 1) {
      return this.translocoService.translate('tenantApplications.relativeDate.yesterday');
    }
    if (diffDays < 7) {
      return this.translocoService.translate('tenantApplications.relativeDate.daysAgo', {
        count: diffDays,
      });
    }
    if (diffDays < 30) {
      return this.translocoService.translate('tenantApplications.relativeDate.weeksAgo', {
        count: Math.floor(diffDays / 7),
      });
    }

    const locale = this.translocoService.getActiveLang() === 'es' ? 'es-ES' : 'en-US';
    return date.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
