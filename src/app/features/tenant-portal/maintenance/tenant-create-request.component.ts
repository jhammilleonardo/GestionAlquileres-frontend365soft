import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import {
  LucideAngularModule,
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

@Component({
  selector: 'app-tenant-create-request',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    LucideAngularModule,
  ],
  template: `
    <div class="create-request-container">
      <div class="page-header">
        <button mat-icon-button [routerLink]="mantenimientoUrl()" class="back-btn">
          <lucide-icon [img]="ArrowLeft" [size]="24"></lucide-icon>
        </button>
        <div>
          <h1>Nueva Solicitud</h1>
          <p>Reporta un problema o realiza una consulta</p>
        </div>
      </div>

      @if (maintenanceService.error()) {
        <div class="error-alert">
          <lucide-icon [img]="AlertCircle" [size]="20"></lucide-icon>
          <span>{{ maintenanceService.error() }}</span>
        </div>
      }

      <mat-card class="form-card">
        <form [formGroup]="requestForm" (ngSubmit)="onSubmit()">
          <!-- Step 1: Request Type -->
          <div class="form-section">
            <h3>¿Que tipo de solicitud es?</h3>
            <div class="type-options">
              <label
                class="type-option"
                [class.selected]="requestForm.get('request_type')?.value === 'MAINTENANCE'"
              >
                <input type="radio" formControlName="request_type" value="MAINTENANCE" />
                <lucide-icon [img]="Wrench" [size]="32"></lucide-icon>
                <span class="type-label">Mantenimiento</span>
                <span class="type-desc">Problema que requiere reparacion</span>
              </label>
              <label
                class="type-option"
                [class.selected]="requestForm.get('request_type')?.value === 'GENERAL'"
              >
                <input type="radio" formControlName="request_type" value="GENERAL" />
                <lucide-icon [img]="MessageSquare" [size]="32"></lucide-icon>
                <span class="type-label">Consulta General</span>
                <span class="type-desc">Pregunta o solicitud de informacion</span>
              </label>
            </div>
          </div>

          <!-- Step 2: Category (only for MAINTENANCE) -->
          @if (requestForm.get('request_type')?.value === 'MAINTENANCE') {
            <div class="form-section">
              <h3>¿Que categoria describe mejor el problema?</h3>
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

          <!-- Step 3: Details -->
          <div class="form-section">
            <h3>Describe tu solicitud</h3>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Titulo</mat-label>
              <input matInput formControlName="title" placeholder="Ej: Fuga en el bano principal" />
              @if (
                requestForm.get('title')?.hasError('required') && requestForm.get('title')?.touched
              ) {
                <mat-error>El titulo es requerido</mat-error>
              }
              @if (requestForm.get('title')?.hasError('minlength')) {
                <mat-error>Minimo 5 caracteres</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Descripcion detallada</mat-label>
              <textarea
                matInput
                formControlName="description"
                rows="4"
                placeholder="Describe el problema con el mayor detalle posible..."
              ></textarea>
              @if (
                requestForm.get('description')?.hasError('required') &&
                requestForm.get('description')?.touched
              ) {
                <mat-error>La descripcion es requerida</mat-error>
              }
              @if (requestForm.get('description')?.hasError('minlength')) {
                <mat-error>Minimo 10 caracteres</mat-error>
              }
            </mat-form-field>
          </div>

          <!-- Step 4: Entry Permission (only for MAINTENANCE) -->
          @if (requestForm.get('request_type')?.value === 'MAINTENANCE') {
            <div class="form-section">
              <h3>Permiso de Entrada</h3>
              <p class="section-desc">
                ¿Autorizas que el personal entre a la propiedad sin tu presencia?
              </p>

              <mat-radio-group formControlName="permission_to_enter" class="permission-options">
                <mat-radio-button value="YES">
                  <strong>Si, pueden entrar</strong>
                  <span class="radio-desc">Autorizo entrada sin mi presencia</span>
                </mat-radio-button>
                <mat-radio-button value="NO">
                  <strong>No, debo estar presente</strong>
                  <span class="radio-desc">Necesito estar presente durante la visita</span>
                </mat-radio-button>
                <mat-radio-button value="NOT_APPLICABLE">
                  <strong>No aplica</strong>
                  <span class="radio-desc">No es necesario entrar a la propiedad</span>
                </mat-radio-button>
              </mat-radio-group>

              @if (requestForm.get('permission_to_enter')?.value === 'YES') {
                <div class="entry-details">
                  <mat-checkbox formControlName="has_pets">
                    Tengo mascotas en la propiedad
                  </mat-checkbox>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Notas de acceso (opcional)</mat-label>
                    <textarea
                      matInput
                      formControlName="entry_notes"
                      rows="2"
                      placeholder="Ej: La llave esta debajo de la maceta..."
                    ></textarea>
                  </mat-form-field>
                </div>
              }
            </div>
          }

          <!-- Submit -->
          <div class="form-actions">
            <button mat-button type="button" [routerLink]="mantenimientoUrl()">Cancelar</button>
            <button
              mat-raised-button
              color="primary"
              type="submit"
              [disabled]="requestForm.invalid || maintenanceService.isLoading()"
            >
              @if (maintenanceService.isLoading()) {
                <mat-spinner diameter="20"></mat-spinner>
                Enviando...
              } @else {
                <lucide-icon [img]="Check" [size]="20"></lucide-icon>
                Enviar Solicitud
              }
            </button>
          </div>
        </form>
      </mat-card>
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
        color: #64748b;
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
        padding: 32px;
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
        border: 2px solid var(--mat-sys-outline-variant);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
      }

      .type-option:hover {
        border-color: var(--mat-sys-primary);
      }

      .type-option.selected {
        border-color: var(--mat-sys-primary);
        background: var(--mat-sys-primary-container);
      }

      .type-option input {
        display: none;
      }

      .type-option lucide-icon {
        color: var(--mat-sys-primary);
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
        border: 2px solid var(--mat-sys-outline-variant);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
      }

      .category-option:hover {
        border-color: var(--mat-sys-primary);
      }

      .category-option.selected {
        border-color: var(--mat-sys-primary);
        background: var(--mat-sys-primary-container);
      }

      .category-option input {
        display: none;
      }

      .category-option lucide-icon {
        color: var(--mat-sys-primary);
        margin-bottom: 8px;
      }

      .category-option span {
        font-size: 13px;
        font-weight: 500;
        color: var(--mat-sys-on-surface);
      }

      .full-width {
        width: 100%;
        margin-bottom: 16px;
      }

      .permission-options {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .permission-options mat-radio-button {
        padding: 16px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
      }

      .radio-desc {
        display: block;
        font-size: 13px;
        color: #64748b;
        font-weight: normal;
      }

      .entry-details {
        margin-top: 16px;
        padding: 16px;
        background: #f8fafc;
        border-radius: 8px;
      }

      .entry-details mat-checkbox {
        margin-bottom: 16px;
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding-top: 24px;
        border-top: 1px solid #e2e8f0;
      }

      .form-actions button {
        display: flex;
        align-items: center;
        gap: 8px;
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

  categories = [
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
        this.router.navigateByUrl(url);
      },
      error: () => {
        // Error is handled by the service
      },
    });
  }
}
