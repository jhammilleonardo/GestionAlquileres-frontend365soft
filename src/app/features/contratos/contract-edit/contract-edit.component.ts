import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { LucideAngularModule, ArrowLeft, Save, X, AlertCircle } from 'lucide-angular';
import { AdminContractService } from '../../../core/services/admin/admin-contract.service';
import { SlugService } from '../../../core/services/slug.service';
import {
  UpdateContractDTO,
  Contract,
  ContractStatus,
  SERVICE_OPTIONS,
  BANK_ACCOUNT_TYPES,
} from '../../../core/models/contract.model';

@Component({
  selector: 'app-contract-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatIconModule,
    LucideAngularModule,
  ],
  template: `
    <div class="contract-edit-container">
      <!-- Header -->
      <div class="page-header">
        <button mat-button class="back-button" (click)="goBack()">
          <lucide-icon [img]="ArrowLeft" [size]="20"></lucide-icon>
          Volver
        </button>
        <h1>Editar Contrato {{ contractNumber() }}</h1>
      </div>

      <!-- Alerta de solo borradores -->
      @if (currentContract() && currentContract()!.status !== ContractStatus.BORRADOR) {
        <mat-card class="warning-card">
          <lucide-icon [img]="AlertCircle" [size]="24" class="warning-icon"></lucide-icon>
          <div class="warning-content">
            <h3>Contrato no editable</h3>
            <p>
              Solo se pueden editar contratos en estado <strong>Borrador</strong>. Este contrato
              está en estado <strong>{{ ContractStatusLabels[currentContract()!.status] }}</strong
              >.
            </p>
            <button mat-raised-button color="warn" (click)="goBack()">Volver</button>
          </div>
        </mat-card>
      } @else if (isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Cargando contrato...</p>
        </div>
      } @else if (currentContract()) {
        <mat-card class="form-card">
          <form [formGroup]="contractForm" (ngSubmit)="onSubmit()">
            <!-- Información Básica -->
            <div class="form-section">
              <h2>Información Básica</h2>

              <div class="info-readonly">
                <div class="info-item">
                  <label>Inquilino:</label>
                  <span>{{
                    currentContract()!.tenant?.name || currentContract()!.tenant_name || 'N/A'
                  }}</span>
                </div>
                <div class="info-item">
                  <label>Propiedad:</label>
                  <span>{{
                    currentContract()!.property?.title || currentContract()!.property_title || 'N/A'
                  }}</span>
                </div>
              </div>

              <!-- Fechas -->
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Fecha Inicio *</mat-label>
                  <input
                    matInput
                    [matDatepicker]="startDatePicker"
                    formControlName="start_date"
                    required
                  />
                  <mat-datepicker-toggle
                    matIconSuffix
                    [for]="startDatePicker"
                  ></mat-datepicker-toggle>
                  <mat-datepicker #startDatePicker></mat-datepicker>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Fecha Fin *</mat-label>
                  <input
                    matInput
                    [matDatepicker]="endDatePicker"
                    formControlName="end_date"
                    required
                  />
                  <mat-datepicker-toggle
                    matIconSuffix
                    [for]="endDatePicker"
                  ></mat-datepicker-toggle>
                  <mat-datepicker #endDatePicker></mat-datepicker>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Entrega Llaves</mat-label>
                  <input
                    matInput
                    [matDatepicker]="keyDatePicker"
                    formControlName="key_delivery_date"
                  />
                  <mat-datepicker-toggle
                    matIconSuffix
                    [for]="keyDatePicker"
                  ></mat-datepicker-toggle>
                  <mat-datepicker #keyDatePicker></mat-datepicker>
                </mat-form-field>
              </div>

              <!-- Alquiler -->
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Alquiler Mensual (Bs) *</mat-label>
                  <input matInput type="number" formControlName="monthly_rent" required />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Día de Pago</mat-label>
                  <input matInput type="number" min="1" max="31" formControlName="payment_day" />
                </mat-form-field>
              </div>

              <!-- Método de pago -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Método de Pago</mat-label>
                <input matInput formControlName="payment_method" />
              </mat-form-field>
            </div>

            <!-- Condiciones de Pago -->
            <div class="form-section">
              <h2>Condiciones de Pago</h2>

              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>% Recargo por Mora</mat-label>
                  <input
                    matInput
                    type="number"
                    formControlName="late_fee_percentage"
                    placeholder="5"
                  />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Días de Gracia</mat-label>
                  <input matInput type="number" formControlName="grace_days" placeholder="3" />
                </mat-form-field>
              </div>
            </div>

            <!-- Servicios Incluidos -->
            <div class="form-section">
              <h2>Servicios Incluidos</h2>
              <div class="services-grid">
                @for (service of serviceOptions; track service) {
                  <mat-checkbox
                    [checked]="isServiceSelected(service)"
                    (change)="toggleService(service, $event)"
                  >
                    {{ service }}
                  </mat-checkbox>
                }
              </div>
            </div>

            <!-- Responsabilidades -->
            <div class="form-section">
              <h2>Responsabilidades</h2>

              <mat-form-field appearance="outline" class="full-width textarea-field">
                <mat-label>Responsabilidades del Inquilino</mat-label>
                <textarea matInput formControlName="tenant_responsibilities" rows="3"></textarea>
                <mat-hint
                  >Ej: Mantener la propiedad en buen estado, pagar servicios a su cargo</mat-hint
                >
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width textarea-field">
                <mat-label>Responsabilidades del Propietario</mat-label>
                <textarea matInput formControlName="owner_responsibilities" rows="3"></textarea>
                <mat-hint
                  >Ej: Realizar reparaciones necesarias, mantener la propiedad habitable</mat-hint
                >
              </mat-form-field>
            </div>

            <!-- Prohibiciones y Reglas -->
            <div class="form-section">
              <h2>Prohibiciones y Reglas</h2>

              <mat-form-field appearance="outline" class="full-width textarea-field">
                <mat-label>Prohibiciones</mat-label>
                <textarea matInput formControlName="prohibitions" rows="2"></textarea>
                <mat-hint>Ej: No se permiten mascotas, no fumadores</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width textarea-field">
                <mat-label>Reglas de Convivencia</mat-label>
                <textarea matInput formControlName="coexistence_rules" rows="2"></textarea>
                <mat-hint
                  >Ej: Respetar horarios de descanso, no hacer ruido después de las 22hs</mat-hint
                >
              </mat-form-field>
            </div>

            <!-- Términos del Contrato -->
            <div class="form-section">
              <h2>Términos del Contrato</h2>

              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Términos de Renovación</mat-label>
                  <textarea matInput formControlName="renewal_terms" rows="2"></textarea>
                  <mat-hint
                    >Ej: El contrato se renueva automáticamente si ninguna de las partes avisa con
                    30 días de antelación</mat-hint
                  >
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="full-width textarea-field">
                <mat-label>Términos de Rescisión</mat-label>
                <textarea matInput formControlName="termination_terms" rows="2"></textarea>
                <mat-hint
                  >Ej: Cualquiera de las partes puede rescindir con 60 días de preaviso</mat-hint
                >
              </mat-form-field>

              <div class="form-row">
                <mat-checkbox formControlName="auto_renew"> Renovación Automática </mat-checkbox>

                <mat-form-field appearance="outline">
                  <mat-label>Días de Aviso</mat-label>
                  <input matInput type="number" formControlName="renewal_notice_days" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>% Aumento Anual</mat-label>
                  <input matInput type="number" formControlName="auto_increase_percentage" />
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Jurisdicción</mat-label>
                <input matInput formControlName="jurisdiction" />
              </mat-form-field>
            </div>

            <!-- Datos Bancarios -->
            <div class="form-section">
              <h2>Datos Bancarios</h2>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Nombre del Banco</mat-label>
                <input matInput formControlName="bank_name" />
              </mat-form-field>

              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Tipo de Cuenta</mat-label>
                  <mat-select formControlName="bank_account_type">
                    <mat-option value="">Seleccionar...</mat-option>
                    @for (option of bankAccountTypes; track option.value) {
                      <mat-option [value]="option.value">{{ option.label }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Número de Cuenta</mat-label>
                  <input matInput formControlName="bank_account_number" />
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Titular de la Cuenta</mat-label>
                <input matInput formControlName="bank_account_holder" />
              </mat-form-field>
            </div>

            <!-- Errores -->
            @if (errorMessage()) {
              <div class="error-message">
                <mat-icon class="error-icon">error_outline</mat-icon>
                {{ errorMessage() }}
              </div>
            }

            <!-- Acciones -->
            <div class="form-actions">
              <button
                type="submit"
                mat-raised-button
                color="primary"
                [disabled]="contractForm.invalid || isSubmitting"
              >
                @if (isSubmitting) {
                  <mat-spinner diameter="20" class="button-spinner"></mat-spinner>
                  Guardando...
                } @else {
                  <lucide-icon [img]="Save" [size]="18"></lucide-icon>
                  Guardar Cambios
                }
              </button>
              <button type="button" mat-stroked-button (click)="goBack()" [disabled]="isSubmitting">
                <lucide-icon [img]="X" [size]="18"></lucide-icon>
                Cancelar
              </button>
            </div>
          </form>
        </mat-card>
      }
    </div>
  `,
  styles: [
    `
      .contract-edit-container {
        max-width: 900px;
        margin: 0 auto;
        padding: 24px;
      }

      .page-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
      }

      .back-button {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .page-header h1 {
        margin: 0;
        font-size: 1.75rem;
        font-weight: 600;
      }

      .warning-card {
        padding: 24px;
        display: flex;
        gap: 16px;
        align-items: flex-start;
        background: #fff3cd;
        border-left: 4px solid #ffc107;
      }

      .warning-icon {
        color: #ffc107;
        flex-shrink: 0;
      }

      .warning-content h3 {
        margin: 0 0 8px;
        color: #856404;
      }

      .warning-content p {
        margin: 0 0 16px;
        color: #856404;
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px;
        gap: 16px;
      }

      .form-card {
        padding: 24px;
      }

      .form-section {
        margin-bottom: 32px;
        padding-bottom: 24px;
        border-bottom: 1px solid var(--mat-sys-outline-variant);
      }

      .form-section:last-of-type {
        border-bottom: none;
      }

      .form-section h2 {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0 0 16px;
        color: var(--mat-sys-primary);
      }

      .full-width {
        width: 100%;
      }

      .form-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 16px;
      }

      .services-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 12px;
      }

      .info-readonly {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        padding: 16px;
        background: var(--mat-sys-surface-container-low);
        border-radius: 8px;
        margin-bottom: 16px;
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .info-item label {
        font-size: 12px;
        color: var(--mat-sys-on-surface-variant);
        font-weight: 500;
      }

      .info-item span {
        font-weight: 500;
      }

      .textarea-field {
        margin-bottom: 16px;
      }

      .error-message {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background: #fee;
        border-left: 4px solid #f44;
        border-radius: 4px;
        margin-bottom: 16px;
        color: #c33;
      }

      .error-icon {
        color: #f44;
      }

      .form-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        padding-top: 16px;
        border-top: 1px solid var(--mat-sys-outline-variant);
      }

      .form-actions button {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .button-spinner {
        display: inline-flex;
      }

      @media (max-width: 768px) {
        .contract-edit-container {
          padding: 16px;
        }

        .page-header {
          flex-direction: column;
          align-items: flex-start;
        }

        .form-row {
          grid-template-columns: 1fr;
        }

        .services-grid {
          grid-template-columns: 1fr;
        }

        .info-readonly {
          grid-template-columns: 1fr;
        }

        .form-actions {
          flex-direction: column;
        }

        .form-actions button {
          width: 100%;
        }
      }
    `,
  ],
})
export class ContractEditComponent implements OnInit {
  readonly ArrowLeft = ArrowLeft;
  readonly Save = Save;
  readonly X = X;
  readonly AlertCircle = AlertCircle;
  readonly ContractStatus = ContractStatus;
  readonly ContractStatusLabels = {
    [ContractStatus.BORRADOR]: 'Borrador',
    [ContractStatus.ACTIVO]: 'Activo',
    [ContractStatus.FINALIZADO]: 'Finalizado',
  };

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private contractService = inject(AdminContractService);
  private slugService = inject(SlugService);

