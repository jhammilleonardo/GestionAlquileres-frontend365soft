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
  ],
  template: `
    <div class="step-content">
      <div class="step-header">
        <h2>Revisar tu Solicitud</h2>
        <p>Verifica que toda la información sea correcta antes de enviar</p>
      </div>

      <!-- Property Summary -->
      <mat-card class="summary-card">
        <mat-card-header>
          <mat-card-title>Propiedad Seleccionada</mat-card-title>
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
                <span>\${{ property().monthly_rent || 0 }} / mes</span>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Personal Info Summary -->
      <mat-card class="summary-card">
        <div class="card-header-with-action">
          <mat-card-title>Información Personal</mat-card-title>
          <button mat-icon-button color="primary" (click)="editStep.emit(0)" class="edit-btn">
            <lucide-icon [img]="Edit2" [size]="18"></lucide-icon>
          </button>
        </div>
        <mat-card-content>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Nombre Completo</div>
              <div class="info-value">{{ personalInfo()?.full_name || '-' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Email</div>
              <div class="info-value">{{ personalInfo()?.email || '-' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Teléfono</div>
              <div class="info-value">{{ personalInfo()?.phone || '-' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Fecha de Nacimiento</div>
              <div class="info-value">{{ formatDate(personalInfo()?.birth_date) }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">DNI / Pasaporte</div>
              <div class="info-value">{{ personalInfo()?.national_id || '-' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Estado Civil</div>
              <div class="info-value">
                {{ getMaritalStatusLabel(personalInfo()?.marital_status) }}
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">Dependientes</div>
              <div class="info-value">{{ personalInfo()?.number_of_dependents || 0 }}</div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Employment Info Summary -->
      <mat-card class="summary-card">
        <div class="card-header-with-action">
          <mat-card-title>Información Laboral</mat-card-title>
          <button mat-icon-button color="primary" (click)="editStep.emit(1)" class="edit-btn">
            <lucide-icon [img]="Edit2" [size]="18"></lucide-icon>
          </button>
        </div>
        <mat-card-content>
          <div class="section-title">Empleo Actual</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Empresa</div>
              <div class="info-value">{{ employmentHistory()?.current_job?.company || '-' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Puesto</div>
              <div class="info-value">{{ employmentHistory()?.current_job?.position || '-' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Tipo de Empleo</div>
              <div class="info-value">
                {{ getEmploymentTypeLabel(employmentHistory()?.current_job?.employment_type) }}
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">Salario Mensual</div>
              <div class="info-value">
                \${{ employmentHistory()?.current_job?.salary || 0 }}
                {{ employmentHistory()?.current_job?.currency || 'USD' }}
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">Fecha de Inicio</div>
              <div class="info-value">
                {{ formatDate(employmentHistory()?.current_job?.start_date) }}
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">Supervisor</div>
              <div class="info-value">
                {{ employmentHistory()?.current_job?.supervisor_name || '-' }}
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">Teléfono Supervisor</div>
              <div class="info-value">
                {{ employmentHistory()?.current_job?.supervisor_phone || '-' }}
              </div>
            </div>
          </div>

          @if (employmentHistory()?.previous_job?.company) {
            <div class="section-title">Empleo Anterior</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Empresa</div>
                <div class="info-value">{{ employmentHistory()?.previous_job?.company }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Puesto</div>
                <div class="info-value">{{ employmentHistory()?.previous_job?.position }}</div>
              </div>
            </div>
          }

          @if (rentalHistory() && rentalHistory().length > 0) {
            <div class="section-title">Historial de Alquiler</div>
            <div class="rental-history-summary">
              @for (history of rentalHistory(); track history) {
                <div class="history-summary-item">
                  <div class="history-address">
                    <lucide-icon [img]="MapPin" [size]="14"></lucide-icon>
                    <span>{{ history.property_address }}</span>
                  </div>
                  <div class="history-details">
                    <span>\${{ history.monthly_rent }}/mes</span>
                    <span>{{ formatDate(history.start_date) }}</span>
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
            <h4>Listo para enviar</h4>
            <p>Tu solicitud será revisada por el administrador</p>
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
            Volver al Paso 1
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
              <span>Enviando...</span>
            } @else {
              <lucide-icon [img]="CheckCircle2" [size]="20"></lucide-icon>
              <span>Enviar Solicitud</span>
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

  formatDate(dateString?: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  getMaritalStatusLabel(status?: string): string {
    const labels: Record<string, string> = {
      soltero: 'Soltero/a',
      casado: 'Casado/a',
      divorciado: 'Divorciado/a',
      viudo: 'Viudo/a',
      union_libre: 'Unión Libre',
    };
    return labels[status || ''] || status || '-';
  }

  getEmploymentTypeLabel(type?: string): string {
    const labels: Record<string, string> = {
      tiempo_completo: 'Tiempo Completo',
      medio_tiempo: 'Medio Tiempo',
      freelance: 'Freelance',
      autonomo: 'Autónomo',
      empresario: 'Empresario',
    };
    return labels[type || ''] || type || '-';
  }
}
