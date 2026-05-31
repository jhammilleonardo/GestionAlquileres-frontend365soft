import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Save, X, AlertCircle } from 'lucide-angular';
import { AdminContractService } from '../../../core/services/admin/admin-contract.service';
import { SlugService } from '../../../core/services/slug.service';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import {
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
import { ContractEditFormValue } from '../models/contract-form.model';
import {
  hasValidContractDateRange,
  toContractEditFormValue,
  toUpdateContractDto,
} from '../mappers/contract-form.mapper';

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
    this.contractForm.patchValue(toContractEditFormValue(contract));
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
    if (!hasValidContractDateRange(formData.start_date, formData.end_date)) {
      this.errorMessage.set(this.transloco.translate('contracts.create.dateRangeError'));
      return;
    }

    this.isSubmitting = true;
    this.errorMessage.set(null);

    const contractId = this.currentContract()!.id;
    const updateData = toUpdateContractDto(formData);

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

  private resolveErrorMessage(error: unknown): string {
    return getApiErrorMessage(error, this.transloco.translate('contracts.edit.updateError'));
  }
}
