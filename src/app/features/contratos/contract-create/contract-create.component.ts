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
import { getApiErrorMessage } from '../../../core/http/http-error.util';

/** Valor crudo del formulario de creación de contrato. */
interface ContractCreateFormValue {
  tenant_id: number | null;
  property_id: number | null;
  start_date: Date | string;
  end_date: Date | string;
  key_delivery_date: Date | string | null;
  monthly_rent: string;
  payment_day: string | null;
  payment_method: string | null;
  included_services: string[] | null;
  late_fee_percentage: string | null;
  grace_days: string | null;
}

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
      next: (result) => {
        this.availableProperties.set(result.items);
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

    const formData = this.contractForm.getRawValue() as ContractCreateFormValue;
    const { start_date: startDate, end_date: endDate } = formData;

    // Validar fechas
    if (endDate <= startDate) {
      this.errorMessage.set(this.transloco.translate('contracts.create.dateRangeError'));
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    // Convertir fechas a string YYYY-MM-DD
    const contractData: CreateContractDTO = {
      tenant_id: formData.tenant_id!,
      property_id: formData.property_id!,
      start_date: this.formatDate(startDate),
      end_date: this.formatDate(endDate),
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
        void this.router.navigateByUrl(contractUrl);
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(this.resolveErrorMessage(error));
      },
    });
  }

  goBack(): void {
    const contractsUrl = this.slugService.buildUrl('/contratos');
    void this.router.navigateByUrl(contractsUrl);
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
    return getApiErrorMessage(error, this.transloco.translate('contracts.create.submitError'));
  }
}
