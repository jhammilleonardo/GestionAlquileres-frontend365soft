import { HttpEventType } from '@angular/common/http';
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { getApiErrorMessage } from '../../../core/http/http-error.util';
import {
  Currency,
  CurrencyLabels,
  CurrencySymbols,
  Payment,
  PaymentMethod,
  PaymentMethodLabels,
  PaymentStatus,
  PaymentType,
  PaymentTypeLabels,
} from '../../../core/models/payment.model';
import { SlugService } from '../../../core/services/slug.service';
import { FormatService } from '../../../core/services/format.service';
import {
  Contract,
  TenantContractService,
} from '../../../core/services/tenant/tenant-contract.service';
import { TenantPaymentService } from '../../../core/services/tenant/tenant-payment.service';
import { TenantQrPaymentService } from '../../../core/services/tenant/tenant-qr-payment.service';
import { TenantPaymentQrFlowFacade } from './tenant-payment-qr-flow.facade';
import { buildTenantPaymentSchedule, PaymentScheduleItem } from './tenant-payment-schedule.builder';

export type { PaymentScheduleItem } from './tenant-payment-schedule.builder';

export interface PaymentOption<TValue extends string = string> {
  value: TValue;
  label: string;
}

export interface CurrencyOption extends PaymentOption<Currency> {
  symbol: string;
}

