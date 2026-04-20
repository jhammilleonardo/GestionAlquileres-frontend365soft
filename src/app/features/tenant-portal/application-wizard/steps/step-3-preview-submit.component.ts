import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  LucideAngularModule,
  User,
  Mail,
  Phone,
  Calendar,
  Building2,
  Briefcase,
  DollarSign,
  MapPin,
  CheckCircle2,
  Edit2,
  ArrowLeft,
} from 'lucide-angular';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { inject } from '@angular/core';
import { TenantDatePipe } from '../../../../shared/pipes/tenant-date.pipe';
import { TenantCurrencyPipe } from '../../../../shared/pipes/tenant-currency.pipe';
import { Property } from '../../../../core/models/property.model';
import {
  PersonalData,
  EmploymentData,
  RentalHistory,
} from '../../../../core/models/application.model';

@Component({
  selector: 'app-step-3-preview-submit',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    LucideAngularModule,
    TranslocoModule,
    TenantDatePipe,
    TenantCurrencyPipe,
  ],
  providers: [provideTranslocoScope('rentalApp')],
  template: `
    <div class="step-content">
      <div class="step-header">
        <h2>{{ 'rentalApp.step3Title' | transloco }}</h2>
        <p>{{ 'rentalApp.step3Subtitle' | transloco }}</p>
      </div>

      <!-- Property Summary -->
      <mat-card class="summary-card">
        <mat-card-header>
          <mat-card-title>{{ 'rentalApp.selectedProperty' | transloco }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="property-summary">
            <h3>{{ property().title }}</h3>
            <div class="property-details">
              <div class="detail-item">
                <lucide-icon [img]="MapPin" [size]="16"></lucide-icon>
                <span
                  >{{ property().addresses?.[0]?.city || '-' }},
                  {{ property().addresses?.[0]?.country || '-' }}</span
                >
              </div>
              <div class="detail-item">
                <lucide-icon [img]="DollarSign" [size]="16"></lucide-icon>
                <span
                  >{{ property().monthly_rent | tenantCurrency }}
                  {{ 'rentalApp.perMonth' | transloco }}</span
                >
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Personal Info Summary -->
      <mat-card class="summary-card">
        <div class="card-header-with-action">
          <mat-card-title>{{ 'rentalApp.personalInfoSection' | transloco }}</mat-card-title>
          <button mat-icon-button color="primary" (click)="editStep.emit(0)" class="edit-btn">
            <lucide-icon [img]="Edit2" [size]="18"></lucide-icon>
          </button>
        </div>
        <mat-card-content>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">{{ 'rentalApp.fullName' | transloco }}</div>
              <div class="info-value">{{ personalInfo()?.full_name || '-' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">{{ 'rentalApp.emailLabel' | transloco }}</div>
              <div class="info-value">{{ personalInfo()?.email || '-' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">{{ 'rentalApp.phone' | transloco }}</div>
              <div class="info-value">{{ personalInfo()?.phone || '-' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">{{ 'rentalApp.birthDate' | transloco }}</div>
              <div class="info-value">{{ personalInfo()?.birth_date | tenantDate }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">{{ 'rentalApp.nationalId' | transloco }}</div>
              <div class="info-value">{{ personalInfo()?.national_id || '-' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">{{ 'rentalApp.maritalStatusLabel' | transloco }}</div>
              <div class="info-value">
                {{ getMaritalStatusLabel(personalInfo()?.marital_status) }}
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">{{ 'rentalApp.dependentsLabel' | transloco }}</div>
              <div class="info-value">{{ personalInfo()?.number_of_dependents || 0 }}</div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Employment Info Summary -->
      <mat-card class="summary-card">
        <div class="card-header-with-action">
          <mat-card-title>{{ 'rentalApp.employmentSection' | transloco }}</mat-card-title>
          <button mat-icon-button color="primary" (click)="editStep.emit(1)" class="edit-btn">
            <lucide-icon [img]="Edit2" [size]="18"></lucide-icon>
          </button>
        </div>
        <mat-card-content>
          <div class="section-title">{{ 'rentalApp.currentJobSection' | transloco }}</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">{{ 'rentalApp.companyLabel' | transloco }}</div>
              <div class="info-value">{{ employmentHistory()?.current_job?.company || '-' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">{{ 'rentalApp.positionLabel' | transloco }}</div>
              <div class="info-value">{{ employmentHistory()?.current_job?.position || '-' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">{{ 'rentalApp.employmentTypeSummary' | transloco }}</div>
              <div class="info-value">
                {{ getEmploymentTypeLabel(employmentHistory()?.current_job?.employment_type) }}
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">{{ 'rentalApp.salarySummary' | transloco }}</div>
              <div class="info-value">
                {{ employmentHistory()?.current_job?.salary | tenantCurrency }}
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">{{ 'rentalApp.startDateSummary' | transloco }}</div>
              <div class="info-value">
                {{ employmentHistory()?.current_job?.start_date | tenantDate }}
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">{{ 'rentalApp.supervisorLabel' | transloco }}</div>
              <div class="info-value">
                {{ employmentHistory()?.current_job?.supervisor_name || '-' }}
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">{{ 'rentalApp.supervisorPhoneLabel' | transloco }}</div>
              <div class="info-value">
                {{ employmentHistory()?.current_job?.supervisor_phone || '-' }}
              </div>
            </div>
          </div>

          @if (employmentHistory()?.previous_job?.company) {
            <div class="section-title">{{ 'rentalApp.previousJobSection' | transloco }}</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">{{ 'rentalApp.companyLabel' | transloco }}</div>
                <div class="info-value">{{ employmentHistory()?.previous_job?.company }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">{{ 'rentalApp.positionLabel' | transloco }}</div>
                <div class="info-value">{{ employmentHistory()?.previous_job?.position }}</div>
              </div>
            </div>
          }

          @if (rentalHistory() && rentalHistory().length > 0) {
            <div class="section-title">{{ 'rentalApp.rentalHistorySection' | transloco }}</div>
            <div class="rental-history-summary">
              @for (history of rentalHistory(); track history) {
                <div class="history-summary-item">
                  <div class="history-address">
                    <lucide-icon [img]="MapPin" [size]="14"></lucide-icon>
                    <span>{{ history.property_address }}</span>
                  </div>
                  <div class="history-details">
                    <span
                      >{{ history.monthly_rent | tenantCurrency }}/{{
                        'common.month' | transloco
                      }}</span
                    >
                    <span>{{ history.start_date | tenantDate }}</span>
                  </div>
                </div>
              }
            </div>
          }
        </mat-card-content>
      </mat-card>

      <!-- Submit Section -->
      <div class="submit-section">
        <div class="submit-info">
          <lucide-icon [img]="CheckCircle2" [size]="24" class="success-icon"></lucide-icon>
          <div class="submit-text">
            <h4>{{ 'rentalApp.readyToSubmit' | transloco }}</h4>
            <p>{{ 'rentalApp.readyDesc' | transloco }}</p>
          </div>
        </div>

        <div class="submit-actions">
          <button
            mat-stroked-button
            color="primary"
            class="back-action-btn"
            (click)="editStep.emit(0)"
          >
            <lucide-icon [img]="ArrowLeft" [size]="18"></lucide-icon>
            {{ 'rentalApp.backToStep1' | transloco }}
          </button>

          <button
            mat-raised-button
            color="primary"
            class="submit-btn"
            (click)="onSubmit()"
            [disabled]="isSubmitting()"
          >
            @if (isSubmitting()) {
              <mat-spinner diameter="20" color="accent"></mat-spinner>
              <span>{{ 'rentalApp.submitting' | transloco }}</span>
            } @else {
              <lucide-icon [img]="CheckCircle2" [size]="20"></lucide-icon>
              <span>{{ 'rentalApp.submitBtn' | transloco }}</span>
            }
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .step-content {
        padding: 24px 0;
      }

      .step-header {
        margin-bottom: 32px;
        text-align: center;
      }

      .step-header h2 {
        margin: 0 0 8px;
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--mat-sys-on-surface);
      }

      .step-header p {
        margin: 0;
        font-size: 1rem;
        color: var(--mat-sys-on-surface-variant);
      }

      .summary-card {
        margin-bottom: 24px;
        border: 1px solid var(--mat-sys-outline-variant);
      }

      .summary-card mat-card-header {
        padding: 16px 24px;
        background: var(--mat-sys-surface-container-low);
      }

      .summary-card mat-card-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--mat-sys-on-surface);
      }

      .summary-card mat-card-content {
        padding: 24px;
      }

      .card-header-with-action {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      }

      .edit-btn {
        width: 36px;
        height: 36px;
      }

      .property-summary h3 {
        margin: 0 0 12px;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--mat-sys-on-surface);
      }

      .property-details {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .detail-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.9375rem;
        color: var(--mat-sys-on-surface-variant);
      }

      .section-title {
        font-size: 1rem;
        font-weight: 600;
        color: var(--mat-sys-primary);
        margin: 16px 0 12px;
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .info-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--mat-sys-on-surface-variant);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .info-value {
        font-size: 0.9375rem;
        color: var(--mat-sys-on-surface);
        font-weight: 500;
      }

      .rental-history-summary {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 12px;
      }

      .history-summary-item {
        padding: 12px;
        background: var(--mat-sys-surface-container-low);
        border-radius: 8px;
        border: 1px solid var(--mat-sys-outline-variant);
      }

      .history-address {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
        color: var(--mat-sys-on-surface);
        margin-bottom: 4px;
      }

      .history-details {
        display: flex;
        gap: 16px;
        font-size: 0.875rem;
        color: var(--mat-sys-on-surface-variant);
      }

      .submit-section {
        background: var(--mat-sys-surface-container-low);
        border-radius: 12px;
        padding: 24px;
        border: 1px solid var(--mat-sys-primary);
      }

      .submit-info {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
      }

      .success-icon {
        color: var(--mat-sys-primary);
        flex-shrink: 0;
      }

      .submit-text h4 {
        margin: 0 0 4px;
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--mat-sys-on-surface);
      }

      .submit-text p {
        margin: 0;
        font-size: 0.9375rem;
        color: var(--mat-sys-on-surface-variant);
      }

      .submit-actions {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
      }

      .back-action-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
      }

      .submit-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        flex: 2;
        height: 52px;
        font-size: 1rem;
        font-weight: 600;
        border-radius: 8px;
      }

      @media (max-width: 768px) {
        .info-grid {
          grid-template-columns: 1fr;
        }

        .submit-actions {
          flex-direction: column;
        }

        .back-action-btn,
        .submit-btn {
          width: 100%;
          flex: none;
        }

        .step-content {
          padding: 16px 0;
        }

        .summary-card mat-card-content {
          padding: 16px;
        }
      }
    `,
  ],
})
export class Step3PreviewSubmitComponent {
  readonly User = User;
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly Calendar = Calendar;
  readonly Building2 = Building2;
  readonly Briefcase = Briefcase;
  readonly DollarSign = DollarSign;
  readonly MapPin = MapPin;
  readonly CheckCircle2 = CheckCircle2;
  readonly Edit2 = Edit2;
  readonly ArrowLeft = ArrowLeft;

  private transloco = inject(TranslocoService);

  property = input.required<Property>();
  personalInfo = input<Partial<PersonalData> | null>(null);
  employmentHistory = input<Partial<EmploymentData> | null>(null);
  rentalHistory = input<RentalHistory[]>([]);
  isSubmitting = input<boolean>(false);

  editStep = output<number>();
  submit = output<void>();

  onSubmit(): void {
    this.submit.emit();
  }

  getMaritalStatusLabel(status?: string): string {
    if (!status) return '-';
    return this.transloco.translate(`rentalApp.maritalStatus.${status}`) || status;
  }

  getEmploymentTypeLabel(type?: string): string {
    if (!type) return '-';
    return this.transloco.translate(`rentalApp.employmentTypes.${type}`) || type;
  }
}
