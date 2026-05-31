import {
  Component,
  DestroyRef,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import {
  LucideAngularModule,
  ArrowLeft,
  CreditCard,
  AlertCircle,
  FileText,
  Landmark,
} from 'lucide-angular';
import { TenantPaymentService } from '../../../core/services/tenant/tenant-payment.service';
import { TenantQrPaymentService } from '../../../core/services/tenant/tenant-qr-payment.service';
import { SlugService } from '../../../core/services/slug.service';
import { TenantContractService } from '../../../core/services/tenant/tenant-contract.service';
import {
  PaymentType,
  PaymentMethod,
  Currency,
  CurrencySymbols,
  QrPayment,
  QrPaymentStatus,
  PaymentStatus,
} from '../../../core/models/payment.model';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { FormatService } from '../../../core/services/format.service';
import {
  TenantCreatePaymentFacade,
  PaymentOption,
  CurrencyOption,
} from './tenant-create-payment.facade';
import { TenantPaymentScheduleComponent } from './components/tenant-payment-schedule.component';
import { TenantPaymentReceiptUploadComponent } from './components/tenant-payment-receipt-upload.component';
import { TenantPaymentQrPanelComponent } from './components/tenant-payment-qr-panel.component';
import { TenantContractPaymentSummaryComponent } from './components/tenant-contract-payment-summary.component';
import { TenantPaymentSuccessStateComponent } from './components/tenant-payment-success-state.component';
import { AppButtonComponent } from '../../../shared/ui/button/button.component';
import { AppDatePickerComponent } from '../../../shared/ui/date-picker/date-picker.component';
import { AppSelectComponent } from '../../../shared/ui/select/select.component';
import { AppTextFieldComponent } from '../../../shared/ui/text-field/text-field.component';
import { AppTextareaComponent } from '../../../shared/ui/textarea/textarea.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tenant-create-payment',
  standalone: true,
  providers: [TenantCreatePaymentFacade],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    TranslocoModule,
    TenantPaymentScheduleComponent,
    TenantPaymentReceiptUploadComponent,
    TenantPaymentQrPanelComponent,
    TenantContractPaymentSummaryComponent,
    TenantPaymentSuccessStateComponent,
    AppButtonComponent,
    AppDatePickerComponent,
    AppSelectComponent,
    AppTextFieldComponent,
    AppTextareaComponent,
  ],
  template: `
    <div class="create-payment-container">
      <div class="page-header">
        <button type="button" (click)="goBack()" class="back-btn">
          <lucide-icon [img]="ArrowLeft" [size]="24"></lucide-icon>
        </button>
        <div>
          <h1>{{ 'public.tenantCreatePayment.title' | transloco }}</h1>
          <p>{{ 'public.tenantCreatePayment.subtitle' | transloco }}</p>
        </div>
      </div>

      <app-tenant-contract-payment-summary
        [loading]="contractService.isLoading()"
        [contract]="contractService.currentContract()"
      />

      <app-tenant-payment-schedule
        [loading]="contractService.isLoading()"
        [schedule]="paymentSchedule()"
        [expanded]="calendarExpanded()"
        [paidCount]="paidCount()"
        (toggleExpanded)="calendarExpanded.set(!calendarExpanded())"
      />

      @if (paymentService.error()) {
        <div class="error-alert">
          <lucide-icon [img]="AlertCircle" [size]="20"></lucide-icon>
          <span>{{ paymentService.error() }}</span>
        </div>
      }
      @if (qrError()) {
        <div class="error-alert">
          <lucide-icon [img]="AlertCircle" [size]="20"></lucide-icon>
          <span>{{ qrError() }}</span>
        </div>
      }

      <!-- QR confirmado -->
      @if (qrService.activeQr()?.status === QrStatus.PAGADO) {
        <app-tenant-payment-success-state
          kind="qr"
          [amount]="qrService.activeQr()!.amount"
          [currencySymbol]="currencySymbol(qrService.activeQr()!.currency)"
          [transactionId]="qrService.activeQr()!.transaction_id ?? null"
          (back)="goBack()"
          (newPayment)="resetForm()"
        />
      } @else if (success()) {
        <app-tenant-payment-success-state
          kind="manual"
          (back)="goBack()"
          (newPayment)="resetForm()"
        />
      } @else {
        <section class="form-card">
          <!-- Header del formulario -->
          <div class="form-card-header">
            <span class="form-card-header-icon">
              <lucide-icon [img]="CreditCard" [size]="16"></lucide-icon>
            </span>
            <span>{{ 'public.tenantCreatePayment.registerPayment' | transloco }}</span>
          </div>

          <form [formGroup]="paymentForm" (ngSubmit)="onSubmit()" class="form-body">
            <!-- Sección 1: Información del Pago -->
            <div class="form-section">
              <div class="section-title">
                <span class="section-title-accent"></span>
                <lucide-icon [img]="CreditCard" [size]="15"></lucide-icon>
                {{ 'public.tenantCreatePayment.paymentInfo' | transloco }}
              </div>

              <div class="full-width">
                <app-select
                  formControlName="payment_type"
                  [label]="'public.tenantCreatePayment.paymentType' | transloco"
                  [options]="paymentTypes"
                  [required]="true"
                />
                @if (showFieldError('payment_type', 'required')) {
                  <p class="field-error">
                    {{ 'public.tenantCreatePayment.typeRequired' | transloco }}
                  </p>
                }
              </div>

              <div class="form-row">
                <div>
                  <app-text-field
                    formControlName="amount"
                    [label]="'public.tenantCreatePayment.amount' | transloco"
                    placeholder="0.00"
                    type="number"
                    inputMode="decimal"
                  />
                  @if (showFieldError('amount', 'required')) {
                    <p class="field-error">
                      {{ 'public.tenantCreatePayment.amountRequired' | transloco }}
                    </p>
                  }
                  @if (paymentForm.get('amount')?.hasError('min')) {
                    <p class="field-error">
                      {{ 'public.tenantCreatePayment.amountMin' | transloco }}
                    </p>
                  }
                </div>

                <div>
                  <app-select
                    formControlName="currency"
                    [label]="'public.tenantCreatePayment.currency' | transloco"
                    [options]="currencySelectOptions"
                    [required]="true"
                  />
                  @if (showFieldError('currency', 'required')) {
                    <p class="field-error">
                      {{ 'public.tenantCreatePayment.currencyRequired' | transloco }}
                    </p>
                  }
                </div>
              </div>

              <div class="form-row">
                <div>
                  <app-select
                    formControlName="payment_method"
                    [label]="'public.tenantCreatePayment.method' | transloco"
                    [options]="paymentMethods"
                    [required]="true"
                  />
                  @if (showFieldError('payment_method', 'required')) {
                    <p class="field-error">
                      {{ 'public.tenantCreatePayment.methodRequired' | transloco }}
                    </p>
                  }
                </div>

                @if (!isQrMethod()) {
                  <div>
                    <app-date-picker
                      formControlName="payment_date"
                      [label]="'public.tenantCreatePayment.paymentDate' | transloco"
                      [max]="maxDateInput"
                    />
                    @if (showFieldError('payment_date', 'required')) {
                      <p class="field-error">
                        {{ 'public.tenantCreatePayment.dateRequired' | transloco }}
                      </p>
                    }
                  </div>
                }
              </div>
            </div>

            <!-- ══ Sección QR ══ -->
            @if (isQrMethod()) {
              <app-tenant-payment-qr-panel
                [activeQr]="qrService.activeQr()"
                [safeUrl]="qrSafeUrl()"
                [currencySymbol]="currencySymbol(qrService.activeQr()?.currency || '')"
                [formattedExpiration]="
                  qrService.activeQr()?.expires_at
                    ? formatDate(qrService.activeQr()!.expires_at!)
                    : ''
                "
                [polling]="qrPolling()"
                [cancelling]="qrCancelling()"
                [loading]="qrService.isLoading()"
                [amountInvalid]="!!paymentForm.get('amount')?.invalid"
                (reset)="resetQr()"
                (verify)="manualVerify()"
                (download)="downloadQr()"
                (cancel)="onCancelQr()"
                (back)="goBack()"
              />
            }

            <!-- Sección 2: Datos del Método (solo métodos no-QR) -->
            @if (
              !isQrMethod() &&
              (paymentForm.get('payment_method')?.value === PaymentMethod.CREDIT_CARD ||
                paymentForm.get('payment_method')?.value === PaymentMethod.DEBIT_CARD ||
                paymentForm.get('payment_method')?.value === PaymentMethod.CHECK ||
                paymentForm.get('payment_method')?.value === PaymentMethod.TRANSFER ||
                paymentForm.get('payment_method')?.value === PaymentMethod.WIRE_TRANSFER ||
                paymentForm.get('payment_method')?.value === PaymentMethod.CASH)
            ) {
              <div class="form-section">
                <div class="section-title">
                  <span class="section-title-accent"></span>
                  <lucide-icon [img]="Landmark" [size]="15"></lucide-icon>
                  {{ 'public.tenantCreatePayment.methodData' | transloco }}
                </div>

                <!-- Tarjeta de Crédito/Débito -->
                @if (
                  paymentForm.get('payment_method')?.value === PaymentMethod.CREDIT_CARD ||
                  paymentForm.get('payment_method')?.value === PaymentMethod.DEBIT_CARD
                ) {
                  <div class="form-row">
                    <div>
                      <app-text-field
                        formControlName="card_last_4_digits"
                        [label]="'public.tenantCreatePayment.last4Digits' | transloco"
                        placeholder="1234"
                        inputMode="numeric"
                        [maxLength]="4"
                        pattern="[0-9]{4}"
                      />
                      <p class="field-hint">
                        {{ 'public.tenantCreatePayment.last4Hint' | transloco }}
                      </p>
                    </div>

                    <app-text-field
                      formControlName="card_holder_name"
                      [label]="'public.tenantCreatePayment.cardHolder' | transloco"
                      placeholder="Juan Pérez"
                    />
                  </div>

                  <div class="form-row">
                    <div>
                      <app-text-field
                        formControlName="card_expiry"
                        [label]="'public.tenantCreatePayment.expiryDate' | transloco"
                        placeholder="MM/YY"
                        [maxLength]="5"
                      />
                      <p class="field-hint">
                        {{ 'public.tenantCreatePayment.expiryHint' | transloco }}
                      </p>
                    </div>

                    <app-text-field
                      formControlName="reference_number"
                      [label]="'public.tenantCreatePayment.authCode' | transloco"
                      placeholder="Ej: AUTH-123456"
                    />
                  </div>
                }

                <!-- Cheque -->
                @if (paymentForm.get('payment_method')?.value === PaymentMethod.CHECK) {
                  <div class="form-row">
                    <app-text-field
                      formControlName="check_number"
                      [label]="'public.tenantCreatePayment.checkNumber' | transloco"
                      placeholder="Ej: CHK-001"
                    />

                    <app-text-field
                      formControlName="bank_name"
                      [label]="'public.tenantCreatePayment.bankName' | transloco"
                      placeholder="Banco Nacional"
                    />
                  </div>

                  <div class="full-width">
                    <app-text-field
                      formControlName="bank_account_last_4"
                      [label]="'public.tenantCreatePayment.accTitle' | transloco"
                      placeholder="5678"
                      inputMode="numeric"
                      [maxLength]="4"
                    />
                  </div>
                }

                <!-- Transferencia -->
                @if (
                  paymentForm.get('payment_method')?.value === PaymentMethod.TRANSFER ||
                  paymentForm.get('payment_method')?.value === PaymentMethod.WIRE_TRANSFER
                ) {
                  <div class="full-width">
                    <app-text-field
                      formControlName="reference_number"
                      [label]="'public.tenantCreatePayment.refNumber' | transloco"
                      placeholder="Ej: TRF-12345"
                    />
                    <p class="field-hint">{{ 'public.tenantCreatePayment.refHint' | transloco }}</p>
                  </div>

                  <div class="form-row">
                    <app-text-field
                      formControlName="bank_name"
                      [label]="'public.tenantCreatePayment.originBank' | transloco"
                      placeholder="Tu banco"
                    />

                    <app-text-field
                      formControlName="bank_account_last_4"
                      [label]="'public.tenantCreatePayment.accTitle' | transloco"
                      placeholder="9012"
                      inputMode="numeric"
                      [maxLength]="4"
                    />
                  </div>
                }

                <!-- Efectivo -->
                @if (paymentForm.get('payment_method')?.value === PaymentMethod.CASH) {
                  <div class="form-row">
                    <div>
                      <app-text-field
                        formControlName="received_by"
                        [label]="'public.tenantCreatePayment.receivedBy' | transloco"
                        placeholder="Nombre de quien recibió"
                      />
                      <p class="field-hint">
                        {{ 'public.tenantCreatePayment.receivedByHint' | transloco }}
                      </p>
                    </div>

                    <app-text-field
                      formControlName="reference_number"
                      [label]="'public.tenantCreatePayment.receiptNumber' | transloco"
                      placeholder="Ej: REC-001"
                    />
                  </div>
                }
              </div>
            }

            <!-- Sección 3: Comprobante y notas (solo métodos no-QR) -->
            @if (!isQrMethod()) {
              <div class="form-section last">
                <div class="section-title">
                  <span class="section-title-accent"></span>
                  <lucide-icon [img]="FileText" [size]="15"></lucide-icon>
                  {{ 'public.tenantCreatePayment.receiptSection' | transloco }}
                </div>

                <app-tenant-payment-receipt-upload
                  [file]="selectedReceipt()"
                  [error]="receiptError()"
                  [previewKind]="receiptPreviewKind()"
                  [previewUrl]="receiptPreviewSafeUrl()"
                  [modalOpen]="isReceiptModalOpen()"
                  [zoom]="receiptZoom()"
                  [minZoom]="minReceiptZoom"
                  [maxZoom]="maxReceiptZoom"
                  (fileSelected)="onReceiptFileSelected($event)"
                  (openPreview)="openReceiptModal()"
                  (remove)="removeReceipt()"
                  (closeModal)="closeReceiptModal()"
                  (zoomIn)="zoomInReceipt()"
                  (zoomOut)="zoomOutReceipt()"
                  (resetZoom)="resetReceiptZoom()"
                  (wheel)="onReceiptModalWheel($event)"
                />

                <app-textarea
                  formControlName="notes"
                  [label]="'public.tenantCreatePayment.notesLbl' | transloco"
                  [placeholder]="'public.tenantCreatePayment.notesPlaceholder' | transloco"
                  [minRows]="3"
                  [maxRows]="5"
                  [maxLength]="500"
                />
                <p class="field-hint align-end">
                  {{ paymentForm.get('notes')?.value?.length || 0 }} / 500
                </p>
              </div>

              <div class="form-actions">
                <app-button
                  type="submit"
                  [loading]="paymentService.isLoading()"
                  [disabled]="paymentForm.invalid || !selectedReceipt()"
                >
                  <lucide-icon [img]="CreditCard" [size]="20"></lucide-icon>
                  {{ 'public.tenantCreatePayment.registerPayment' | transloco }}
                </app-button>
                <app-button
                  type="button"
                  appearance="outline"
                  [disabled]="paymentService.isLoading()"
                  (clicked)="goBack()"
                >
                  {{ 'public.tenantCreatePayment.cancel' | transloco }}
                </app-button>
              </div>

              @if (paymentService.isLoading() && uploadProgress() > 0) {
                <div class="upload-progress">
                  <div class="upload-progress-track">
                    <span [style.width.%]="uploadProgress()"></span>
                  </div>
                  <span>{{ uploadProgress() }}%</span>
                </div>
              }
            }
          </form>
        </section>
      }
    </div>
  `,
  styles: [
    `
      .create-payment-container {
        max-width: 800px;
        margin: 0 auto;
      }

      /* ════════ Form Card ════════ */
      .form-card {
        padding: 0 !important;
        overflow: hidden;
        border: none !important;
        box-shadow:
          0 1px 3px rgba(0, 0, 0, 0.07),
          0 4px 16px rgba(37, 99, 235, 0.08) !important;
      }

      .form-card-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 24px;
        background: #2563eb;
        font-size: 0.975rem;
        font-weight: 600;
        color: #ffffff;
        letter-spacing: 0.01em;
      }

      .form-card-header-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.15);
        border-radius: 8px;
        padding: 6px;
        color: rgba(255, 255, 255, 0.9);
      }

      .form-body {
        padding: 24px;
      }

      /* Secciones */
      .form-section {
        margin-bottom: 24px;
        padding-bottom: 24px;
        border-bottom: 1px solid #f1f5f9;
      }

      .form-section.last {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0;
      }

      /* Section title con acento */
      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.875rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0 0 16px;
        letter-spacing: 0.01em;
      }

      .section-title-accent {
        display: block;
        width: 3px;
        height: 16px;
        background: #2563eb;
        border-radius: 99px;
        flex-shrink: 0;
      }

      .section-title lucide-icon {
        color: #2563eb;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 16px;
      }

      .full-width {
        width: 100%;
        display: block;
        margin-bottom: 16px;
      }

      .full-width:last-child {
        margin-bottom: 0;
      }

      .form-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        padding-top: 20px;
        border-top: 1px solid #f1f5f9;
        margin-top: 8px;
      }

      .form-actions button {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .field-error,
      .field-hint {
        margin: 6px 0 0;
        font-size: 0.78rem;
        line-height: 1.35;
      }

      .field-error {
        color: #dc2626;
        font-weight: 650;
      }

      .field-hint {
        color: #64748b;
      }

      .field-hint.align-end {
        text-align: right;
      }

      .upload-progress {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 12px;
        align-items: center;
        margin-top: 16px;
        color: #475569;
        font-size: 0.82rem;
        font-weight: 700;
      }

      .upload-progress-track {
        height: 8px;
        overflow: hidden;
        border-radius: 999px;
        background: #e2e8f0;
      }

      .upload-progress-track span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: #2563eb;
        transition: width 0.16s ease;
      }

      /* ─── Page Header ─── */
      .page-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
      }

      .back-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        background: #ffffff;
        color: #334155;
        cursor: pointer;
        margin-right: 8px;
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
        gap: 12px;
        padding: 16px;
        background: #fee2e2;
        color: #dc2626;
        border-radius: 8px;
        margin-bottom: 24px;
      }

      @media (max-width: 768px) {
        .form-row {
          grid-template-columns: 1fr;
        }
        .form-actions {
          flex-direction: column-reverse;
        }
        .form-actions button {
          width: 100%;
          justify-content: center;
        }
        .form-actions app-button {
          width: 100%;
        }
        .page-header h1 {
          font-size: 1.35rem;
        }
        .form-body {
          padding: 16px;
        }
      }

      @media (max-width: 480px) {
        .page-header {
          gap: 8px;
        }

        .page-header h1 {
          font-size: 1.25rem;
        }

        .back-btn {
          margin-right: 4px;
        }
      }

      @media (max-width: 360px) {
        .form-card {
          padding: 16px;
        }

        .form-section {
          margin-bottom: 20px;
          padding-bottom: 20px;
        }
      }
    `,
  ],
})
export class TenantCreatePaymentComponent {
  readonly ArrowLeft = ArrowLeft;
  readonly CreditCard = CreditCard;
  readonly AlertCircle = AlertCircle;
  readonly FileText = FileText;
  readonly Landmark = Landmark;

  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly slugService = inject(SlugService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);
  readonly facade = inject(TenantCreatePaymentFacade);
  paymentService = inject(TenantPaymentService);
  qrService = inject(TenantQrPaymentService);
  contractService = inject(TenantContractService);
  private translocoService = inject(TranslocoService);
  private formatService = inject(FormatService);