  // Formulario reactivo
  contractForm: FormGroup;

  // Estado
  isSubmitting = false;
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  currentContract = signal<Contract | null>(null);
  contractNumber = signal<string>('');

  // Opciones
  serviceOptions = SERVICE_OPTIONS;
  bankAccountTypes = BANK_ACCOUNT_TYPES;

  constructor() {
    this.contractForm = this.fb.group({
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      key_delivery_date: [''],
      monthly_rent: ['', [Validators.required, Validators.min(0.01)]],
      payment_day: [''],
      payment_method: [''],
      late_fee_percentage: [''],
      grace_days: [''],
      tenant_responsibilities: [''],
      owner_responsibilities: [''],
      prohibitions: [''],
      coexistence_rules: [''],
      renewal_terms: [''],
      termination_terms: [''],
      auto_renew: [false],
      renewal_notice_days: [''],
      auto_increase_percentage: [''],
      jurisdiction: [''],
      bank_name: [''],
      bank_account_type: [''],
      bank_account_number: [''],
      bank_account_holder: [''],
      included_services: [[]],
    });
  }

  ngOnInit(): void {
    const contractId = this.route.snapshot.paramMap.get('id');
    if (contractId) {
      this.loadContract(parseInt(contractId));
    } else {
      this.errorMessage.set('No se especificó el contrato');
      this.isLoading.set(false);
    }
  }

