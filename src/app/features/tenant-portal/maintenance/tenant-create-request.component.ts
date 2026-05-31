import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import {
  LucideAngularModule,
  type LucideIconData,
  Wrench,
  MessageSquare,
  ArrowLeft,
  ArrowRight,
  Check,
  AlertCircle,
  Home,
  Key,
  Lightbulb,
  Droplets,
  Wind,
  Hammer,
  Leaf,
} from 'lucide-angular';
import {
  TenantMaintenanceService,
  CreateTenantMaintenanceDto,
} from '../../../core/services/tenant/tenant-maintenance.service';
import { TenantAuthService } from '../../../core/services/tenant/tenant-auth.service';
import { SlugService } from '../../../core/services/slug.service';
import {
  MaintenanceCategory,
  MaintenanceRequestType,
  PermissionToEnter,
} from '../../../core/models/maintenance-request.model';
import { TranslocoModule } from '@jsverse/transloco';
import {
  AppButtonComponent,
  AppCheckboxComponent,
  AppTextFieldComponent,
  AppTextareaComponent,
} from '../../../shared/ui';

interface MaintenanceCategoryOption {
  value: MaintenanceCategory;
  label: string;
  icon: LucideIconData;
}

interface RequestTypeOption {
  value: MaintenanceRequestType;
  labelKey: string;
  descriptionKey: string;
  icon: LucideIconData;
}