@Injectable()
export class TenantCreatePaymentFacade {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly slugService = inject(SlugService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translocoService = inject(TranslocoService);
  private readonly formatService = inject(FormatService);
  private readonly qrFlow = inject(TenantPaymentQrFlowFacade);
  readonly paymentService = inject(TenantPaymentService);
  readonly qrService = inject(TenantQrPaymentService);
  readonly contractService = inject(TenantContractService);

  readonly calendarExpanded = signal(true);
  readonly success = signal(false);
  readonly qrPolling = this.qrFlow.polling;
  readonly qrCancelling = this.qrFlow.cancelling;
  readonly qrError = this.qrFlow.error;
  readonly uploadProgress = signal(0);
  readonly retryPaymentId = signal<number | null>(null);
  readonly qrSafeUrl = this.qrFlow.safeUrl;

  private readonly paymentScheduleSignal = signal<PaymentScheduleItem[]>([]);
  readonly paymentSchedule = this.paymentScheduleSignal.asReadonly();
  readonly paidCount = computed(
    () => this.paymentSchedule().filter((item) => item.status === 'paid').length,
  );

  readonly paymentTypes: PaymentOption<PaymentType>[] = Object.values(PaymentType).map((value) => ({
    value,
    label: PaymentTypeLabels[value],
  }));

  readonly defaultPaymentMethods: PaymentOption<PaymentMethod>[] = Object.values(PaymentMethod).map(
    (value) => ({
      value,
      label: PaymentMethodLabels[value],
    }),
  );

  readonly currencies: CurrencyOption[] = Object.values(Currency).map((value) => ({
    value,
    label: CurrencyLabels[value],
    symbol: CurrencySymbols[value],
  }));
  paymentMethods: PaymentOption<PaymentMethod>[] = this.defaultPaymentMethods;
  readonly currencySelectOptions: PaymentOption<Currency>[] = this.currencies.map((currency) => ({
    value: currency.value,
    label: `${currency.symbol} - ${currency.label}`,
  }));
  readonly maxDateInput = this.toDateInputValue(new Date());

  readonly paymentForm = this.fb.group({
    payment_type: [PaymentType.RENT, Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    currency: [Currency.USD, Validators.required],
    payment_method: [PaymentMethod.TRANSFER, Validators.required],
    payment_date: [new Date(), Validators.required],
    reference_number: [''],
    check_number: [''],
    notes: ['', Validators.maxLength(500)],
    card_last_4_digits: [''],
    card_holder_name: [''],
    card_expiry: [''],
    bank_name: [''],
    bank_account_last_4: [''],
    received_by: [''],
  });

  constructor() {
    this.qrService.clearActiveQr();
    this.loadAvailablePaymentMethods();
    if (!this.contractService.currentContract()) {
      this.contractService.loadCurrentContract();
    }
    this.paymentService.loadPayments();
    this.loadRetryPayment();
    this.prefillFromCurrentContract();
    this.destroyRef.onDestroy(() => this.qrFlow.stopPolling());
  }

  normalizeCurrency(value?: string): Currency | null {
    if (!value) return null;

    const upper = value.toUpperCase();
    return Object.values(Currency).includes(upper as Currency) ? (upper as Currency) : null;
  }

  normalizePaymentMethod(value?: string): PaymentMethod | null {
    if (!value) return null;

    const upper = value.trim().toUpperCase();
    const aliases: Record<string, PaymentMethod> = {
      TRANSFERENCIA: PaymentMethod.TRANSFER,
      TRANSFERENCIA_BANCARIA: PaymentMethod.TRANSFER,
      TRANSFER_BANK: PaymentMethod.TRANSFER,
      QR: PaymentMethod.QR_MC4,
      QR_ACCL: PaymentMethod.QR_MC4,
      QR_MC4: PaymentMethod.QR_MC4,
      EFECTIVO: PaymentMethod.CASH,
      TARJETA: PaymentMethod.CREDIT_CARD,
    };

    if (aliases[upper]) return aliases[upper];
    return Object.values(PaymentMethod).includes(upper as PaymentMethod)
      ? (upper as PaymentMethod)
      : null;
  }

  normalizeAvailableMethods(
    methods: Array<{ method: PaymentMethod | string; label: string }>,
  ): PaymentOption<PaymentMethod>[] {
    return methods
      .map((method) => ({
        value: this.normalizePaymentMethod(method.method),
        label: method.label,
      }))
      .filter((method): method is PaymentOption<PaymentMethod> => !!method.value);
  }

  isQrMethod(): boolean {
    return this.paymentForm.get('payment_method')?.value === PaymentMethod.QR_MC4;
  }

  currencySymbol(code: string): string {
    return CurrencySymbols[code as Currency] ?? code;
  }

  formatDate(iso: string): string {
    return this.formatService.formatDateTime(iso);
  }

  onSubmit(receipt: File | null, setReceiptError: (message: string) => void): void {
    if (this.isQrMethod()) {
      this.generateQr();
      return;
    }

    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    if (!receipt) {
      setReceiptError(
        this.translocoService.translate('public.tenantCreatePayment.receiptRequired'),
      );
      return;
    }

    const formValue = this.paymentForm.value;
    const amount = Number(formValue.amount);
    this.paymentService
      .createPaymentWithReceipt(
        {
          payment_type: formValue.payment_type!,
          amount,
          currency: formValue.currency ?? Currency.USD,
          payment_method: formValue.payment_method!,
          payment_date: formValue.payment_date!,
          reference_number: formValue.reference_number || undefined,
          check_number: formValue.check_number || undefined,
          notes: formValue.notes || undefined,
          card_last_4_digits: formValue.card_last_4_digits || undefined,
          card_holder_name: formValue.card_holder_name || undefined,
          card_expiry: formValue.card_expiry || undefined,
          bank_name: formValue.bank_name || undefined,
          bank_account_last_4: formValue.bank_account_last_4 || undefined,
          received_by: formValue.received_by || undefined,
          parent_payment_id: this.retryPaymentId() || undefined,
        },
        receipt,
      )
      .subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            this.uploadProgress.set(Math.round((100 * event.loaded) / event.total));
          }
          if (event.type === HttpEventType.Response) {
            this.uploadProgress.set(100);
            this.success.set(true);
          }
        },
        error: (error: unknown) => {
          setReceiptError(
            getApiErrorMessage(
              error,
              this.translocoService.translate('common.errors.registerPayment'),
            ),
          );
        },
      });
  }

  manualVerify(): void {
    this.qrFlow.verifyActive();
  }

  downloadQr(): void {
    this.qrFlow.downloadActive();
  }

  onCancelQr(): void {
    this.qrFlow.cancelActive();
  }

  resetQr(): void {
    this.qrFlow.clearActiveQr();
  }

  resetForm(removeReceipt: () => void): void {
    this.qrFlow.clearActiveQr();
    removeReceipt();
    this.retryPaymentId.set(null);
    this.paymentForm.reset({
      payment_type: PaymentType.RENT,
      currency: Currency.USD,
      payment_method: PaymentMethod.TRANSFER,
      payment_date: new Date(),
    });
    this.success.set(false);
    this.uploadProgress.set(0);
    this.paymentService.clearError();
  }

  goBack(): void {
    this.slugService.navigateTo(['portal', 'pagos']);
  }

  getContractPaymentPatch(contract: Contract): {
    amount: number | null;
    currency: Currency;
    payment_method: PaymentMethod;
  } {
    return {
      amount: this.toNumber(contract.monthly_rent),
      currency: this.normalizeCurrency(contract.currency) ?? Currency.USD,
      payment_method:
        this.normalizePaymentMethod(contract.payment_method) ?? PaymentMethod.TRANSFER,
    };
  }

  buildPaymentSchedule(contract: Contract, existingPayments: readonly Payment[]): void {
    const activeLang = this.translocoService.getActiveLang();
    const monthLocale = activeLang.startsWith('en') ? 'en-US' : 'es-BO';

    this.paymentScheduleSignal.set(
      buildTenantPaymentSchedule({
        contract,
        existingPayments,
        labels: this.getScheduleStatusLabels(),
        locale: monthLocale,
      }),
    );
  }

  private loadAvailablePaymentMethods(): void {
    this.paymentService.getAvailablePaymentMethods().subscribe({
      next: (methods) => {
        const allowed = this.normalizeAvailableMethods(methods);
        if (allowed.length === 0) return;

        this.paymentMethods = allowed;
        const current = this.paymentForm.get('payment_method')?.value;
        if (!current || !allowed.some((method) => method.value === current)) {
          this.paymentForm.patchValue({ payment_method: allowed[0].value });
        }
      },
      error: () => undefined,
    });
  }

  private loadRetryPayment(): void {
    const retryParam = this.route.snapshot.queryParamMap.get('retry');
    const retryId = retryParam ? Number(retryParam) : NaN;
    if (!Number.isFinite(retryId) || retryId <= 0) return;

    this.paymentService.getPayment(retryId).subscribe({
      next: (payment) => {
        if (payment.status !== PaymentStatus.REJECTED) return;
        this.retryPaymentId.set(payment.id);
        this.paymentForm.patchValue({
          payment_type: payment.payment_type,
          amount: payment.amount,
          currency: payment.currency,
          payment_method: payment.payment_method,
          payment_date: new Date(),
          reference_number: payment.reference_number || '',
          check_number: payment.check_number || '',
          notes: payment.notes || '',
        });
      },
      error: () => undefined,
    });
  }

  private prefillFromCurrentContract(): void {
    const tryPrefill = () => {
      const contract = this.contractService.currentContract();
      if (contract) {
        this.paymentForm.patchValue(this.getContractPaymentPatch(contract));
        setTimeout(() => this.buildPaymentSchedule(contract, this.paymentService.payments()), 200);
        return;
      }

      setTimeout(tryPrefill, 300);
    };

    setTimeout(tryPrefill, 100);
  }

  private generateQr(): void {
    const value = this.paymentForm.value;
    const amount = Number(value.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      this.paymentForm.get('amount')?.markAsTouched();
      return;
    }

    this.qrFlow.generate({
      amount,
      currency: value.currency ?? Currency.USD,
      paymentType: value.payment_type ?? PaymentType.RENT,
      notes: value.notes || undefined,
    });
  }

  private getScheduleStatusLabels(): Record<PaymentScheduleItem['status'], string> {
    return {
      paid: this.translocoService.translate('public.tenantPayments.calPaid'),
      current: this.translocoService.translate('public.tenantPayments.calCurrent'),
      overdue: this.translocoService.translate('public.tenantPayments.calOverdue'),
      upcoming: this.translocoService.translate('public.tenantPayments.calUpcoming'),
    };
  }

  private toNumber(value: number | string): number | null {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
