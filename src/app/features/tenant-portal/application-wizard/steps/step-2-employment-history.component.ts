import { Component, inject, input, output, OnInit, ChangeDetectionStrategy } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { provideTranslocoScope, TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Briefcase, Building2, Plus, Trash2 } from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';
import {
  AppButtonComponent,
  AppDatePickerComponent,
  AppSelectComponent,
  AppSelectOption,
  AppTextFieldComponent,
} from '../../../../shared/ui';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-step-2-employment-history',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    TranslocoModule,
    AppButtonComponent,
    AppDatePickerComponent,
    AppSelectComponent,
    AppTextFieldComponent,
  ],
  providers: [provideTranslocoScope('rentalApp')],
  template: `
    <section class="step-content">
      <header class="step-header">
        <h2>{{ 'rentalApp.step2Title' | transloco }}</h2>
        <p>{{ 'rentalApp.step2Subtitle' | transloco }}</p>
      </header>

      <article class="section-card">
        <header>
          <lucide-icon [img]="Briefcase" [size]="20"></lucide-icon>
          <h3>{{ 'rentalApp.currentJob' | transloco }}</h3>
        </header>

        <div class="form-grid">
          <div class="full-width">
            <app-text-field
              [formControl]="getControl('current_job.company')"
              [label]="'rentalApp.company' | transloco"
              placeholder="Nombre de la empresa"
            />
            @if (hasError('current_job.company', 'required')) {
              <p class="field-error">{{ 'rentalApp.companyRequired' | transloco }}</p>
            }
          </div>

          <div>
            <app-text-field
              [formControl]="getControl('current_job.position')"
              [label]="'rentalApp.positionField' | transloco"
              placeholder="Gerente, desarrollador, etc."
            />
            @if (hasError('current_job.position', 'required')) {
              <p class="field-error">{{ 'rentalApp.positionRequired' | transloco }}</p>
            }
          </div>

          <app-select
            [formControl]="getControl('current_job.employment_type')"
            [label]="'rentalApp.employmentTypeLabel' | transloco"
            [options]="employmentTypeOptions()"
          />

          <div>
            <app-text-field
              [formControl]="getControl('current_job.salary')"
              type="number"
              inputMode="decimal"
              [label]="'rentalApp.salary' | transloco"
              placeholder="5000"
            />
            @if (hasError('current_job.salary', 'required')) {
              <p class="field-error">{{ 'rentalApp.salaryRequired' | transloco }}</p>
            }
          </div>

          <app-select
            [formControl]="getControl('current_job.currency')"
            [label]="'rentalApp.currency' | transloco"
            [options]="currencyOptions"
          />

          <div>
            <app-date-picker
              [formControl]="getControl('current_job.start_date')"
              [label]="'rentalApp.startDate' | transloco"
              [max]="today"
            />
            @if (hasError('current_job.start_date', 'required')) {
              <p class="field-error">{{ 'rentalApp.startDateRequired' | transloco }}</p>
            }
          </div>

          <div class="full-width">
            <app-text-field
              [formControl]="getControl('current_job.supervisor_name')"
              [label]="'rentalApp.supervisorName' | transloco"
              placeholder="Nombre completo"
            />
            @if (hasError('current_job.supervisor_name', 'required')) {
              <p class="field-error">{{ 'rentalApp.supervisorNameRequired' | transloco }}</p>
            }
          </div>

          <div class="full-width">
            <app-text-field
              [formControl]="getControl('current_job.supervisor_phone')"
              type="tel"
              [label]="'rentalApp.supervisorPhone' | transloco"
              placeholder="+591 70000000"
            />
            @if (hasError('current_job.supervisor_phone', 'required')) {
              <p class="field-error">{{ 'rentalApp.supervisorPhoneRequired' | transloco }}</p>
            }
          </div>
        </div>
      </article>

      <article class="section-card">
        <header>
          <lucide-icon [img]="Building2" [size]="20"></lucide-icon>
          <h3>{{ 'rentalApp.previousJob' | transloco }}</h3>
        </header>

        <div class="form-grid">
          <app-text-field
            [formControl]="getControl('previous_job.company')"
            [label]="'rentalApp.previousCompany' | transloco"
            placeholder="Nombre de la empresa"
          />
          <app-text-field
            [formControl]="getControl('previous_job.position')"
            [label]="'rentalApp.previousPosition' | transloco"
            placeholder="Puesto que ocupabas"
          />
          <app-text-field
            [formControl]="getControl('previous_job.salary')"
            type="number"
            inputMode="decimal"
            [label]="'rentalApp.previousSalary' | transloco"
            placeholder="4000"
          />
          <app-date-picker
            [formControl]="getControl('previous_job.end_date')"
            [label]="'rentalApp.previousEndDate' | transloco"
            [max]="today"
          />
        </div>
      </article>

      <article class="section-card">
        <header>
          <h3>{{ 'rentalApp.rentalHistory' | transloco }}</h3>
        </header>

        <div class="rental-history-list">
          @for (history of rentalHistoryArray.controls; track history; let i = $index) {
            <section class="history-item">
              <header>
                <h4>{{ 'rentalApp.rentalNumber' | transloco: { index: i + 1 } }}</h4>
                @if (rentalHistoryArray.length > 1) {
                  <button
                    class="icon-action"
                    type="button"
                    [attr.aria-label]="'rentalApp.removeRental' | transloco"
                    (click)="removeRentalHistory(i)"
                  >
                    <lucide-icon [img]="Trash2" [size]="18"></lucide-icon>
                  </button>
                }
              </header>

              <div class="form-grid">
                <div class="full-width">
                  <app-text-field
                    [formControl]="getHistoryControl(history, 'property_address')"
                    [label]="'rentalApp.propertyAddress' | transloco"
                    placeholder="Calle, numero, ciudad"
                  />
                  @if (hasHistoryError(history, 'property_address', 'required')) {
                    <p class="field-error">{{ 'rentalApp.propertyAddressRequired' | transloco }}</p>
                  }
                </div>

                <div>
                  <app-text-field
                    [formControl]="getHistoryControl(history, 'landlord_name')"
                    [label]="'rentalApp.landlordName' | transloco"
                    placeholder="Nombre completo"
                  />
                  @if (hasHistoryError(history, 'landlord_name', 'required')) {
                    <p class="field-error">{{ 'rentalApp.landlordNameRequired' | transloco }}</p>
                  }
                </div>

                <div>
                  <app-text-field
                    [formControl]="getHistoryControl(history, 'landlord_phone')"
                    type="tel"
                    [label]="'rentalApp.landlordPhone' | transloco"
                    placeholder="+591 70000000"
                  />
                  @if (hasHistoryError(history, 'landlord_phone', 'required')) {
                    <p class="field-error">{{ 'rentalApp.landlordPhoneRequired' | transloco }}</p>
                  }
                </div>

                <div>
                  <app-text-field
                    [formControl]="getHistoryControl(history, 'monthly_rent')"
                    type="number"
                    inputMode="decimal"
                    [label]="'rentalApp.monthlyRent' | transloco"
                    placeholder="1500"
                  />
                  @if (hasHistoryError(history, 'monthly_rent', 'required')) {
                    <p class="field-error">{{ 'rentalApp.monthlyRentRequired' | transloco }}</p>
                  }
                </div>

                <div>
                  <app-date-picker
                    [formControl]="getHistoryControl(history, 'start_date')"
                    [label]="'rentalApp.rentalStartDate' | transloco"
                    [max]="today"
                  />
                  @if (hasHistoryError(history, 'start_date', 'required')) {
                    <p class="field-error">{{ 'rentalApp.rentalStartDateRequired' | transloco }}</p>
                  }
                </div>

                <div class="full-width">
                  <app-text-field
                    [formControl]="getHistoryControl(history, 'reason_for_leaving')"
                    [label]="'rentalApp.moveReason' | transloco"
                    placeholder="Por que te mudaste"
                  />
                </div>
              </div>
            </section>
          }
        </div>

        <app-button appearance="outline" [fullWidth]="true" (clicked)="addRentalHistory()">
          <lucide-icon [img]="Plus" [size]="18"></lucide-icon>
          {{ 'rentalApp.addRental' | transloco }}
        </app-button>
      </article>
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
    .section-card h3,
    .history-item h4 {
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

    .section-card,
    .history-item {
      display: grid;
      gap: var(--app-space-4);
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-lg);
      background: var(--app-color-surface);
      padding: var(--app-space-4);
    }

    .section-card > header,
    .history-item > header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--app-space-3);
      color: var(--app-color-text);
    }

    .section-card h3 {
      font-size: 1rem;
      font-weight: 800;
    }

    .history-item {
      background: var(--app-color-surface-muted);
    }

    .history-item h4 {
      font-size: 0.95rem;
      font-weight: 800;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--app-space-4);
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .rental-history-list {
      display: grid;
      gap: var(--app-space-4);
    }

    .icon-action {
      display: inline-grid;
      place-items: center;
      inline-size: 2rem;
      block-size: 2rem;
      border: 0;
      border-radius: 999px;
      background: var(--tui-status-negative-pale);
      color: var(--tui-status-negative);
      cursor: pointer;
    }

    .field-error {
      margin: var(--app-space-1) 0 0;
      color: var(--tui-status-negative);
      font-size: 0.78rem;
      font-weight: 700;
    }

    @media (max-width: 720px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class Step2EmploymentHistoryComponent implements OnInit {
  protected readonly Building2 = Building2;
  protected readonly Briefcase = Briefcase;
  protected readonly Plus = Plus;
  protected readonly Trash2 = Trash2;

  readonly formGroup = input.required<FormGroup>();
  readonly isValid = output<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly translocoService = inject(TranslocoService);

  protected readonly today = new Date().toISOString().slice(0, 10);
  protected readonly currencyOptions: readonly AppSelectOption<string>[] = [
    { label: 'USD - Dolar', value: 'USD' },
    { label: 'BOB - Boliviano', value: 'BOB' },
    { label: 'EUR - Euro', value: 'EUR' },
    { label: 'MXN - Peso Mexicano', value: 'MXN' },
    { label: 'COP - Peso Colombiano', value: 'COP' },
    { label: 'ARS - Peso Argentino', value: 'ARS' },
  ];

  get form(): FormGroup {
    return this.formGroup();
  }

  get rentalHistoryArray(): FormArray {
    return this.form.get('rental_history') as FormArray;
  }

  ngOnInit(): void {
    if (this.rentalHistoryArray.length === 0) {
      this.addRentalHistory();
    }

    this.isValid.emit(this.form.valid);
    this.form.valueChanges.subscribe(() => this.isValid.emit(this.form.valid));
  }

  protected getControl(path: string): FormControl {
    return this.form.get(path) as FormControl;
  }

  protected getHistoryControl(history: AbstractControl, path: string): FormControl {
    return (history as FormGroup).get(path) as FormControl;
  }

  protected hasError(path: string, error: string): boolean {
    const control = this.form.get(path);
    return Boolean(control?.hasError(error) && control.touched);
  }

  protected hasHistoryError(history: AbstractControl, path: string, error: string): boolean {
    const control = (history as FormGroup).get(path);
    return Boolean(control?.hasError(error) && control.touched);
  }

  protected employmentTypeOptions(): readonly AppSelectOption<string>[] {
    return ['tiempo_completo', 'medio_tiempo', 'freelance', 'autonomo', 'empresario'].map(
      (type) => ({
        value: type,
        label: this.translocoService.translate(`rentalApp.employmentTypes.${type}`),
      }),
    );
  }

  protected addRentalHistory(): void {
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

  protected removeRentalHistory(index: number): void {
    this.rentalHistoryArray.removeAt(index);
  }
}
