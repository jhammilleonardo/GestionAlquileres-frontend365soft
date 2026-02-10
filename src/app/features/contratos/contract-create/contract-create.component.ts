import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { LucideAngularModule, ArrowLeft, Save, X } from 'lucide-angular';
import { AdminContractService } from '../../../core/services/admin-contract.service';
import { AdminUserService } from '../../../core/services/admin-user.service';
import { PropertyService } from '../../../core/services/property.service';
import { SlugService } from '../../../core/services/slug.service';
import { CreateContractDTO, SERVICE_OPTIONS } from '../../../core/models/contract.model';
import { Property } from '../../../core/models/property.model';

@Component({
    selector: 'app-contract-create',
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
        MatIconModule,
        MatCheckboxModule,
        LucideAngularModule
    ],
    template: `
        <div class="contract-create-container">
            <!-- Header -->
            <div class="page-header">
                <button mat-button class="back-button" (click)="goBack()">
                    <lucide-icon [img]="ArrowLeft" [size]="20"></lucide-icon>
                    Volver a Contratos
                </button>
                <h1>Crear Nuevo Contrato</h1>
            </div>

            <mat-card class="form-card">
                @if (isLoadingTenants() || isLoadingProperties()) {
                    <div class="loading-container">
                        <mat-spinner diameter="50"></mat-spinner>
                        <p>Cargando datos...</p>
                    </div>
                } @else {
                    <form [formGroup]="contractForm" (ngSubmit)="onSubmit()">
                        <!-- Información Básica -->
                        <div class="form-section">
                            <h2>Información Básica</h2>

                            <!-- Inquilino -->
                            <mat-form-field appearance="outline" class="full-width">
                                <mat-label>Inquilino *</mat-label>
                                <mat-select formControlName="tenant_id" required>
                                    <mat-option value="">Seleccionar inquilino...</mat-option>
                                    @for (tenant of tenants(); track tenant.id) {
                                        <mat-option [value]="tenant.id">
                                            {{ tenant.name }} - {{ tenant.email }}
                                        </mat-option>
                                    }
                                </mat-select>
                                <mat-error>Debes seleccionar un inquilino</mat-error>
                            </mat-form-field>

                            <!-- Propiedad -->
                            <mat-form-field appearance="outline" class="full-width">
                                <mat-label>Propiedad *</mat-label>
                                <mat-select formControlName="property_id" required>
                                    <mat-option value="">Seleccionar propiedad...</mat-option>
                                    @for (property of availableProperties(); track property.id) {
                                        <mat-option [value]="property.id">
                                            {{ property.title }}
                                            @if (property.addresses && property.addresses.length > 0) {
                                                <span class="property-subtitle">
                                                    - {{ property.addresses[0].city }}
                                                </span>
                                            }
                                        </mat-option>
                                    }
                                </mat-select>
                                <mat-error>Debes seleccionar una propiedad</mat-error>
                            </mat-form-field>

                            <!-- Fechas -->
                            <div class="form-row">
                                <mat-form-field appearance="outline">
                                    <mat-label>Fecha Inicio *</mat-label>
                                    <input matInput [matDatepicker]="startDatePicker" formControlName="start_date" required>
                                    <mat-datepicker-toggle matIconSuffix [for]="startDatePicker"></mat-datepicker-toggle>
                                    <mat-datepicker #startDatePicker></mat-datepicker>
                                    <mat-error>La fecha es requerida</mat-error>
                                </mat-form-field>

                                <mat-form-field appearance="outline">
                                    <mat-label>Fecha Fin *</mat-label>
                                    <input matInput [matDatepicker]="endDatePicker" formControlName="end_date" required>
                                    <mat-datepicker-toggle matIconSuffix [for]="endDatePicker"></mat-datepicker-toggle>
                                    <mat-datepicker #endDatePicker></mat-datepicker>
                                    <mat-error>La fecha es requerida</mat-error>
                                </mat-form-field>

                                <mat-form-field appearance="outline">
                                    <mat-label>Entrega Llaves</mat-label>
                                    <input matInput [matDatepicker]="keyDatePicker" formControlName="key_delivery_date">
                                    <mat-datepicker-toggle matIconSuffix [for]="keyDatePicker"></mat-datepicker-toggle>
                                    <mat-datepicker #keyDatePicker></mat-datepicker>
                                </mat-form-field>
                            </div>

                            <!-- Alquiler -->
                            <div class="form-row">
                                <mat-form-field appearance="outline">
                                    <mat-label>Alquiler Mensual (Bs) *</mat-label>
                                    <input matInput type="number" formControlName="monthly_rent" required placeholder="1200.00">
                                    <mat-error>El monto es requerido</mat-error>
                                </mat-form-field>

                                <mat-form-field appearance="outline">
                                    <mat-label>Día de Pago</mat-label>
                                    <input matInput type="number" min="1" max="31" formControlName="payment_day" placeholder="5">
                                </mat-form-field>
                            </div>

                            <!-- Método de pago -->
                            <mat-form-field appearance="outline" class="full-width">
                                <mat-label>Método de Pago</mat-label>
                                <input matInput formControlName="payment_method" placeholder="Ej: Transferencia bancaria">
                            </mat-form-field>
                        </div>

                        <!-- Servicios Incluidos -->
                        <div class="form-section">
                            <h2>Servicios Incluidos</h2>
                            <div class="services-grid">
                                @for (service of serviceOptions; track service) {
                                    <mat-checkbox [checked]="isServiceSelected(service)" (change)="toggleService(service, $event)">
                                        {{ service }}
                                    </mat-checkbox>
                                }
                            </div>
                        </div>

                        <!-- Condiciones Adicionales -->
                        <div class="form-section">
                            <h2>Condiciones de Pago</h2>

                            <div class="form-row">
                                <mat-form-field appearance="outline">
                                    <mat-label>% Recargo por Mora</mat-label>
                                    <input matInput type="number" formControlName="late_fee_percentage" placeholder="5">
                                </mat-form-field>

                                <mat-form-field appearance="outline">
                                    <mat-label>Días de Gracia</mat-label>
                                    <input matInput type="number" formControlName="grace_days" placeholder="3">
                                </mat-form-field>
                            </div>
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
                                [disabled]="contractForm.invalid || isSubmitting()">
                                @if (isSubmitting()) {
                                    <mat-spinner diameter="20" class="button-spinner"></mat-spinner>
                                    Creando...
                                } @else {
                                    <lucide-icon [img]="Save" [size]="18"></lucide-icon>
                                    Crear Contrato
                                }
                            </button>
                            <button
                                type="button"
                                mat-stroked-button
                                (click)="goBack()"
                                [disabled]="isSubmitting()">
                                <lucide-icon [img]="X" [size]="18"></lucide-icon>
                                Cancelar
                            </button>
                        </div>
                    </form>
                }
            </mat-card>
        </div>
    `,
    styles: [`
        .contract-create-container {
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

        .form-card {
            padding: 24px;
        }

        .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px;
            gap: 16px;
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

        .property-subtitle {
            color: var(--mat-sys-on-surface-variant);
            font-size: 0.9em;
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
            .contract-create-container {
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

            .form-actions {
                flex-direction: column;
            }

            .form-actions button {
                width: 100%;
            }
        }
    `]
})
export class ContractCreateComponent implements OnInit {
    readonly ArrowLeft = ArrowLeft;
    readonly Save = Save;
    readonly X = X;

