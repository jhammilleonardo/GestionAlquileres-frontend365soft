import { Component, input, output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormArray, FormBuilder, ReactiveFormsModule, Validators, FormControl, AbstractControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { LucideAngularModule, Building2, Briefcase, DollarSign, Phone, User, MapPin, Plus, Trash2 } from 'lucide-angular';

@Component({
  selector: 'app-step-2-employment-history',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    LucideAngularModule
  ],
  template: `
    <div class="step-content">
      <div class="step-header">
        <h2>Información Laboral</h2>
        <p>Completa tu información de empleo e historial de alquiler</p>
      </div>

      <!-- Employment Type -->
      <mat-card class="section-card">
        <mat-card-header>
          <mat-card-title>Empleo Actual</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="form-grid">
            <div class="form-field full-width">
              <mat-form-field appearance="outline" class="custom-field">
                <mat-label>Empresa</mat-label>
                <lucide-icon matPrefix [img]="Building2" [size]="20"></lucide-icon>
                <input
                  matInput
                  [formControl]="getControl('current_job.company')"
                  placeholder="Nombre de la empresa">
                @if (form.get('current_job.company')?.hasError('required') && form.get('current_job.company')?.touched) {
                  <mat-error>La empresa es requerida</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="form-field">
              <mat-form-field appearance="outline" class="custom-field">
                <mat-label>Puesto / Posición</mat-label>
                <lucide-icon matPrefix [img]="Briefcase" [size]="20"></lucide-icon>
                <input
                  matInput
                  [formControl]="getControl('current_job.position')"
                  placeholder="Gerente, Desarrollador, etc.">
                @if (form.get('current_job.position')?.hasError('required') && form.get('current_job.position')?.touched) {
                  <mat-error>El puesto es requerido</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="form-field">
              <mat-form-field appearance="outline" class="custom-field">
                <mat-label>Tipo de Empleo</mat-label>
                <lucide-icon matPrefix [img]="Briefcase" [size]="20"></lucide-icon>
                <mat-select [formControl]="getControl('current_job.employment_type')">
                  <mat-option value="tiempo_completo">Tiempo Completo</mat-option>
                  <mat-option value="medio_tiempo">Medio Tiempo</mat-option>
                  <mat-option value="freelance">Freelance</mat-option>
                  <mat-option value="autonomo">Autónomo</mat-option>
                  <mat-option value="empresario">Empresario</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="form-field">
              <mat-form-field appearance="outline" class="custom-field">
                <mat-label>Salario Mensual</mat-label>
                <lucide-icon matPrefix [img]="DollarSign" [size]="20"></lucide-icon>
                <input
                  matInput
                  type="number"
                  [formControl]="getControl('current_job.salary')"
                  placeholder="5000">
                @if (form.get('current_job.salary')?.hasError('required') && form.get('current_job.salary')?.touched) {
                  <mat-error>El salario es requerido</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="form-field">
              <mat-form-field appearance="outline" class="custom-field">
                <mat-label>Moneda</mat-label>
                <mat-select [formControl]="getControl('current_job.currency')">
                  <mat-option value="USD">USD - Dólar</mat-option>
                  <mat-option value="EUR">EUR - Euro</mat-option>
                  <mat-option value="GBP">GBP - Libra</mat-option>
                  <mat-option value="MXN">MXN - Peso Mexicano</mat-option>
                  <mat-option value="COP">COP - Peso Colombiano</mat-option>
                  <mat-option value="ARS">ARS - Peso Argentino</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="form-field">
              <mat-form-field appearance="outline" class="custom-field">
                <mat-label>Fecha de Inicio</mat-label>
                <input
                  matInput
                  type="date"
                  [formControl]="getControl('current_job.start_date')">
                @if (form.get('current_job.start_date')?.hasError('required') && form.get('current_job.start_date')?.touched) {
                  <mat-error>La fecha es requerida</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="form-field full-width">
              <mat-form-field appearance="outline" class="custom-field">
                <mat-label>Nombre del Supervisor</mat-label>
                <lucide-icon matPrefix [img]="User" [size]="20"></lucide-icon>
                <input
                  matInput
                  [formControl]="getControl('current_job.supervisor_name')"
                  placeholder="Nombre completo">
                @if (form.get('current_job.supervisor_name')?.hasError('required') && form.get('current_job.supervisor_name')?.touched) {
                  <mat-error>El nombre es requerido</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="form-field full-width">
              <mat-form-field appearance="outline" class="custom-field">
                <mat-label>Teléfono del Supervisor</mat-label>
                <lucide-icon matPrefix [img]="Phone" [size]="20"></lucide-icon>
                <input
                  matInput
                  type="tel"
                  [formControl]="getControl('current_job.supervisor_phone')"
                  placeholder="+1 234 567 8900">
                @if (form.get('current_job.supervisor_phone')?.hasError('required') && form.get('current_job.supervisor_phone')?.touched) {
                  <mat-error>El teléfono es requerido</mat-error>
                }
              </mat-form-field>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Previous Job (Optional) -->
      <mat-card class="section-card">
        <mat-card-header>
          <mat-card-title>Empleo Anterior (Opcional)</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="form-grid">
            <div class="form-field">
              <mat-form-field appearance="outline" class="custom-field">
                <mat-label>Empresa Anterior</mat-label>
                <lucide-icon matPrefix [img]="Building2" [size]="20"></lucide-icon>
                <input
                  matInput
                  [formControl]="getControl('previous_job.company')"
                  placeholder="Nombre de la empresa">
              </mat-form-field>
            </div>

            <div class="form-field">
              <mat-form-field appearance="outline" class="custom-field">
                <mat-label>Puesto Anterior</mat-label>
                <lucide-icon matPrefix [img]="Briefcase" [size]="20"></lucide-icon>
                <input
                  matInput
                  [formControl]="getControl('previous_job.position')"
                  placeholder="Puesto que ocupabas">
              </mat-form-field>
            </div>

            <div class="form-field">
              <mat-form-field appearance="outline" class="custom-field">
                <mat-label>Salario</mat-label>
                <lucide-icon matPrefix [img]="DollarSign" [size]="20"></lucide-icon>
                <input
                  matInput
                  type="number"
                  [formControl]="getControl('previous_job.salary')"
                  placeholder="4000">
              </mat-form-field>
            </div>

            <div class="form-field">
              <mat-form-field appearance="outline" class="custom-field">
                <mat-label>Fecha de Finalización</mat-label>
                <input
                  matInput
                  type="date"
                  [formControl]="getControl('previous_job.end_date')">
              </mat-form-field>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Rental History -->
      <mat-card class="section-card">
        <mat-card-header>
          <mat-card-title>Historial de Alquiler</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="rental-history-list">
            @for (history of rentalHistoryArray.controls; track history; let i = $index) {
              <div class="history-item">
                <div class="history-header">
                  <h4>Alquiler #{{ i + 1 }}</h4>
                  @if (rentalHistoryArray.length > 1) {
                    <button
                      mat-icon-button
                      color="warn"
                      (click)="removeRentalHistory(i)">
                      <lucide-icon [img]="Trash2" [size]="18"></lucide-icon>
                    </button>
                  }
                </div>
                <div class="form-grid">
                  <div class="form-field full-width">
                    <mat-form-field appearance="outline" class="custom-field">
                      <mat-label>Dirección de la Propiedad</mat-label>
                      <lucide-icon matPrefix [img]="MapPin" [size]="20"></lucide-icon>
                      <input
                        matInput
                        [formControl]="getHistoryControl(history, 'property_address')"
                        placeholder="Calle, número, ciudad">
                      @if (history.get('property_address')?.hasError('required') && history.get('property_address')?.touched) {
                        <mat-error>La dirección es requerida</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <div class="form-field">
                    <mat-form-field appearance="outline" class="custom-field">
                      <mat-label>Nombre del Propietario</mat-label>
                      <lucide-icon matPrefix [img]="User" [size]="20"></lucide-icon>
                      <input
                        matInput
                        [formControl]="getHistoryControl(history, 'landlord_name')"
                        placeholder="Nombre completo">
                      @if (history.get('landlord_name')?.hasError('required') && history.get('landlord_name')?.touched) {
                        <mat-error>El nombre es requerido</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <div class="form-field">
                    <mat-form-field appearance="outline" class="custom-field">
                      <mat-label>Teléfono del Propietario</mat-label>
                      <lucide-icon matPrefix [img]="Phone" [size]="20"></lucide-icon>
                      <input
                        matInput
                        type="tel"
                        [formControl]="getHistoryControl(history, 'landlord_phone')"
                        placeholder="+1 234 567 8900">
                      @if (history.get('landlord_phone')?.hasError('required') && history.get('landlord_phone')?.touched) {
                        <mat-error>El teléfono es requerido</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <div class="form-field">
                    <mat-form-field appearance="outline" class="custom-field">
                      <mat-label>Renta Mensual</mat-label>
                      <lucide-icon matPrefix [img]="DollarSign" [size]="20"></lucide-icon>
                      <input
                        matInput
                        type="number"
                        [formControl]="getHistoryControl(history, 'monthly_rent')"
                        placeholder="1500">
                      @if (history.get('monthly_rent')?.hasError('required') && history.get('monthly_rent')?.touched) {
                        <mat-error>La renta es requerida</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <div class="form-field">
                    <mat-form-field appearance="outline" class="custom-field">
                      <mat-label>Fecha de Inicio</mat-label>
                      <input
                        matInput
                        type="date"
                        [formControl]="getHistoryControl(history, 'start_date')">
                      @if (history.get('start_date')?.hasError('required') && history.get('start_date')?.touched) {
                        <mat-error>La fecha es requerida</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <div class="form-field full-width">
                    <mat-form-field appearance="outline" class="custom-field">
                      <mat-label>Razón de mudanza (opcional)</mat-label>
                      <input
                        matInput
                        [formControl]="getHistoryControl(history, 'reason_for_leaving')"
                        placeholder="Por qué te mudaste">
                    </mat-form-field>
                  </div>
                </div>
              </div>
            }
          </div>

          <button
            mat-stroked-button
            color="primary"
            class="add-btn"
            (click)="addRentalHistory()">
            <lucide-icon [img]="Plus" [size]="18"></lucide-icon>
            Agregar Alquiler Anterior
          </button>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
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

    .section-card {
      margin-bottom: 24px;
      border: 1px solid var(--mat-sys-outline-variant);
    }

    .section-card mat-card-header {
      padding: 16px 24px;
      background: var(--mat-sys-surface-container-low);
    }

    .section-card mat-card-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
    }

    .section-card mat-card-content {
      padding: 24px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .form-field {
      width: 100%;
    }

    .form-field.full-width {
      grid-column: 1 / -1;
    }

    .custom-field {
      width: 100%;
    }

    .rental-history-list {
      display: flex;
      flex-direction: column;
      gap: 24px;
      margin-bottom: 16px;
    }

    .history-item {
      padding: 16px;
      background: var(--mat-sys-surface-container-low);
      border-radius: 8px;
      border: 1px solid var(--mat-sys-outline-variant);
    }

    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .history-header h4 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
    }

    .add-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 48px;
      font-weight: 600;
      border-radius: 8px;
    }

    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
      }

      .step-content {
        padding: 16px 0;
      }

      .section-card mat-card-content {
        padding: 16px;
      }
    }
  `]
})
export class Step2EmploymentHistoryComponent implements OnInit {
  readonly Building2 = Building2;
  readonly Briefcase = Briefcase;
  readonly DollarSign = DollarSign;
  readonly Phone = Phone;
  readonly User = User;
  readonly MapPin = MapPin;
  readonly Plus = Plus;
  readonly Trash2 = Trash2;

