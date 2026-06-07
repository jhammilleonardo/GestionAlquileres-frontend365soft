import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';
import { Observable, of } from 'rxjs';
import { debounceTime, startWith, switchMap } from 'rxjs/operators';

import { getApiErrorMessage } from '../../core/http/http-error.util';
import {
  CreatePaymentAsAdminDto,
  Currency,
  PaymentMethod,
  PaymentProcessor,
  PaymentStatus,
  PaymentType,
} from '../../core/models/payment.model';
import { AdminTenantUser } from '../../core/models/tenant-user.model';
import { Contract, ContractService } from '../../core/services/admin/contract.service';
import { PaymentService } from '../../core/services/admin/payment.service';
import { TenantUserService } from '../../core/services/tenant/tenant-user.service';
import { ToastService } from '../../shared/ui/toast/toast.service';

@Injectable()
export class PaymentAdminCreateFacade {
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly paymentService = inject(PaymentService);
  private readonly tenantUserService = inject(TenantUserService);
  private readonly contractService = inject(ContractService);
  private readonly transloco = inject(TranslocoService);

  readonly showCreateForm = signal(false);
  readonly tenantSearchControl = new FormControl('');
  filteredTenants$: Observable<AdminTenantUser[]> = of([]);
  readonly selectedTenant = signal<AdminTenantUser | null>(null);
  readonly availableContracts = signal<Contract[]>([]);
  readonly selectedContract = signal<Contract | null>(null);
  readonly loadingContracts = signal(false);

  readonly createPaymentForm = this.fb.group({
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    currency: [Currency.BOB, Validators.required],
    payment_type: [PaymentType.RENT, Validators.required],
    payment_method: [PaymentMethod.TRANSFER, Validators.required],
    status: [PaymentStatus.APPROVED],
    payment_date: [new Date(), Validators.required],
    due_date: [null as Date | null],
    reference_number: [''],
    check_number: [''],
    notes: [''],
    admin_notes: [''],
    card_last_4_digits: [''],
    card_holder_name: [''],
    card_expiry: [''],
    bank_name: [''],
    bank_account_last_4: [''],
    received_by: [''],
  });

  readonly selectedPaymentMethod = computed(() => {
    return this.createPaymentForm.get('payment_method')?.value as PaymentMethod;
  });

  constructor() {
    this.setupTenantSearch();
  }

  loadTenants(): void {
    this.tenantUserService.loadAllUsers();
  }

  onTenantSelected(tenant: AdminTenantUser): void {
    this.selectedTenant.set(tenant);
    this.selectedContract.set(null);
    this.availableContracts.set([]);
    this.loadingContracts.set(true);
    this.contractService.getContractsByTenantId(tenant.id).subscribe({
      next: (contracts) => {
        this.availableContracts.set(contracts);
        this.loadingContracts.set(false);
      },
      error: () => {
        this.loadingContracts.set(false);
        this.toast.error(this.transloco.translate('pagos.actions.loadContractsError'));
      },
    });
  }

  onContractSelected(contract: Contract): void {
    this.selectedContract.set(contract);
  }

  displayTenantFn(tenant: AdminTenantUser | null): string {
    return tenant ? `${tenant.name} (${tenant.email})` : '';
  }

  displayContractFn(contract: Contract): string {
    return this.contractService.formatContractDisplay(contract);
  }

  openCreateForm(): void {
    this.showCreateForm.set(true);
    this.resetCreateState();
    this.createPaymentForm.reset({
      currency: Currency.BOB,
      payment_type: PaymentType.RENT,
      payment_method: PaymentMethod.TRANSFER,
      status: PaymentStatus.APPROVED,
      payment_date: new Date(),
    });
  }

  closeCreateForm(): void {
    this.showCreateForm.set(false);
    this.resetCreateState();
    this.createPaymentForm.reset();
  }

  submitCreatePayment(): void {
    const tenant = this.selectedTenant();
    const contract = this.selectedContract();

    if (!tenant || !contract) {
      this.toast.error(this.transloco.translate('pagos.actions.tenantContractRequired'));
      return;
    }

    if (this.createPaymentForm.invalid) {
      this.toast.error(this.transloco.translate('pagos.actions.requiredFields'));
      return;
    }

    const payload = this.buildCreatePayload(tenant, contract);

    this.paymentService.createPaymentAsAdmin(payload).subscribe({
      next: () => {
        this.closeCreateForm();
        this.toast.success(this.transloco.translate('pagos.actions.created'));
      },
      error: (error: unknown) => {
        this.toast.error(
          getApiErrorMessage(error, this.transloco.translate('pagos.actions.createError')),
        );
      },
    });
  }

  private setupTenantSearch(): void {
    this.filteredTenants$ = this.tenantSearchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap((value) => {
        if (typeof value !== 'string') {
          return of([]);
        }
        const searchTerm = value || '';
        const allTenants = this.tenantUserService.users();
        if (!searchTerm.trim()) {
          return of(allTenants.slice(0, 10));
        }
        const term = searchTerm.toLowerCase();
        const filtered = allTenants.filter((tenant) => {
          const name = tenant.name.toLowerCase();
          const email = tenant.email.toLowerCase();
          return name.includes(term) || email.includes(term);
        });
        return of(filtered.slice(0, 10));
      }),
    );
  }

  private resetCreateState(): void {
    this.tenantSearchControl.reset('');
    this.selectedTenant.set(null);
    this.selectedContract.set(null);
    this.availableContracts.set([]);
  }

  private buildCreatePayload(tenant: AdminTenantUser, contract: Contract): CreatePaymentAsAdminDto {
    const formValue = this.createPaymentForm.value;
    return {
      tenant_id: tenant.id,
      contract_id: contract.id,
      property_id: contract.property_id,
      amount: formValue.amount!,
      currency: formValue.currency as Currency,
      payment_type: formValue.payment_type as PaymentType,
      payment_method: formValue.payment_method as PaymentMethod,
      status: formValue.status as PaymentStatus,
      payment_date: formValue.payment_date!,
      due_date: formValue.due_date || undefined,
      reference_number: formValue.reference_number || undefined,
      check_number: formValue.check_number || undefined,
      notes: formValue.notes || undefined,
      admin_notes: formValue.admin_notes || undefined,
      payment_processor: PaymentProcessor.MANUAL,
      card_last_4_digits: formValue.card_last_4_digits || undefined,
      card_holder_name: formValue.card_holder_name || undefined,
      card_expiry: formValue.card_expiry || undefined,
      bank_name: formValue.bank_name || undefined,
      bank_account_last_4: formValue.bank_account_last_4 || undefined,
      received_by: formValue.received_by || undefined,
    };
  }
}
