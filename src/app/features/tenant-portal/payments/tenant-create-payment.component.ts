import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, ArrowLeft, CreditCard, AlertCircle, FileText } from 'lucide-angular';
import { PaymentMethod, QrPaymentStatus } from '../../../core/models/payment.model';
import { TranslocoModule } from '@jsverse/transloco';
import { TenantCreatePaymentFacade } from './tenant-create-payment.facade';
import { TenantPaymentReceiptPreviewFacade } from './tenant-payment-receipt-preview.facade';
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
  providers: [TenantCreatePaymentFacade, TenantPaymentReceiptPreviewFacade],
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
  templateUrl: './tenant-create-payment.component.html',
  styleUrl: './tenant-create-payment.component.scss',
})
export class TenantCreatePaymentComponent {
  readonly ArrowLeft = ArrowLeft;
  readonly CreditCard = CreditCard;
  readonly AlertCircle = AlertCircle;
  readonly FileText = FileText;

  readonly facade = inject(TenantCreatePaymentFacade);
  readonly receiptPreview = inject(TenantPaymentReceiptPreviewFacade);
  readonly paymentService = this.facade.paymentService;
  readonly qrService = this.facade.qrService;
  readonly contractService = this.facade.contractService;

  readonly success = this.facade.success;
  readonly maxDateInput = this.facade.maxDateInput;
  readonly qrPolling = this.facade.qrPolling;
  readonly qrCancelling = this.facade.qrCancelling;
  readonly qrError = this.facade.qrError;
  readonly qrSafeUrl = this.facade.qrSafeUrl;
  readonly selectedReceipt = this.receiptPreview.selectedFile;
  readonly receiptError = this.receiptPreview.error;
  readonly receiptPreviewKind = this.receiptPreview.previewKind;
  readonly isReceiptModalOpen = this.receiptPreview.isModalOpen;
  readonly receiptZoom = this.receiptPreview.zoom;
  readonly receiptPreviewSafeUrl = this.receiptPreview.safeUrl;
  readonly minReceiptZoom = this.receiptPreview.minZoom;
  readonly maxReceiptZoom = this.receiptPreview.maxZoom;
  readonly uploadProgress = this.facade.uploadProgress;

  readonly calendarExpanded = this.facade.calendarExpanded;
  readonly paymentSchedule = this.facade.paymentSchedule;
  readonly paidCount = this.facade.paidCount;
  readonly paymentForm = this.facade.paymentForm;

  readonly PaymentMethod = PaymentMethod;
  readonly QrStatus = QrPaymentStatus;

  isQrMethod(): boolean {
    return this.facade.isQrMethod();
  }

  get paymentTypes() {
    return this.facade.paymentTypes;
  }

  get paymentMethods() {
    return this.facade.paymentMethods;
  }

  get currencySelectOptions() {
    return this.facade.currencySelectOptions;
  }

  currencySymbol(code: string): string {
    return this.facade.currencySymbol(code);
  }

  formatDate(iso: string): string {
    return this.facade.formatDate(iso);
  }

  onReceiptFileSelected(file: File | null): void {
    this.receiptPreview.selectFile(file);
  }

  removeReceipt(): void {
    this.receiptPreview.remove();
    this.uploadProgress.set(0);
  }

  openReceiptModal(): void {
    this.receiptPreview.openModal();
  }

  closeReceiptModal(): void {
    this.receiptPreview.closeModal();
  }

  zoomInReceipt(): void {
    this.receiptPreview.zoomIn();
  }

  zoomOutReceipt(): void {
    this.receiptPreview.zoomOut();
  }

  resetReceiptZoom(): void {
    this.receiptPreview.resetZoom();
  }

  onReceiptModalWheel(event: WheelEvent): void {
    this.receiptPreview.handleWheel(event);
  }

  onSubmit(): void {
    this.facade.onSubmit(this.selectedReceipt(), (message) =>
      this.receiptPreview.setError(message),
    );
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
    this.receiptPreview.clearError();
    this.facade.resetForm(() => this.removeReceipt());
  }

  goBack(): void {
    this.facade.goBack();
  }
}