  formGroup = input.required<FormGroup>();
  isValid = output<boolean>();
  private fb = inject(FormBuilder);

  // Computed property para acceder al formGroup sin paréntesis en el template
  get form(): FormGroup {
    return this.formGroup();
  }

  // Helper para obtener controles de forma segura
  getControl(path: string): FormControl {
    return this.form.get(path) as FormControl;
  }

  // Helper para obtener controles del historial de alquiler
  getHistoryControl(history: AbstractControl, path: string): FormControl {
    return (history as FormGroup).get(path) as FormControl;
  }

  get rentalHistoryArray(): FormArray {
    return this.form.get('rental_history') as FormArray;
  }

  ngOnInit(): void {
    // Add one rental history item by default
    if (this.rentalHistoryArray.length === 0) {
      this.addRentalHistory();
    }

    // Emit validation status on form changes
    this.form.valueChanges.subscribe(() => {
      this.isValid.emit(this.form.valid);
    });
  }

  addRentalHistory(): void {
    const historyForm = this.fb.group({
      property_address: ['', Validators.required],
      landlord_name: ['', Validators.required],
      landlord_phone: ['', [Validators.required, Validators.pattern(/^[+]?[\d\s-()]+$/)]],
      monthly_rent: ['', [Validators.required, Validators.min(0)]],
      start_date: ['', Validators.required],
      end_date: [''],
      reason_for_leaving: ['']
    });

    this.rentalHistoryArray.push(historyForm);
  }

  removeRentalHistory(index: number): void {
    this.rentalHistoryArray.removeAt(index);
  }
}
