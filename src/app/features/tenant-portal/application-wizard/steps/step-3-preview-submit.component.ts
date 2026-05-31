import { Component, inject, input, output, ChangeDetectionStrategy } from '@angular/core';
import { provideTranslocoScope, TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { CheckCircle2, DollarSign, Edit2, MapPin } from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';
import { Property } from '../../../../core/models/property.model';
import {
  EmploymentData,
  PersonalData,
  RentalHistory,
} from '../../../../core/models/application.model';
import { TenantCurrencyPipe } from '../../../../shared/pipes/tenant-currency.pipe';
import { TenantDatePipe } from '../../../../shared/pipes/tenant-date.pipe';
import { AppButtonComponent, AppLoadingStateComponent } from '../../../../shared/ui';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-step-3-preview-submit',
  standalone: true,
  imports: [
    LucideAngularModule,
    TranslocoModule,
    TenantDatePipe,
    TenantCurrencyPipe,
    AppButtonComponent,
    AppLoadingStateComponent,
  ],
  providers: [provideTranslocoScope('rentalApp')],
  template: `
    <section class="step-content">
      <header class="step-header">
        <h2>{{ 'rentalApp.step3Title' | transloco }}</h2>
        <p>{{ 'rentalApp.step3Subtitle' | transloco }}</p>
      </header>

      <article class="summary-card">
        <header>
          <h3>{{ 'rentalApp.selectedProperty' | transloco }}</h3>
        </header>
        <div class="property-summary">
          <h4>{{ property().title }}</h4>
          <p>
            <lucide-icon [img]="MapPin" [size]="16"></lucide-icon>
            {{ property().addresses?.[0]?.city || '-' }},
            {{ property().addresses?.[0]?.country || '-' }}
          </p>
          <p>
            <lucide-icon [img]="DollarSign" [size]="16"></lucide-icon>
            {{ property().monthly_rent | tenantCurrency }}
            {{ 'rentalApp.perMonth' | transloco }}
          </p>
        </div>
      </article>

      <article class="summary-card">
        <header>
          <h3>{{ 'rentalApp.personalInfoSection' | transloco }}</h3>
          <button class="edit-action" type="button" (click)="editStep.emit(0)">
            <lucide-icon [img]="Edit2" [size]="18"></lucide-icon>
          </button>
        </header>
        <dl class="info-grid">
          <div>
            <dt>{{ 'rentalApp.fullName' | transloco }}</dt>
            <dd>{{ personalInfo()?.full_name || '-' }}</dd>
          </div>
          <div>
            <dt>{{ 'rentalApp.emailLabel' | transloco }}</dt>
            <dd>{{ personalInfo()?.email || '-' }}</dd>
          </div>
          <div>
            <dt>{{ 'rentalApp.phone' | transloco }}</dt>
            <dd>{{ personalInfo()?.phone || '-' }}</dd>
          </div>
          <div>
            <dt>{{ 'rentalApp.birthDate' | transloco }}</dt>
            <dd>{{ personalInfo()?.birth_date | tenantDate }}</dd>
          </div>
          <div>
            <dt>{{ 'rentalApp.nationalId' | transloco }}</dt>
            <dd>{{ personalInfo()?.national_id || '-' }}</dd>
          </div>
          <div>
            <dt>{{ 'rentalApp.maritalStatusLabel' | transloco }}</dt>
            <dd>{{ getMaritalStatusLabel(personalInfo()?.marital_status) }}</dd>
          </div>
          <div>
            <dt>{{ 'rentalApp.dependentsLabel' | transloco }}</dt>
            <dd>{{ personalInfo()?.number_of_dependents || 0 }}</dd>
          </div>
        </dl>
      </article>

      <article class="summary-card">
        <header>
          <h3>{{ 'rentalApp.employmentSection' | transloco }}</h3>
          <button class="edit-action" type="button" (click)="editStep.emit(1)">
            <lucide-icon [img]="Edit2" [size]="18"></lucide-icon>
          </button>
        </header>

        <h4 class="section-title">{{ 'rentalApp.currentJobSection' | transloco }}</h4>
        <dl class="info-grid">
          <div>
            <dt>{{ 'rentalApp.companyLabel' | transloco }}</dt>
            <dd>{{ employmentHistory()?.current_job?.company || '-' }}</dd>
          </div>
          <div>
            <dt>{{ 'rentalApp.positionLabel' | transloco }}</dt>
            <dd>{{ employmentHistory()?.current_job?.position || '-' }}</dd>
          </div>
          <div>
            <dt>{{ 'rentalApp.employmentTypeSummary' | transloco }}</dt>
            <dd>{{ getEmploymentTypeLabel(employmentHistory()?.current_job?.employment_type) }}</dd>
          </div>
          <div>
            <dt>{{ 'rentalApp.salarySummary' | transloco }}</dt>
            <dd>{{ employmentHistory()?.current_job?.salary | tenantCurrency }}</dd>
          </div>
          <div>
            <dt>{{ 'rentalApp.startDateSummary' | transloco }}</dt>
            <dd>{{ employmentHistory()?.current_job?.start_date | tenantDate }}</dd>
          </div>
          <div>
            <dt>{{ 'rentalApp.supervisorLabel' | transloco }}</dt>
            <dd>{{ employmentHistory()?.current_job?.supervisor_name || '-' }}</dd>
          </div>
          <div>
            <dt>{{ 'rentalApp.supervisorPhoneLabel' | transloco }}</dt>
            <dd>{{ employmentHistory()?.current_job?.supervisor_phone || '-' }}</dd>
          </div>
        </dl>

        @if (employmentHistory()?.previous_job?.company) {
          <h4 class="section-title">{{ 'rentalApp.previousJobSection' | transloco }}</h4>
          <dl class="info-grid">
            <div>
              <dt>{{ 'rentalApp.companyLabel' | transloco }}</dt>
              <dd>{{ employmentHistory()?.previous_job?.company }}</dd>
            </div>
            <div>
              <dt>{{ 'rentalApp.positionLabel' | transloco }}</dt>
              <dd>{{ employmentHistory()?.previous_job?.position }}</dd>
            </div>
          </dl>
        }

        @if (rentalHistory().length > 0) {
          <h4 class="section-title">{{ 'rentalApp.rentalHistorySection' | transloco }}</h4>
          <div class="history-list">
            @for (history of rentalHistory(); track history) {
              <div class="history-item">
                <strong>{{ history.property_address }}</strong>
                <span>
                  {{ history.monthly_rent | tenantCurrency }} /
                  {{ 'common.month' | transloco }}
                </span>
                <span>{{ history.start_date | tenantDate }}</span>
              </div>
            }
          </div>
        }
      </article>

      <section class="submit-section">
        <div class="submit-info">
          <lucide-icon [img]="CheckCircle2" [size]="24"></lucide-icon>
          <div>
            <h3>{{ 'rentalApp.readyToSubmit' | transloco }}</h3>
            <p>{{ 'rentalApp.readyDesc' | transloco }}</p>
          </div>
        </div>

        <app-button
          appearance="primary"
          [fullWidth]="true"
          [loading]="isSubmitting()"
          [disabled]="isSubmitting()"
          (clicked)="submit.emit()"
        >
          @if (isSubmitting()) {
            <app-loading-state [label]="'rentalApp.submitting' | transloco" />
          } @else {
            <lucide-icon [img]="CheckCircle2" [size]="18"></lucide-icon>
            {{ 'rentalApp.submitBtn' | transloco }}
          }
        </app-button>
      </section>
    </section>
  `,
  styles: `
    .step-content {
      display: grid;
      gap: var(--app-space-5);
    }

    .step-header {
      text-align: center;
    }

    .step-header h2,
    .step-header p,
    .summary-card h3,
    .property-summary h4,
    .property-summary p,
    .section-title,
    .submit-info h3,
    .submit-info p,
    .info-grid,
    .info-grid dd {
      margin: 0;
    }

    .step-header h2 {
      color: var(--app-color-text);
      font-size: 1.35rem;
      font-weight: 820;
    }

    .step-header p {
      margin-block-start: var(--app-space-1);
      color: var(--app-color-text-muted);
    }

    .summary-card,
    .submit-section {
      display: grid;
      gap: var(--app-space-4);
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-lg);
      background: var(--app-color-surface);
      padding: var(--app-space-4);
    }

    .summary-card > header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--app-space-3);
    }

    .summary-card h3 {
      color: var(--app-color-text);
      font-size: 1rem;
      font-weight: 800;
    }

    .edit-action {
      display: inline-grid;
      place-items: center;
      inline-size: 2rem;
      block-size: 2rem;
      border: 0;
      border-radius: 999px;
      background: var(--tui-status-info-pale);
      color: var(--tui-status-info);
      cursor: pointer;
    }

    .property-summary {
      display: grid;
      gap: var(--app-space-2);
    }

    .property-summary h4 {
      color: var(--app-color-text);
      font-size: 1.15rem;
      font-weight: 820;
    }

    .property-summary p {
      display: flex;
      align-items: center;
      gap: var(--app-space-2);
      color: var(--app-color-text-muted);
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--app-space-3);
    }

    .info-grid div {
      display: grid;
      gap: 0.25rem;
    }

    .info-grid dt {
      color: var(--app-color-text-muted);
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
    }

    .info-grid dd {
      color: var(--app-color-text);
      font-weight: 720;
      overflow-wrap: anywhere;
    }

    .section-title {
      color: var(--app-color-primary);
      font-size: 0.95rem;
      font-weight: 800;
    }

    .history-list {
      display: grid;
      gap: var(--app-space-2);
    }

    .history-item {
      display: grid;
      gap: 0.25rem;
      border-radius: var(--app-radius-md);
      background: var(--app-color-surface-muted);
      color: var(--app-color-text-muted);
      padding: var(--app-space-3);
    }

    .history-item strong {
      color: var(--app-color-text);
    }

    .submit-section {
      background: var(--tui-status-positive-pale);
      border-color: var(--tui-status-positive);
    }

    .submit-info {
      display: flex;
      align-items: flex-start;
      gap: var(--app-space-3);
      color: var(--tui-status-positive);
    }

    .submit-info h3 {
      font-size: 1rem;
      font-weight: 820;
    }

    .submit-info p {
      margin-block-start: 0.25rem;
      line-height: 1.5;
    }

    @media (max-width: 720px) {
      .info-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class Step3PreviewSubmitComponent {
  protected readonly DollarSign = DollarSign;
  protected readonly MapPin = MapPin;
  protected readonly CheckCircle2 = CheckCircle2;
  protected readonly Edit2 = Edit2;

  private readonly transloco = inject(TranslocoService);

  readonly property = input.required<Property>();
  readonly personalInfo = input<Partial<PersonalData> | null>(null);
  readonly employmentHistory = input<Partial<EmploymentData> | null>(null);
  readonly rentalHistory = input<RentalHistory[]>([]);
  readonly isSubmitting = input(false);
  readonly editStep = output<number>();
  readonly submit = output<void>();

  protected getMaritalStatusLabel(status?: string): string {
    if (!status) return '-';
    return this.transloco.translate(`rentalApp.maritalStatus.${status}`) || status;
  }

  protected getEmploymentTypeLabel(type?: string): string {
    if (!type) return '-';
    return this.transloco.translate(`rentalApp.employmentTypes.${type}`) || type;
  }
}