  private loadContract(id: number): void {
    this.contractService.getContract(id).subscribe({
      next: (contract) => {
        this.currentContract.set(contract);
        this.contractNumber.set(contract.contract_number);
        this.populateForm(contract);
        this.isLoading.set(false);
      },
      error: (_error) => {
        this.errorMessage.set('Error al cargar el contrato');
        this.isLoading.set(false);
      },
    });
  }

  private populateForm(contract: Contract): void {
    // Convertir monthly_rent, deposit_amount, late_fee_percentage y auto_increase_percentage a número si vienen como string
    const monthlyRent =
      typeof contract.monthly_rent === 'string'
        ? parseFloat(contract.monthly_rent)
        : contract.monthly_rent;
    const lateFeePercentage =
      contract.late_fee_percentage && typeof contract.late_fee_percentage === 'string'
        ? parseFloat(contract.late_fee_percentage)
        : contract.late_fee_percentage;
    const autoIncreasePercentage =
      contract.auto_increase_percentage && typeof contract.auto_increase_percentage === 'string'
        ? parseFloat(contract.auto_increase_percentage)
        : contract.auto_increase_percentage;

    // Información básica
    this.contractForm.patchValue({
      start_date: contract.start_date ? new Date(contract.start_date) : '',
      end_date: contract.end_date ? new Date(contract.end_date) : '',
      key_delivery_date: contract.key_delivery_date ? new Date(contract.key_delivery_date) : '',
      monthly_rent: monthlyRent,
      payment_day: contract.payment_day,
      payment_method: contract.payment_method,
      late_fee_percentage: lateFeePercentage,
      grace_days: contract.grace_days,
      tenant_responsibilities: contract.tenant_responsibilities,
      owner_responsibilities: contract.owner_responsibilities,
      prohibitions: contract.prohibitions,
      coexistence_rules: contract.coexistence_rules,
      renewal_terms: contract.renewal_terms,
      termination_terms: contract.termination_terms,
      auto_renew: contract.auto_renew || false,
      renewal_notice_days: contract.renewal_notice_days,
      auto_increase_percentage: autoIncreasePercentage,
      jurisdiction: contract.jurisdiction,
      bank_name: contract.bank_name,
      bank_account_type: contract.bank_account_type,
      bank_account_number: contract.bank_account_number,
      bank_account_holder: contract.bank_account_holder,
      included_services: contract.included_services || [],
    });
  }