  success = signal(false);
  readonly maxDateInput = this.toDateInputValue(new Date());
  qrPolling = signal(false);
  qrCancelling = signal(false);
  qrError = signal<string | null>(null);
  selectedReceipt = signal<File | null>(null);
  receiptError = signal<string | null>(null);
  receiptPreviewKind = signal<'image' | 'pdf' | null>(null);
  isReceiptModalOpen = signal(false);
  receiptZoom = signal(1);
  readonly minReceiptZoom = 1;
  readonly maxReceiptZoom = 8;
  uploadProgress = signal(0);
  retryPaymentId = signal<number | null>(null);
  private qrPollTimer?: ReturnType<typeof setInterval>;
  private receiptObjectUrl = signal<string | null>(null);

  calendarExpanded = this.facade.calendarExpanded;
  paymentSchedule = this.facade.paymentSchedule;
  paidCount = this.facade.paidCount;

  PaymentMethod = PaymentMethod;
  QrStatus = QrPaymentStatus;

  isQrMethod(): boolean {
    return this.paymentForm.get('payment_method')?.value === PaymentMethod.QR_MC4;
  }

  qrSafeUrl = computed<SafeUrl | null>(() => {
    const qr = this.qrService.activeQr();
    if (!qr?.qr_image) return null;
    if (qr.qr_image.startsWith('http')) return this.sanitizer.bypassSecurityTrustUrl(qr.qr_image);
    const src = qr.qr_image.startsWith('data:')
      ? qr.qr_image
      : `data:image/png;base64,${qr.qr_image}`;
    return this.sanitizer.bypassSecurityTrustUrl(src);
  });