interface PermissionOption {
  value: PermissionToEnter;
  labelKey: string;
  descriptionKey: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tenant-create-request',
  standalone: true,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    LucideAngularModule,
    TranslocoModule,
    AppButtonComponent,
    AppCheckboxComponent,
    AppTextFieldComponent,
    AppTextareaComponent,
  ],
  template: `
    <div class="create-request-container">
      <div class="page-header">
        <button type="button" [routerLink]="mantenimientoUrl()" class="back-btn">
          <lucide-icon [img]="ArrowLeft" [size]="24"></lucide-icon>
        </button>
        <div>
          <h1>{{ 'public.tenantMaintenance.newRequestTitle' | transloco }}</h1>
          <p>{{ 'public.tenantMaintenance.newRequestSubtitle' | transloco }}</p>
        </div>
      </div>

      @if (maintenanceService.error()) {
        <div class="error-alert">
          <lucide-icon [img]="AlertCircle" [size]="20"></lucide-icon>
          <span>{{ maintenanceService.error() }}</span>
        </div>
      }

      <section class="form-card">
        <form [formGroup]="requestForm" (ngSubmit)="onSubmit()">
          <div class="form-section">
            <h3>{{ 'public.tenantMaintenance.requestTypeQ' | transloco }}</h3>
            <div class="type-options">
              @for (option of requestTypeOptions; track option.value) {
                <label
                  class="type-option"
                  [class.selected]="requestForm.controls.request_type.value === option.value"
                >
                  <input type="radio" formControlName="request_type" [value]="option.value" />
                  <lucide-icon [img]="option.icon" [size]="32"></lucide-icon>
                  <span class="type-label">{{ option.labelKey | transloco }}</span>
                  <span class="type-desc">{{ option.descriptionKey | transloco }}</span>
                </label>
              }
            </div>
          </div>

          @if (isMaintenanceRequest()) {
            <div class="form-section">
              <h3>{{ 'public.tenantMaintenance.categoryQ' | transloco }}</h3>
              <div class="category-grid">
                @for (cat of categories; track cat.value) {
                  <label
                    class="category-option"
                    [class.selected]="requestForm.get('category')?.value === cat.value"
                  >
                    <input type="radio" formControlName="category" [value]="cat.value" />
                    <lucide-icon [img]="cat.icon" [size]="24"></lucide-icon>
                    <span>{{ cat.label }}</span>
                  </label>
                }
              </div>
            </div>
          }

          <div class="form-section">
            <h3>{{ 'public.tenantMaintenance.describeQ' | transloco }}</h3>

            <div class="field-stack">
              <app-text-field
                formControlName="title"
                [label]="'public.tenantMaintenance.titleLabel' | transloco"
                [placeholder]="'public.tenantMaintenance.titlePlaceholder' | transloco"
              />
              @if (
                requestForm.controls.title.hasError('required') &&
                requestForm.controls.title.touched
              ) {
                <p class="field-error">
                  {{ 'public.tenantMaintenance.titleRequired' | transloco }}
                </p>
              }
              @if (requestForm.controls.title.hasError('minlength')) {
                <p class="field-error">{{ 'public.tenantMaintenance.min5' | transloco }}</p>
              }
            </div>

            <div class="field-stack">
              <app-textarea
                formControlName="description"
                [label]="'public.tenantMaintenance.descLabel' | transloco"
                [placeholder]="'public.tenantMaintenance.descPlaceholder' | transloco"
                [minRows]="4"
                [maxRows]="7"
              />
              @if (
                requestForm.controls.description.hasError('required') &&
                requestForm.controls.description.touched
              ) {
                <p class="field-error">{{ 'public.tenantMaintenance.descRequired' | transloco }}</p>
              }
              @if (requestForm.controls.description.hasError('minlength')) {
                <p class="field-error">{{ 'public.tenantMaintenance.min10' | transloco }}</p>
              }
            </div>
          </div>

          @if (isMaintenanceRequest()) {
            <div class="form-section">
              <h3>{{ 'public.tenantMaintenance.entryPerm' | transloco }}</h3>
              <p class="section-desc">
                {{ 'public.tenantMaintenance.entryPermDesc' | transloco }}
              </p>

              <div class="permission-options">
                @for (option of permissionOptions; track option.value) {
                  <label
                    class="permission-option"
                    [class.permission-option--selected]="
                      requestForm.controls.permission_to_enter.value === option.value
                    "
                  >
                    <input
                      type="radio"
                      formControlName="permission_to_enter"
                      [value]="option.value"
                    />
                    <span>
                      <strong>{{ option.labelKey | transloco }}</strong>
                      <small>{{ option.descriptionKey | transloco }}</small>
                    </span>
                  </label>
                }
              </div>

              @if (requestForm.controls.permission_to_enter.value === 'YES') {
                <div class="entry-details">
                  <app-checkbox formControlName="has_pets">
                    {{ 'public.tenantMaintenance.hasPets' | transloco }}
                  </app-checkbox>

                  <app-textarea
                    formControlName="entry_notes"
                    [label]="'public.tenantMaintenance.entryNotes' | transloco"
                    [placeholder]="'public.tenantMaintenance.entryNotesPlaceholder' | transloco"
                    [minRows]="2"
                    [maxRows]="4"
                  />
                </div>
              }
            </div>
          }

          <div class="form-actions">
            <app-button appearance="flat" type="button" [routerLink]="mantenimientoUrl()">
              {{ 'public.tenantMaintenance.cancel' | transloco }}
            </app-button>
            <app-button
              type="submit"
              [disabled]="requestForm.invalid || maintenanceService.isLoading()"
              [loading]="maintenanceService.isLoading()"
            >
              <lucide-icon [img]="Check" [size]="20"></lucide-icon>
              {{
                maintenanceService.isLoading()
                  ? ('public.tenantMaintenance.sending' | transloco)
                  : ('public.tenantMaintenance.sendRequest' | transloco)
              }}
            </app-button>
          </div>
        </form>
      </section>
    </div>
  `,
  styles: [
    `
      .create-request-container {
        max-width: 800px;
        margin: 0 auto;
      }

      .page-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
      }

      .back-btn {
        display: inline-grid;
        place-items: center;
        width: 2.5rem;
        height: 2.5rem;
        border: 1px solid var(--app-color-border);
        border-radius: var(--app-radius-md);
        background: var(--app-color-surface);
        color: #64748b;
        cursor: pointer;
      }

      .page-header h1 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0 0 4px;
      }

      .page-header p {
        color: #64748b;
        margin: 0;
      }

      .error-alert {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 8px;
        color: #dc2626;
        margin-bottom: 24px;
      }

      .form-card {
        display: block;
        padding: 32px;
        border: 1px solid var(--app-color-border);
        border-radius: var(--app-radius-lg);
        background: var(--app-color-surface);
        box-shadow: var(--app-shadow-sm);
      }

      .form-section {
        margin-bottom: 32px;
      }

      .form-section h3 {
        font-size: 1.1rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 8px;
      }

      .section-desc {
        color: #64748b;
        margin: 0 0 16px;
      }

      .type-options {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
      }

      .type-option {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 24px;
        border: 2px solid var(--app-color-border);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
      }

      .type-option:hover {
        border-color: var(--app-color-primary);
      }

      .type-option.selected {
        border-color: var(--app-color-primary);
        background: color-mix(in srgb, var(--app-color-primary) 10%, transparent);
      }

      .type-option input {
        display: none;
      }

      .type-option lucide-icon {
        color: var(--app-color-primary);
        margin-bottom: 12px;
      }

      .type-label {
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 4px;
      }

      .type-desc {
        font-size: 13px;
        color: #64748b;
      }

      .category-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 12px;
      }

      .category-option {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 16px;
        border: 2px solid var(--app-color-border);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
      }

      .category-option:hover {
        border-color: var(--app-color-primary);
      }

      .category-option.selected {
        border-color: var(--app-color-primary);
        background: color-mix(in srgb, var(--app-color-primary) 10%, transparent);
      }

      .category-option input {
        display: none;
      }

      .category-option lucide-icon {
        color: var(--app-color-primary);
        margin-bottom: 8px;
      }

      .category-option span {
        font-size: 13px;
        font-weight: 500;
        color: var(--app-color-text);
      }

      .field-stack {
        margin-bottom: 16px;
      }

      .field-error {
        margin: var(--app-space-1) 0 0;
        color: var(--tui-status-negative);
        font-size: 0.8125rem;
        font-weight: 650;
      }

      .permission-options {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .permission-option {
        display: grid;
        grid-template-columns: 18px minmax(0, 1fr);
        gap: var(--app-space-3);
        padding: 16px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        cursor: pointer;
        transition:
          border-color 0.15s,
          background 0.15s;
      }

      .permission-option--selected {
        border-color: var(--app-color-primary);
        background: color-mix(in srgb, var(--app-color-primary) 8%, transparent);
      }

      .permission-option input {
        margin-top: 0.15rem;
      }

      .permission-option small {
        display: block;
        font-size: 13px;
        color: #64748b;
        font-weight: normal;
      }

      .entry-details {
        display: grid;
        gap: var(--app-space-4);
        margin-top: 16px;
        padding: 16px;
        background: #f8fafc;
        border-radius: 8px;
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding-top: 24px;
        border-top: 1px solid #e2e8f0;
      }
      @media (max-width: 768px) {
        .form-card {
          padding: 24px;
        }

        .page-header h1 {
          font-size: 1.35rem;
        }
      }

      @media (max-width: 600px) {
        .type-options {
          grid-template-columns: 1fr;
        }

        .category-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .form-card {
          padding: 20px;
        }

        .form-section h3 {
          font-size: 1rem;
        }

        .form-actions {
          flex-direction: column-reverse;
        }

        .form-actions button {
          width: 100%;
        }
      }

      @media (max-width: 420px) {
        .type-option {
          padding: 20px;
        }

        .category-grid {
          grid-template-columns: 1fr;
        }

        .category-option span {
          font-size: 12px;
        }

        .page-header {
          gap: 8px;
        }

        .back-btn {
          margin-right: 0;
        }
      }
    `,
  ],
})
export class TenantCreateRequestComponent {
  readonly Wrench = Wrench;
  readonly MessageSquare = MessageSquare;
  readonly ArrowLeft = ArrowLeft;
  readonly ArrowRight = ArrowRight;
  readonly Check = Check;
  readonly AlertCircle = AlertCircle;

