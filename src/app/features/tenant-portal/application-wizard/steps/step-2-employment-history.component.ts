import { Component, input, output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormControl,
  AbstractControl,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import {
  LucideAngularModule,
  Building2,
  Briefcase,
  DollarSign,
  Phone,
  User,
  MapPin,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Calendar,
} from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';

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
    MatStepperModule,
    MatDatepickerModule,
    MatNativeDateModule,
    LucideAngularModule,
    TranslocoModule,
  ],
  providers: [provideTranslocoScope('rentalApp')],
  template: `
    <div class="step-content">
      <div class="step-header">
        <h2>{{ 'rentalApp.step2Title' | transloco }}</h2>
        <p>{{ 'rentalApp.step2Subtitle' | transloco }}</p>
      </div>

      <!-- Employment Type -->
      <mat-card class="section-card">
        <mat-card-header>
          <mat-card-title>{{ 'rentalApp.currentJob' | transloco }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="form-grid">
            <div class="form-field full-width">
              <mat-form-field appearance="outline" class="custom-field">
                <mat-label>{{ 'rentalApp.company' | transloco }}</mat-label>
                <lucide-icon matPrefix [img]="Building2" [size]="20"></lucide-icon>
                <input
                  matInput
                  [formControl]="getControl('current_job.company')"
                  placeholder="Nombre de la empresa"
                />
                @if (
                  form.get('current_job.company')?.hasError('required') &&
                  form.get('current_job.company')?.touched
                ) {
                  <mat-error>{{ 'rentalApp.companyRequired' | transloco }}</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="form-field">
              <mat-form-field appearance="outline" class="custom-field">
                <mat-label>{{ 'rentalApp.positionField' | transloco }}</mat-label>
                <lucide-icon matPrefix [img]="Briefcase" [size]="20"></lucide-icon>
                <input
                  matInput
                  [formControl]="getControl('current_job.position')"
                  placeholder="Gerente, Desarrollador, etc."
                />
                @if (
                  form.get('current_job.position')?.hasError('required') &&
                  form.get('current_job.position')?.touched
                ) {
                  <mat-error>{{ 'rentalApp.positionRequired' | transloco }}</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="form-field">
              <mat-form-field appearance="outline" class="custom-field">
                <mat-label>{{ 'rentalApp.employmentTypeLabel' | transloco }}</mat-label>
                <lucide-icon matPrefix [img]="Briefcase" [size]="20"></lucide-icon>
                <mat-select [formControl]="getControl('current_job.employment_type')">
                  <mat-option value="tiempo_completo">{{
                    'rentalApp.employmentTypes.tiempo_completo' | transloco
                  }}</mat-option>
                  <mat-option value="medio_tiempo">{{
                    'rentalApp.employmentTypes.medio_tiempo' | transloco
                  }}</mat-option>
                  <mat-option value="freelance">{{
                    'rentalApp.employmentTypes.freelance' | transloco
                  }}</mat-option>
                  <mat-option value="autonomo">{{
                    'rentalApp.employmentTypes.autonomo' | transloco
                  }}</mat-option>
                  <mat-option value="empresario">{{
                    'rentalApp.employmentTypes.empresario' | transloco
                  }}</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="form-field">
              <mat-form-field appearance="outline" class="custom-field">
                <mat-label>{{ 'rentalApp.salary' | transloco }}</mat-label>
                <lucide-icon matPrefix [img]="DollarSign" [size]="20"></lucide-icon>
                <input
                  matInput
                  type="number"
                  [formControl]="getControl('current_job.salary')"
                  placeholder="5000"
                />
                @if (
                  form.get('current_job.salary')?.hasError('required') &&
                  form.get('current_job.salary')?.touched
                ) {
                  <mat-error>{{ 'rentalApp.salaryRequired' | transloco }}</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="form-field">
              <mat-form-field appearance="outline" class="custom-field">
                <mat-label>{{ 'rentalApp.currency' | transloco }}</mat-label>
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
                <mat-label>{{ 'rentalApp.startDate' | transloco }}</mat-label>
                <lucide-icon matPrefix [img]="Calendar" [size]="20"></lucide-icon>
                <input
                  matInput
                  [matDatepicker]="startDatePicker"
                  [formControl]="getControl('current_job.start_date')"
                  [max]="today"
                  placeholder="DD/MM/YYYY"
                />
                <mat-datepicker-toggle matSuffix [for]="startDatePicker"></mat-datepicker-toggle>
                <mat-datepicker
                  #startDatePicker
                  startView="multi-year"
                  [startAt]="startAtDate"
                ></mat-datepicker>
                @if (
                  form.get('current_job.start_date')?.hasError('required') &&
                  form.get('current_job.start_date')?.touched
                ) {
                  <mat-error>{{ 'rentalApp.startDateRequired' | transloco }}</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="form-field full-width">
              <mat-form-field appearance="outline" class="custom-field">
                <mat-label>{{ 'rentalApp.supervisorName' | transloco }}</mat-label>
                <lucide-icon matPrefix [img]="User" [size]="20"></lucide-icon>
                <input
                  matInput
                  [formControl]="getControl('current_job.supervisor_name')"
                  placeholder="Nombre completo"
                />
                @if (
                  form.get('current_job.supervisor_name')?.hasError('required') &&
                  form.get('current_job.supervisor_name')?.touched
                ) {
                  <mat-error>{{ 'rentalApp.supervisorNameRequired' | transloco }}</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="form-field full-width">
              <mat-form-field appearance="outline" class="custom-field">
                <mat-label>{{ 'rentalApp.supervisorPhone' | transloco }}</mat-label>
                <lucide-icon matPrefix [img]="Phone" [size]="20"></lucide-icon>
                <input
                  matInput
                  type="tel"
                  [formControl]="getControl('current_job.supervisor_phone')"
                  placeholder="+1 234 567 8900"
                />
                @if (
                  form.get('current_job.supervisor_phone')?.hasError('required') &&
                  form.get('current_job.supervisor_phone')?.touched
                ) {
                  <mat-error>{{ 'rentalApp.supervisorPhoneRequired' | transloco }}</mat-error>
                }
              </mat-form-field>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Previous Job (Optional) -->
      <mat-card class="section-card">
        <mat-card-header>
          <mat-card-title>{{ 'rentalApp.previousJob' | transloco }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="form-grid">
            <div class="form-field">
              <mat-form-field appearance="outline" class="custom-field">
                <mat-label>{{ 'rentalApp.previousCompany' | transloco }}</mat-label>
                <lucide-icon matPrefix [img]="Building2" [size]="20"></lucide-icon>
                <input
                  matInput
                  [formControl]="getControl('previous_job.company')"
                  placeholder="Nombre de la empresa"
                />
              </mat-form-field>
            </div>

            <div class="form-field">
              <mat-form-field appearance="outline" class="custom-field">
                <mat-label>{{ 'rentalApp.previousPosition' | transloco }}</mat-label>
                <lucide-icon matPrefix [img]="Briefcase" [size]="20"></lucide-icon>
                <input
                  matInput
                  [formControl]="getControl('previous_job.position')"
                  placeholder="Puesto que ocupabas"
                />
              </mat-form-field>
            </div>

            <div class="form-field">
              <mat-form-field appearance="outline" class="custom-field">
                <mat-label>{{ 'rentalApp.previousSalary' | transloco }}</mat-label>
                <lucide-icon matPrefix [img]="DollarSign" [size]="20"></lucide-icon>
                <input
                  matInput
                  type="number"
                  [formControl]="getControl('previous_job.salary')"
                  placeholder="4000"
                />
              </mat-form-field>
            </div>

            <div class="form-field">
              <mat-form-field appearance="outline" class="custom-field">
                <mat-label>{{ 'rentalApp.previousEndDate' | transloco }}</mat-label>
                <lucide-icon matPrefix [img]="Calendar" [size]="20"></lucide-icon>
                <input
                  matInput
                  [matDatepicker]="endDatePicker"
                  [formControl]="getControl('previous_job.end_date')"
                  [max]="today"
                  placeholder="DD/MM/YYYY"
                />
                <mat-datepicker-toggle matSuffix [for]="endDatePicker"></mat-datepicker-toggle>
                <mat-datepicker
                  #endDatePicker
                  startView="multi-year"
                  [startAt]="startAtDate"
                ></mat-datepicker>
              </mat-form-field>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Rental History -->
      <mat-card class="section-card">
        <mat-card-header>
          <mat-card-title>{{ 'rentalApp.rentalHistory' | transloco }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="rental-history-list">
            @for (history of rentalHistoryArray.controls; track history; let i = $index) {
              <div class="history-item">
                <div class="history-header">
                  <h4>{{ 'rentalApp.rentalNumber' | transloco: { index: i + 1 } }}</h4>
                  @if (rentalHistoryArray.length > 1) {
                    <button mat-icon-button color="warn" (click)="removeRentalHistory(i)">
                      <lucide-icon [img]="Trash2" [size]="18"></lucide-icon>
                    </button>
                  }
                </div>
                <div class="form-grid">
                  <div class="form-field full-width">
                    <mat-form-field appearance="outline" class="custom-field">
                      <mat-label>{{ 'rentalApp.propertyAddress' | transloco }}</mat-label>
                      <lucide-icon matPrefix [img]="MapPin" [size]="20"></lucide-icon>
                      <input
                        matInput
                        [formControl]="getHistoryControl(history, 'property_address')"
                        placeholder="Calle, número, ciudad"
                      />
                      @if (
                        history.get('property_address')?.hasError('required') &&
                        history.get('property_address')?.touched
                      ) {
                        <mat-error>{{ 'rentalApp.propertyAddressRequired' | transloco }}</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <div class="form-field">
                    <mat-form-field appearance="outline" class="custom-field">
                      <mat-label>{{ 'rentalApp.landlordName' | transloco }}</mat-label>
                      <lucide-icon matPrefix [img]="User" [size]="20"></lucide-icon>
                      <input
                        matInput
                        [formControl]="getHistoryControl(history, 'landlord_name')"
                        placeholder="Nombre completo"
                      />
                      @if (
                        history.get('landlord_name')?.hasError('required') &&
                        history.get('landlord_name')?.touched
                      ) {
                        <mat-error>{{ 'rentalApp.landlordNameRequired' | transloco }}</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <div class="form-field">
                    <mat-form-field appearance="outline" class="custom-field">
                      <mat-label>{{ 'rentalApp.landlordPhone' | transloco }}</mat-label>
                      <lucide-icon matPrefix [img]="Phone" [size]="20"></lucide-icon>
                      <input
                        matInput
                        type="tel"
                        [formControl]="getHistoryControl(history, 'landlord_phone')"
                        placeholder="+1 234 567 8900"
                      />
                      @if (
                        history.get('landlord_phone')?.hasError('required') &&
                        history.get('landlord_phone')?.touched
                      ) {
                        <mat-error>{{ 'rentalApp.landlordPhoneRequired' | transloco }}</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <div class="form-field">
                    <mat-form-field appearance="outline" class="custom-field">
                      <mat-label>{{ 'rentalApp.monthlyRent' | transloco }}</mat-label>
                      <lucide-icon matPrefix [img]="DollarSign" [size]="20"></lucide-icon>
                      <input
                        matInput
                        type="number"
                        [formControl]="getHistoryControl(history, 'monthly_rent')"
                        placeholder="1500"
                      />
                      @if (
                        history.get('monthly_rent')?.hasError('required') &&
                        history.get('monthly_rent')?.touched
                      ) {
                        <mat-error>{{ 'rentalApp.monthlyRentRequired' | transloco }}</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <div class="form-field">
                    <mat-form-field appearance="outline" class="custom-field">
                      <mat-label>{{ 'rentalApp.rentalStartDate' | transloco }}</mat-label>
                      <lucide-icon matPrefix [img]="Calendar" [size]="20"></lucide-icon>
                      <input
                        matInput
                        [matDatepicker]="rentStartPicker"
                        [formControl]="getHistoryControl(history, 'start_date')"
                        [max]="today"
                        placeholder="DD/MM/YYYY"
                      />
                      <mat-datepicker-toggle
                        matSuffix
                        [for]="rentStartPicker"
                      ></mat-datepicker-toggle>
                      <mat-datepicker
                        #rentStartPicker
                        startView="multi-year"
                        [startAt]="startAtDate"
                      ></mat-datepicker>
                      @if (
                        history.get('start_date')?.hasError('required') &&
                        history.get('start_date')?.touched
                      ) {
                        <mat-error>{{ 'rentalApp.rentalStartDateRequired' | transloco }}</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <div class="form-field full-width">
                    <mat-form-field appearance="outline" class="custom-field">
                      <mat-label>{{ 'rentalApp.moveReason' | transloco }}</mat-label>
                      <input
                        matInput
                        [formControl]="getHistoryControl(history, 'reason_for_leaving')"
                        placeholder="Por qué te mudaste"
                      />
                    </mat-form-field>
                  </div>
                </div>
              </div>
            }
          </div>

          <button mat-stroked-button color="primary" class="add-btn" (click)="addRentalHistory()">
            <lucide-icon [img]="Plus" [size]="18"></lucide-icon>
            {{ 'rentalApp.addRental' | transloco }}
          </button>
        </mat-card-content>
      </mat-card>

      <!-- Navigation -->
      <div class="step-nav">
        <button mat-stroked-button matStepperPrevious class="nav-btn">
          <lucide-icon [img]="ArrowLeft" [size]="18"></lucide-icon>
          <span>{{ 'rentalApp.previous' | transloco }}</span>
        </button>
        <button
          mat-raised-button
          color="primary"
          matStepperNext
          class="nav-btn"
          [disabled]="form.invalid"
        >
          <span>{{ 'rentalApp.next' | transloco }}</span>
          <lucide-icon [img]="ArrowRight" [size]="18"></lucide-icon>
        </button>
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

      .step-nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 24px;
        padding-top: 16px;
        border-top: 1px solid var(--mat-sys-outline-variant);
      }

      .nav-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        height: 44px;
        padding: 0 24px;
        font-size: 1rem;
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
    `,
  ],
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
  readonly ArrowLeft = ArrowLeft;
  readonly ArrowRight = ArrowRight;
  readonly Calendar = Calendar;

  // Datepicker constraints
  today = new Date();
  startAtDate = new Date(2015, 0, 1);

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
      reason_for_leaving: [''],
    });

    this.rentalHistoryArray.push(historyForm);
  }

  removeRentalHistory(index: number): void {
    this.rentalHistoryArray.removeAt(index);
  }
}