  isServiceSelected(service: string): boolean {
    const services = (this.contractForm.get('included_services')?.value as string[]) || [];
    return services.includes(service);
  }

  toggleService(service: string, event: any): void {
    const services = (this.contractForm.get('included_services')?.value as string[]) || [];
    const index = services.indexOf(service);

    if (event.checked) {
      if (index === -1) {
        services.push(service);
      }
    } else {
      if (index > -1) {
        services.splice(index, 1);
      }
    }

    this.contractForm.patchValue({ included_services: services });
  }

  onSubmit(): void {
    if (this.contractForm.invalid) {
      this.contractForm.markAllAsTouched();
      return;
    }

    // Validar fechas
    const startDate = this.contractForm.value.start_date;
    const endDate = this.contractForm.value.end_date;

    if (endDate && startDate && endDate <= startDate) {
      this.errorMessage.set('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    this.isSubmitting = true;
    this.errorMessage.set(null);

    const contractId = this.currentContract()!.id;
    const formData = this.contractForm.value;

    // Obtener servicios seleccionados
    const selectedServices = (this.contractForm.get('included_services')?.value as string[]) || [];

    const updateData: UpdateContractDTO = {
      start_date: startDate ? this.formatDate(startDate) : undefined,
      end_date: endDate ? this.formatDate(endDate) : undefined,
      key_delivery_date: formData.key_delivery_date
        ? this.formatDate(formData.key_delivery_date)
        : undefined,
      monthly_rent: formData.monthly_rent ? parseFloat(formData.monthly_rent) : undefined,
      payment_day: formData.payment_day ? parseInt(formData.payment_day) : undefined,
      payment_method: formData.payment_method || undefined,
      late_fee_percentage: formData.late_fee_percentage
        ? parseFloat(formData.late_fee_percentage)
        : undefined,
      grace_days: formData.grace_days ? parseInt(formData.grace_days) : undefined,
      included_services: selectedServices,
      tenant_responsibilities: formData.tenant_responsibilities || undefined,
      owner_responsibilities: formData.owner_responsibilities || undefined,
      prohibitions: formData.prohibitions || undefined,
      coexistence_rules: formData.coexistence_rules || undefined,
      renewal_terms: formData.renewal_terms || undefined,
      termination_terms: formData.termination_terms || undefined,
      auto_renew: formData.auto_renew,
      renewal_notice_days: formData.renewal_notice_days
        ? parseInt(formData.renewal_notice_days)
        : undefined,
      auto_increase_percentage: formData.auto_increase_percentage
        ? parseFloat(formData.auto_increase_percentage)
        : undefined,
      jurisdiction: formData.jurisdiction || undefined,
      bank_name: formData.bank_name || undefined,
      bank_account_type: formData.bank_account_type || undefined,
      bank_account_number: formData.bank_account_number || undefined,
      bank_account_holder: formData.bank_account_holder || undefined,
    };

    this.contractService.updateContract(contractId, updateData).subscribe({
      next: (contract) => {
        this.isSubmitting = false;
        const contractUrl = this.slugService.buildUrl(`/contratos/${contract.id}`);
        this.router.navigateByUrl(contractUrl);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage.set(error.error?.message || 'Error al actualizar el contrato');
      },
    });
  }

  goBack(): void {
    const contractUrl = this.slugService.buildUrl(`/contratos/${this.currentContract()!.id}`);
    this.router.navigateByUrl(contractUrl);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