  maintenanceService = inject(TenantMaintenanceService);
  authService = inject(TenantAuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private slugService = inject(SlugService);

  // URL para volver a la lista de mantenimiento
  mantenimientoUrl = computed(() => this.slugService.buildUrl('/portal/mantenimiento'));

  readonly requestTypeOptions: RequestTypeOption[] = [
    {
      value: MaintenanceRequestType.MAINTENANCE,
      labelKey: 'public.tenantMaintenance.maintenanceType',
      descriptionKey: 'public.tenantMaintenance.maintenanceDesc',
      icon: Wrench,
    },
    {
      value: MaintenanceRequestType.GENERAL,
      labelKey: 'public.tenantMaintenance.generalType',
      descriptionKey: 'public.tenantMaintenance.generalDesc',
      icon: MessageSquare,
    },
  ];

  readonly permissionOptions: PermissionOption[] = [
    {
      value: PermissionToEnter.YES,
      labelKey: 'public.tenantMaintenance.yesEnter',
      descriptionKey: 'public.tenantMaintenance.yesEnterDesc',
    },
    {
      value: PermissionToEnter.NO,
      labelKey: 'public.tenantMaintenance.noPresence',
      descriptionKey: 'public.tenantMaintenance.noPresenceDesc',
    },
    {
      value: PermissionToEnter.NOT_APPLICABLE,
      labelKey: 'public.tenantMaintenance.notApplicable',
      descriptionKey: 'public.tenantMaintenance.notApplicableDesc',
    },
  ];

  categories: MaintenanceCategoryOption[] = [
    { value: MaintenanceCategory.PLOMERIA, label: 'Plomeria', icon: Droplets },
    { value: MaintenanceCategory.ELECTRICO, label: 'Electrico', icon: Lightbulb },
    { value: MaintenanceCategory.CLIMATIZACION, label: 'Climatizacion', icon: Wind },
    { value: MaintenanceCategory.LLAVE_CERRADURA, label: 'Cerraduras', icon: Key },
    { value: MaintenanceCategory.ILUMINACION, label: 'Iluminacion', icon: Lightbulb },
    { value: MaintenanceCategory.ACCESORIOS, label: 'Accesorios', icon: Hammer },
    { value: MaintenanceCategory.AFUERA, label: 'Exterior', icon: Leaf },
    { value: MaintenanceCategory.GENERAL, label: 'General', icon: Home },
  ];

  requestForm = this.fb.group({
    request_type: [MaintenanceRequestType.MAINTENANCE as string, Validators.required],
    category: [null as MaintenanceCategory | null],
    title: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    permission_to_enter: [PermissionToEnter.NOT_APPLICABLE as string],
    has_pets: [false],
    entry_notes: [''],
  });

  constructor() {
    // Watch for request type changes
    this.requestForm.get('request_type')?.valueChanges.subscribe((type) => {
      const categoryControl = this.requestForm.get('category');
      const permissionControl = this.requestForm.get('permission_to_enter');

      if (type === 'MAINTENANCE') {
        categoryControl?.setValidators([Validators.required]);
        permissionControl?.setValue(PermissionToEnter.YES);
      } else {
        categoryControl?.clearValidators();
        categoryControl?.setValue(null);
        permissionControl?.setValue(PermissionToEnter.NOT_APPLICABLE);
      }
      categoryControl?.updateValueAndValidity();
    });
  }

  isMaintenanceRequest(): boolean {
    return this.requestForm.controls.request_type.value === MaintenanceRequestType.MAINTENANCE;
  }

  onSubmit(): void {
    if (this.requestForm.invalid) {
      Object.keys(this.requestForm.controls).forEach((key) => {
        this.requestForm.get(key)?.markAsTouched();
      });
      return;
    }

    const formValue = this.requestForm.value;

    const dto: CreateTenantMaintenanceDto = {
      request_type: formValue.request_type as MaintenanceRequestType,
      title: formValue.title!,
      description: formValue.description!,
    };

    if (formValue.request_type === 'MAINTENANCE') {
      dto.category = formValue.category as MaintenanceCategory;
      dto.permission_to_enter = formValue.permission_to_enter as PermissionToEnter;
      dto.has_pets = formValue.has_pets || false;
      if (formValue.entry_notes) {
        dto.entry_notes = formValue.entry_notes;
      }
    }

    this.maintenanceService.createRequest(dto).subscribe({
      next: (created) => {
        const url = this.slugService.buildUrl(`/portal/mantenimiento/${created.id}`);
        void this.router.navigateByUrl(url);
      },
      error: () => {
        // Error is handled by the service
      },
    });
  }
}