    private fb = inject(FormBuilder);
    private router = inject(Router);
    private contractService = inject(AdminContractService);
    private userService = inject(AdminUserService);
    private propertyService = inject(PropertyService);
    private slugService = inject(SlugService);

    // Formulario reactivo
    contractForm: FormGroup;

    // Estado
    isSubmitting = signal(false);
    isLoadingProperties = signal(true);

    // Datos
    tenants = this.userService.tenants;
    isLoadingTenants = this.userService.isLoading;
    availableProperties = signal<Property[]>([]);

    // Signals para errores
    errorMessage = signal<string | null>(null);

    // Opciones
    serviceOptions = SERVICE_OPTIONS;

    constructor() {
        this.contractForm = this.fb.group({
            tenant_id: ['', Validators.required],
            property_id: ['', Validators.required],
            start_date: ['', Validators.required],
            end_date: ['', Validators.required],
            key_delivery_date: [''],
            monthly_rent: ['', [Validators.required, Validators.min(0.01)]],
            payment_day: ['5'],
            payment_method: [''],
            included_services: [[]],
            late_fee_percentage: [''],
            grace_days: ['']
        });
    }

    ngOnInit(): void {
        this.loadTenants();
        this.loadProperties();
    }

    private loadTenants(): void {
        this.userService.loadTenants();
    }

    isServiceSelected(service: string): boolean {
        const services = this.contractForm.get('included_services')?.value as string[] || [];
        return services.includes(service);
    }

    toggleService(service: string, event: any): void {
        const services = this.contractForm.get('included_services')?.value as string[] || [];
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

    private loadProperties(): void {
        this.isLoadingProperties.set(true);

        // Cargar propiedades disponibles
        this.propertyService.getFilteredProperties({ status: 'DISPONIBLE' })
            .subscribe({
                next: (properties) => {
                    this.availableProperties.set(properties);
                    this.isLoadingProperties.set(false);
                },
                error: (error) => {
                    console.error('Error loading properties:', error);
                    this.errorMessage.set('Error al cargar las propiedades');
                    this.isLoadingProperties.set(false);
                }
            });
    }

    onSubmit(): void {
        if (this.contractForm.invalid) {
            this.contractForm.markAllAsTouched();
            return;
        }

        // Validar fechas
        const startDate = this.contractForm.value.start_date;
        const endDate = this.contractForm.value.end_date;

        if (endDate <= startDate) {
            this.errorMessage.set('La fecha de fin debe ser posterior a la fecha de inicio');
            return;
        }

        this.isSubmitting.set(true);
        this.errorMessage.set(null);

        // Preparar datos
        const formData = this.contractForm.value;

        // Convertir fechas a string YYYY-MM-DD
        const contractData: CreateContractDTO = {
            tenant_id: formData.tenant_id,
            property_id: formData.property_id,
            start_date: this.formatDate(formData.start_date),
            end_date: this.formatDate(formData.end_date),
            key_delivery_date: formData.key_delivery_date ? this.formatDate(formData.key_delivery_date) : undefined,
            monthly_rent: parseFloat(formData.monthly_rent),
            payment_day: formData.payment_day ? parseInt(formData.payment_day) : 5,
            payment_method: formData.payment_method || undefined,
            included_services: formData.included_services || [],
            late_fee_percentage: formData.late_fee_percentage ? parseFloat(formData.late_fee_percentage) : undefined,
            grace_days: formData.grace_days ? parseInt(formData.grace_days) : undefined
        };

        this.contractService.createContract(contractData).subscribe({
            next: (contract) => {
                this.isSubmitting.set(false);
                // Navegar al detalle del contrato
                const contractUrl = this.slugService.buildUrl(`/contratos/${contract.id}`);
                this.router.navigateByUrl(contractUrl);
            },
            error: (error) => {
                this.isSubmitting.set(false);
                this.errorMessage.set(error.error?.message || 'Error al crear el contrato');
            }
        });
    }

    goBack(): void {
        const contractsUrl = this.slugService.buildUrl('/contratos');
        this.router.navigateByUrl(contractsUrl);
    }

    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
