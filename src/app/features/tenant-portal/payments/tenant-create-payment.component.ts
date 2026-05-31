import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { LucideAngularModule, ArrowLeft, CreditCard, AlertCircle, FileText } from 'lucide-angular';
import { PaymentMethod, QrPaymentStatus } from '../../../core/models/payment.model';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { TenantCreatePaymentFacade } from './tenant-create-payment.facade';
import { TenantPaymentScheduleComponent } from './components/tenant-payment-schedule.component';
import { TenantPaymentReceiptUploadComponent } from './components/tenant-payment-receipt-upload.component';
import { TenantPaymentQrPanelComponent } from './components/tenant-payment-qr-panel.component';
import { TenantContractPaymentSummaryComponent } from './components/tenant-contract-payment-summary.component';
import { TenantPaymentSuccessStateComponent } from './components/tenant-payment-success-state.component';
import { TenantPaymentBasicFieldsComponent } from './components/tenant-payment-basic-fields.component';
import { TenantPaymentMethodDetailsComponent } from './components/tenant-payment-method-details.component';
import { AppButtonComponent } from '../../../shared/ui/button/button.component';
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
    TenantPaymentBasicFieldsComponent,
    TenantPaymentMethodDetailsComponent,
    AppButtonComponent,
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
            <app-tenant-payment-basic-fields
              [form]="paymentForm"
              [paymentTypes]="paymentTypes"
              [paymentMethods]="paymentMethods"
              [currencyOptions]="currencySelectOptions"
              [maxDate]="maxDateInput"
            />

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

            @if (!isQrMethod()) {
              <app-tenant-payment-method-details
                [form]="paymentForm"
                [method]="paymentForm.get('payment_method')?.value"
              />
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

  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);
  readonly facade = inject(TenantCreatePaymentFacade);
  readonly paymentService = this.facade.paymentService;
  readonly qrService = this.facade.qrService;
  readonly contractService = this.facade.contractService;
  private translocoService = inject(TranslocoService);

  readonly success = this.facade.success;
  readonly maxDateInput = this.facade.maxDateInput;
  readonly qrPolling = this.facade.qrPolling;
  readonly qrCancelling = this.facade.qrCancelling;
  readonly qrError = this.facade.qrError;
  selectedReceipt = signal<File | null>(null);
  receiptError = signal<string | null>(null);
  receiptPreviewKind = signal<'image' | 'pdf' | null>(null);
  isReceiptModalOpen = signal(false);
  receiptZoom = signal(1);
  readonly minReceiptZoom = 1;
  readonly maxReceiptZoom = 8;
  readonly uploadProgress = this.facade.uploadProgress;
  private receiptObjectUrl = signal<string | null>(null);

  readonly calendarExpanded = this.facade.calendarExpanded;
  readonly paymentSchedule = this.facade.paymentSchedule;
  readonly paidCount = this.facade.paidCount;
  readonly paymentForm = this.facade.paymentForm;

  readonly PaymentMethod = PaymentMethod;
  readonly QrStatus = QrPaymentStatus;

  isQrMethod(): boolean {
    return this.facade.isQrMethod();
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

  get paymentTypes() {
    return this.facade.paymentTypes;
  }

  get paymentMethods() {
    return this.facade.paymentMethods;
  }

  get currencySelectOptions() {
    return this.facade.currencySelectOptions;
  }

  constructor() {
    this.destroyRef.onDestroy(() => this.revokeReceiptObjectUrl());
  }

  currencySymbol(code: string): string {
    return this.facade.currencySymbol(code);
  }

  formatDate(iso: string): string {
    return this.facade.formatDate(iso);
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
    this.facade.onSubmit(this.selectedReceipt(), (message) => this.receiptError.set(message));
  }

  manualVerify(): void {
    this.facade.manualVerify();
  }

  downloadQr(): void {
    this.facade.downloadQr();
  }

  onCancelQr(): void {
    this.facade.onCancelQr();
  }

  resetQr(): void {
    this.facade.resetQr();
  }

  resetForm(): void {
    this.receiptError.set(null);
    this.facade.resetForm(() => this.removeReceipt());
  }

  goBack(): void {
    this.facade.goBack();
  }
}
