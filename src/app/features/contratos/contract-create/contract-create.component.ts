import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LucideAngularModule, AlertCircle, ArrowLeft, Save, X } from 'lucide-angular';
import { AdminContractService } from '../../../core/services/admin/admin-contract.service';
import { AdminUserService } from '../../../core/services/admin/admin-user.service';
import { PropertyService } from '../../../core/services/admin/property.service';
import { SlugService } from '../../../core/services/slug.service';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { CreateContractDTO, SERVICE_OPTIONS } from '../../../core/models/contract.model';
import { Property } from '../../../core/models/property.model';
import { AppButtonComponent } from '../../../shared/ui/button/button.component';
import { AppDatePickerComponent } from '../../../shared/ui/date-picker/date-picker.component';
import { AppLoadingStateComponent } from '../../../shared/ui/loading-state/loading-state.component';
import { AppSelectComponent, AppSelectOption } from '../../../shared/ui/select/select.component';
import { AppTextFieldComponent } from '../../../shared/ui/text-field/text-field.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-contract-create',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    TranslocoModule,
    AppButtonComponent,
    AppDatePickerComponent,
    AppLoadingStateComponent,
    AppSelectComponent,
    AppTextFieldComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'contratos', alias: 'contracts' })],
  templateUrl: './contract-create.component.html',
  styleUrl: './contract-create.component.scss',
})
export class ContractCreateComponent {
  readonly ArrowLeft = ArrowLeft;
  readonly Save = Save;
  readonly X = X;
  readonly AlertCircle = AlertCircle;

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private contractService = inject(AdminContractService);
  private userService = inject(AdminUserService);
  private propertyService = inject(PropertyService);
  private slugService = inject(SlugService);
  private transloco = inject(TranslocoService);

  // Formulario reactivo
  contractForm: FormGroup;

  // Estado
  isSubmitting = signal(false);
  isLoadingProperties = signal(true);

  // Datos
  tenants = this.userService.tenants;
  isLoadingTenants = this.userService.isLoading;
  availableProperties = signal<Property[]>([]);
  readonly tenantOptions = computed<readonly AppSelectOption<number>[]>(() =>
    this.tenants().map((tenant) => ({
      value: tenant.id,
      label: `${tenant.name} - ${tenant.email}`,
    })),
  );
  readonly propertyOptions = computed<readonly AppSelectOption<number>[]>(() =>
    this.availableProperties().map((property) => ({
      value: property.id,
      label:
        property.addresses && property.addresses.length > 0
          ? `${property.title} - ${property.addresses[0].city}`
          : property.title,
    })),
  );

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
      grace_days: [''],
    });
    this.loadTenants();
    this.loadProperties();

    // Pre-fill from query params (coming from an approved application)
    const qp = this.route.snapshot.queryParamMap;
    const tenantId = qp.get('tenant_id');
    const propertyId = qp.get('property_id');
    if (tenantId || propertyId) {
      this.contractForm.patchValue({
        ...(tenantId ? { tenant_id: Number(tenantId) } : {}),
        ...(propertyId ? { property_id: Number(propertyId) } : {}),
      });
    }
  }

  private loadTenants(): void {
    this.userService.loadTenants();
  }

  isServiceSelected(service: string): boolean {
    const services = (this.contractForm.get('included_services')?.value as string[]) || [];
    return services.includes(service);
  }

  toggleService(service: string, event: Event): void {
    const services = (this.contractForm.get('included_services')?.value as string[]) || [];
    const index = services.indexOf(service);
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
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
    this.propertyService.getFilteredProperties({ status: 'DISPONIBLE' }).subscribe({
      next: (properties) => {
        this.availableProperties.set(properties);
        this.isLoadingProperties.set(false);
      },
      error: () => {
        this.errorMessage.set(this.transloco.translate('contracts.create.loadError'));
        this.isLoadingProperties.set(false);
      },
    });
  }

  hasError(controlName: string): boolean {
    const control = this.contractForm.get(controlName);
    return Boolean(control?.invalid && control?.touched);
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
      this.errorMessage.set(this.transloco.translate('contracts.create.dateRangeError'));
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    // Preparar datos
    const formData = this.contractForm.getRawValue();

    // Convertir fechas a string YYYY-MM-DD
    const contractData: CreateContractDTO = {
      tenant_id: formData.tenant_id,
      property_id: formData.property_id,
      start_date: this.formatDate(formData.start_date),
      end_date: this.formatDate(formData.end_date),
      key_delivery_date: formData.key_delivery_date
        ? this.formatDate(formData.key_delivery_date)
        : undefined,
      monthly_rent: parseFloat(formData.monthly_rent),
      payment_day: formData.payment_day ? parseInt(formData.payment_day) : 5,
      payment_method: formData.payment_method || undefined,
      included_services: formData.included_services || [],
      late_fee_percentage: formData.late_fee_percentage
        ? parseFloat(formData.late_fee_percentage)
        : undefined,
      grace_days: formData.grace_days ? parseInt(formData.grace_days) : undefined,
    };

    this.contractService.createContract(contractData).subscribe({
      next: (contract) => {
        this.isSubmitting.set(false);
        // El contrato queda en BORRADOR para que el inquilino lo revise y firme
        const contractUrl = this.slugService.buildUrl(`/contratos/${contract.id}`);
        this.router.navigateByUrl(contractUrl);
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(this.resolveErrorMessage(error));
      },
    });
  }

  goBack(): void {
    const contractsUrl = this.slugService.buildUrl('/contratos');
    this.router.navigateByUrl(contractsUrl);
  }

  private formatDate(date: Date | string): string {
    if (typeof date === 'string') {
      return date.slice(0, 10);
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private resolveErrorMessage(error: unknown): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'error' in error &&
      typeof (error as { error?: { message?: unknown } }).error?.message === 'string'
    ) {
      return (error as { error: { message: string } }).error.message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return this.transloco.translate('contracts.create.submitError');
  }
}