  receiptPreviewSafeUrl = computed<SafeUrl | null>(() => {
    const url = this.receiptObjectUrl();
    if (!url) return null;
    return this.sanitizer.bypassSecurityTrustUrl(url);
  });

  paymentTypes: PaymentOption<PaymentType>[] = this.facade.paymentTypes;
  paymentMethods: PaymentOption<PaymentMethod>[] = this.facade.defaultPaymentMethods;
  currencies: CurrencyOption[] = this.facade.currencies;
  currencySelectOptions: PaymentOption<Currency>[] = this.currencies.map((currency) => ({
    value: currency.value,
    label: `${currency.symbol} - ${currency.label}`,
  }));

  paymentForm = this.fb.group({
    payment_type: [PaymentType.RENT, Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    currency: [Currency.USD, Validators.required],
    payment_method: [PaymentMethod.TRANSFER, Validators.required],
    payment_date: [new Date(), Validators.required],
    reference_number: [''],
    check_number: [''],
    notes: ['', Validators.maxLength(500)],

    // Campos específicos por método de pago
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

    // Cuando el contrato está disponible, pre-rellenar monto, moneda y construir calendario
    const tryPrefill = () => {
      const contract = this.contractService.currentContract();
      if (contract) {
        this.paymentForm.patchValue(this.facade.getContractPaymentPatch(contract));
        setTimeout(
          () => this.facade.buildPaymentSchedule(contract, this.paymentService.payments()),
          200,
        );
      } else {
        // Reintentar al siguiente frame si aún está cargando
        setTimeout(tryPrefill, 300);
      }
    };
    setTimeout(tryPrefill, 100);
    this.destroyRef.onDestroy(() => {
      this.stopPolling();
      this.revokeReceiptObjectUrl();
    });
  }

  private loadAvailablePaymentMethods(): void {
    this.paymentService.getAvailablePaymentMethods().subscribe({
      next: (methods) => {
        const allowed = this.facade.normalizeAvailableMethods(methods);

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

  currencySymbol(code: string): string {
    return CurrencySymbols[code as Currency] ?? code;
  }

  formatDate(iso: string): string {
    return this.formatService.formatDateTime(iso);
  }

  showFieldError(controlName: string, error: string): boolean {
    const control = this.paymentForm.get(controlName);
    return !!control?.hasError(error) && (control.touched || control.dirty);
  }

  onReceiptFileSelected(file: File | null): void {
    this.receiptError.set(null);

    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      this.removeReceipt();
      this.receiptError.set(
        this.translocoService.translate('public.tenantCreatePayment.receiptTypeError'),
      );
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      this.removeReceipt();
      this.receiptError.set(
        this.translocoService.translate('public.tenantCreatePayment.receiptSizeError'),
      );
      return;
    }

    this.revokeReceiptObjectUrl();
    this.receiptObjectUrl.set(URL.createObjectURL(file));
    this.selectedReceipt.set(file);
    this.receiptPreviewKind.set(file.type === 'application/pdf' ? 'pdf' : 'image');
  }

  removeReceipt(): void {
    this.closeReceiptModal();
    this.revokeReceiptObjectUrl();
    this.selectedReceipt.set(null);
    this.receiptPreviewKind.set(null);
    this.uploadProgress.set(0);
  }

  openReceiptModal(): void {
    if (this.receiptPreviewKind() !== 'image' || !this.receiptPreviewSafeUrl()) return;
    this.receiptZoom.set(1);
    this.isReceiptModalOpen.set(true);
  }

  closeReceiptModal(): void {
    this.isReceiptModalOpen.set(false);
    this.receiptZoom.set(1);
  }

  zoomInReceipt(): void {
    this.receiptZoom.update((value) => Math.min(this.maxReceiptZoom, +(value + 0.5).toFixed(2)));
  }

  zoomOutReceipt(): void {
    this.receiptZoom.update((value) => Math.max(this.minReceiptZoom, +(value - 0.5).toFixed(2)));
  }

  resetReceiptZoom(): void {
    this.receiptZoom.set(1);
  }

  onReceiptModalWheel(event: WheelEvent): void {
    event.preventDefault();
    if (event.deltaY < 0) {
      this.zoomInReceipt();
      return;
    }
    this.zoomOutReceipt();
  }

  private revokeReceiptObjectUrl(): void {
    const currentUrl = this.receiptObjectUrl();
    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
      this.receiptObjectUrl.set(null);
    }
  }

  onSubmit(): void {
    if (this.isQrMethod()) {
      this.generateQr();
      return;
    }
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }
    if (!this.selectedReceipt()) {
      this.receiptError.set(
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
          // Campos específicos por método de pago
          card_last_4_digits: formValue.card_last_4_digits || undefined,
          card_holder_name: formValue.card_holder_name || undefined,
          card_expiry: formValue.card_expiry || undefined,
          bank_name: formValue.bank_name || undefined,
          bank_account_last_4: formValue.bank_account_last_4 || undefined,
          received_by: formValue.received_by || undefined,
          parent_payment_id: this.retryPaymentId() || undefined,
        },
        this.selectedReceipt()!,
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
        error: (err) => {
          this.receiptError.set(
            err?.error?.message ||
              err?.message ||
              this.translocoService.translate('common.errors.registerPayment'),
          );
        },
      });
  }

  private generateQr(): void {
    const v = this.paymentForm.value;
    const amount = Number(v.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      this.paymentForm.get('amount')?.markAsTouched();
      return;
    }
    this.qrError.set(null);
    this.qrService
      .generateQr({
        amount,
        currency: v.currency ?? Currency.USD,
        payment_type: v.payment_type ?? PaymentType.RENT,
        notes: v.notes || undefined,
      })
      .subscribe({
        next: () => this.startPolling(),
        error: (err) =>
          this.qrError.set(err?.error?.message || err?.message || 'Error al generar el QR.'),
      });
  }

  manualVerify(): void {
    const qr = this.qrService.activeQr();
    if (qr) this.doVerify(qr);
  }

  downloadQr(): void {
    const qr = this.qrService.activeQr();
    if (!qr?.qr_image) return;
    const raw = qr.qr_image;
    const href =
      raw.startsWith('http') || raw.startsWith('data:') ? raw : `data:image/png;base64,${raw}`;
    const a = document.createElement('a');
    a.href = href;
    a.download = `QR-pago-${qr.id}.png`;
    a.click();
  }

  onCancelQr(): void {
    const qr = this.qrService.activeQr();
    if (!qr) return;
    this.qrCancelling.set(true);
    this.stopPolling();
    this.qrService.cancelQr(qr.id).subscribe({
      next: () => this.qrCancelling.set(false),
      error: () => this.qrCancelling.set(false),
    });
  }

  resetQr(): void {
    this.stopPolling();
    this.qrService.clearActiveQr();
    this.qrError.set(null);
  }

  private startPolling(): void {
    this.stopPolling();
    this.qrPollTimer = setInterval(() => {
      const qr = this.qrService.activeQr();
      if (!qr || this.qrService.isTerminalStatus(qr.status)) {
        this.stopPolling();
        return;
      }
      this.doVerify(qr);
    }, 5000);
  }

  private stopPolling(): void {
    if (this.qrPollTimer !== undefined) {
      clearInterval(this.qrPollTimer);
      this.qrPollTimer = undefined;
    }
    this.qrPolling.set(false);
  }

  private doVerify(qr: QrPayment): void {
    this.qrPolling.set(true);
    this.qrService.verifyQr({ qr_id: qr.id }).subscribe({
      next: (updated) => {
        this.qrPolling.set(false);
        if (this.qrService.isTerminalStatus(updated.status)) this.stopPolling();
      },
      error: () => this.qrPolling.set(false),
    });
  }

  resetForm(): void {
    this.stopPolling();
    this.qrService.clearActiveQr();
    this.qrError.set(null);
    this.receiptError.set(null);
    this.removeReceipt();
    this.retryPaymentId.set(null);
    this.paymentForm.reset({
      payment_type: PaymentType.RENT,
      currency: Currency.USD,
      payment_method: PaymentMethod.TRANSFER,
      payment_date: new Date(),
    });
    this.success.set(false);
    this.paymentService.clearError();
  }

  goBack(): void {
    this.slugService.navigateTo(['portal', 'pagos']);
  }

  private toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
