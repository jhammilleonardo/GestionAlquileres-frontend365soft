import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Save, X, AlertCircle } from 'lucide-angular';
import { AdminContractService } from '../../../core/services/admin/admin-contract.service';
import { SlugService } from '../../../core/services/slug.service';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import {
  UpdateContractDTO,
  Contract,
  ContractStatus,
  SERVICE_OPTIONS,
  BANK_ACCOUNT_TYPES,
} from '../../../core/models/contract.model';
import { AppButtonComponent } from '../../../shared/ui/button/button.component';
import { AppDatePickerComponent } from '../../../shared/ui/date-picker/date-picker.component';
import { AppLoadingStateComponent } from '../../../shared/ui/loading-state/loading-state.component';
import { AppSelectComponent, AppSelectOption } from '../../../shared/ui/select/select.component';
import { AppTextareaComponent } from '../../../shared/ui/textarea/textarea.component';
import { AppTextFieldComponent } from '../../../shared/ui/text-field/text-field.component';
import { getApiErrorMessage } from '../../../core/http/http-error.util';

/** Valor crudo del formulario de edición de contrato (campos de texto/numéricos como string). */
interface ContractEditFormValue {
  start_date: Date | string | null;
  end_date: Date | string | null;
  key_delivery_date: Date | string | null;
  monthly_rent: string | null;
  payment_day: string | null;
  payment_method: string | null;
  late_fee_percentage: string | null;
  grace_days: string | null;
  included_services: string[] | null;
  tenant_responsibilities: string | null;
  owner_responsibilities: string | null;
  prohibitions: string | null;
  coexistence_rules: string | null;
  renewal_terms: string | null;
  termination_terms: string | null;
  auto_renew: boolean | null;
  renewal_notice_days: string | null;
  auto_increase_percentage: string | null;
  jurisdiction: string | null;
  bank_name: string | null;
  bank_account_type: string | null;
  bank_account_number: string | null;
  bank_account_holder: string | null;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-contract-edit',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    TranslocoModule,
    AppButtonComponent,
    AppDatePickerComponent,
    AppLoadingStateComponent,
    AppSelectComponent,
    AppTextareaComponent,
    AppTextFieldComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'contratos', alias: 'contracts' })],
  templateUrl: './contract-edit.component.html',
  styleUrl: './contract-edit.component.scss',
})
export class ContractEditComponent {
  readonly ArrowLeft = ArrowLeft;
  readonly Save = Save;
  readonly X = X;
  readonly AlertCircle = AlertCircle;
  readonly ContractStatus = ContractStatus;

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private contractService = inject(AdminContractService);
  private slugService = inject(SlugService);
  private transloco = inject(TranslocoService);

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
  readonly bankAccountOptions: readonly AppSelectOption<string>[] = BANK_ACCOUNT_TYPES;

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
    const contractId = this.route.snapshot.paramMap.get('id');
    if (contractId) {
      this.loadContract(parseInt(contractId));
    } else {
      this.errorMessage.set(this.transloco.translate('contracts.edit.noContractError'));
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
        this.errorMessage.set(this.transloco.translate('contracts.edit.loadError'));
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

  hasError(controlName: string): boolean {
    const control = this.contractForm.get(controlName);
    return Boolean(control?.invalid && control?.touched);
  }

  onSubmit(): void {
    if (this.contractForm.invalid) {
      this.contractForm.markAllAsTouched();
      return;
    }

    const formData = this.contractForm.getRawValue() as ContractEditFormValue;
    const { start_date: startDate, end_date: endDate } = formData;

    // Validar fechas
    if (endDate && startDate && endDate <= startDate) {
      this.errorMessage.set(this.transloco.translate('contracts.create.dateRangeError'));
      return;
    }

    this.isSubmitting = true;
    this.errorMessage.set(null);

    const contractId = this.currentContract()!.id;
    const selectedServices = formData.included_services ?? [];

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
      auto_renew: formData.auto_renew ?? undefined,
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
        void this.router.navigateByUrl(contractUrl);
      },
      error: (error: unknown) => {
        this.isSubmitting = false;
        this.errorMessage.set(this.resolveErrorMessage(error));
      },
    });
  }

  goBack(): void {
    const contractUrl = this.slugService.buildUrl(`/contratos/${this.currentContract()!.id}`);
    void this.router.navigateByUrl(contractUrl);
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
    return getApiErrorMessage(error, this.transloco.translate('contracts.edit.updateError'));
  }
}
