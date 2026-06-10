import { Component, input, output, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { provideTranslocoScope, TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { CreditCard, Heart, MapPin, User } from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';
import {
  AppDatePickerComponent,
  AppSelectComponent,
  AppSelectOption,
  AppTextFieldComponent,
} from '../../../../shared/ui';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-step-1-personal-info',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    TranslocoModule,
    AppDatePickerComponent,
    AppSelectComponent,
    AppTextFieldComponent,
  ],
  providers: [provideTranslocoScope('rentalApp')],
  template: `
    <section class="step-content">
      <header class="step-header">
        <h2>{{ 'rentalApp.step1Title' | transloco }}</h2>
        <p>{{ 'rentalApp.step1Subtitle' | transloco }}</p>
      </header>

      <div class="account-notice">
        <lucide-icon [img]="User" [size]="20"></lucide-icon>
        <p>{{ 'rentalApp.accountNotice' | transloco }}</p>
      </div>

      <div class="form-grid">
        <div class="field">
          <app-text-field
            [formControl]="getControl('full_name')"
            [label]="'rentalApp.fullName' | transloco"
            placeholder="Juan Perez Garcia"
            [readonly]="true"
          />
          <p class="field-meta field-hint">{{ 'rentalApp.accountHint' | transloco }}</p>
        </div>

        <div class="field">
          <app-text-field
            [formControl]="getControl('email')"
            type="email"
            [label]="'rentalApp.emailLabel' | transloco"
            placeholder="correo@ejemplo.com"
            [readonly]="true"
          />
          <p class="field-meta field-hint">{{ 'rentalApp.accountHint' | transloco }}</p>
        </div>

        <div class="field">
          <app-text-field
            [formControl]="getControl('phone')"
            type="tel"
            [label]="'rentalApp.phone' | transloco"
            placeholder="+591 70000000"
            [readonly]="true"
          />
          <p class="field-meta field-hint">{{ 'rentalApp.accountHint' | transloco }}</p>
        </div>

        <div class="field">
          <app-text-field
            [formControl]="getControl('national_id')"
            [label]="'rentalApp.nationalId' | transloco"
            placeholder="12345678"
          />
          <p class="field-meta">
            @if (hasError('national_id', 'required')) {
              <span class="field-error">{{ 'rentalApp.nationalIdRequired' | transloco }}</span>
            } @else if (hasError('national_id', 'minlength')) {
              <span class="field-error">{{ 'rentalApp.nationalIdMinLength' | transloco }}</span>
            }
          </p>
        </div>

        <div class="field">
          <app-text-field
            [formControl]="getControl('number_of_dependents')"
            type="number"
            inputMode="numeric"
            [label]="'rentalApp.dependents' | transloco"
            placeholder="0"
          />
          <p class="field-meta">
            @if (hasError('number_of_dependents', 'required')) {
              <span class="field-error">{{ 'rentalApp.dependentsRequired' | transloco }}</span>
            } @else if (hasError('number_of_dependents', 'min')) {
              <span class="field-error">{{ 'rentalApp.dependentsMin' | transloco }}</span>
            }
          </p>
        </div>

        <div class="field">
          <app-text-field
            [formControl]="getControl('current_address')"
            [label]="'rentalApp.address' | transloco"
            placeholder="Calle, numero, ciudad, pais"
          />
          <p class="field-meta field-hint">{{ 'rentalApp.addressHint' | transloco }}</p>
        </div>

        <div class="field">
          <app-date-picker
            [formControl]="getControl('birth_date')"
            [label]="'rentalApp.birthDate' | transloco"
            [max]="maxDate"
          />
          <p class="field-meta">
            @if (hasError('birth_date', 'required')) {
              <span class="field-error">{{ 'rentalApp.birthDateRequired' | transloco }}</span>
            }
          </p>
        </div>

        <div class="field">
          <app-select
            [formControl]="getControl('marital_status')"
            [label]="'rentalApp.maritalStatusLabel' | transloco"
            [options]="maritalStatusOptions()"
          />
          <p class="field-meta"></p>
        </div>
      </div>

      <div class="info-card">
        <lucide-icon [img]="CreditCard" [size]="18"></lucide-icon>
        <p>{{ 'rentalApp.tipText' | transloco }}</p>
      </div>
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
    .account-notice p,
    .info-card p {
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

    .account-notice,
    .info-card {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: var(--app-space-3);
      border-radius: var(--app-radius-md);
      padding: var(--app-space-3);
    }

    .account-notice {
      background: var(--tui-status-info-pale);
      color: var(--tui-status-info);
    }

    .info-card {
      background: var(--app-color-surface-muted);
      color: var(--app-color-text-muted);
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--app-space-3) var(--app-space-4);
    }

    .field {
      display: grid;
      gap: var(--app-space-1);
      align-content: start;
    }

    .field-meta {
      margin: 0;
      min-block-size: 1.05rem;
      font-size: 0.78rem;
      line-height: 1.3;
    }

    .field-error {
      color: var(--tui-status-negative);
      font-weight: 700;
    }

    .field-hint {
      color: var(--app-color-text-muted);
    }

    @media (max-width: 720px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class Step1PersonalInfoComponent implements OnInit {
  protected readonly User = User;
  protected readonly CreditCard = CreditCard;
  protected readonly Heart = Heart;
  protected readonly MapPin = MapPin;

  readonly formGroup = input.required<FormGroup>();
  readonly isValid = output<boolean>();

  protected readonly maxDate = this.toDateInput(this.adultMaxDate());

  constructor(private readonly translocoService: TranslocoService) {}

  get form(): FormGroup {
    return this.formGroup();
  }

  ngOnInit(): void {
    this.isValid.emit(this.form.valid);
    this.form.valueChanges.subscribe(() => this.isValid.emit(this.form.valid));
  }

  protected getControl(path: string): FormControl {
    return this.form.get(path) as FormControl;
  }

  protected hasError(path: string, error: string): boolean {
    const control = this.form.get(path);
    return Boolean(control?.hasError(error) && control.touched);
  }

  protected maritalStatusOptions(): readonly AppSelectOption<string>[] {
    return ['soltero', 'casado', 'divorciado', 'viudo', 'union_libre'].map((status) => ({
      value: status,
      label: this.translocoService.translate(`rentalApp.maritalStatus.${status}`),
    }));
  }

  private adultMaxDate(): Date {
    const today = new Date();
    return new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  }

  private toDateInput(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
