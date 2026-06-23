import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { resolveQrImageSrc } from '../../../core/utils/safe-url.util';
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Clock,
  Download,
  Info,
  LucideAngularModule,
  QrCode,
  RefreshCw,
  XCircle,
} from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';

import { TenantQrPaymentService } from '../../../core/services/tenant/tenant-qr-payment.service';
import { SlugService } from '../../../core/services/slug.service';
import { FileDownloadService } from '../../../core/services/file-download.service';
import { TenantContractService } from '../../../core/services/tenant/tenant-contract.service';
import {
  Currency,
  CurrencyLabels,
  CurrencySymbols,
  PaymentType,
  PaymentTypeLabels,
  QrPayment,
  QrPaymentStatus,
} from '../../../core/models/payment.model';
import { TenantDatePipe } from '../../../shared/pipes/tenant-date.pipe';
import { AppButtonComponent } from '../../../shared/ui/button/button.component';
import { AppSelectComponent, AppSelectOption } from '../../../shared/ui/select/select.component';
import { AppTextFieldComponent } from '../../../shared/ui/text-field/text-field.component';

@Component({
  selector: 'app-tenant-qr-generate',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    LucideAngularModule,
    TranslocoModule,
    TenantDatePipe,
    AppButtonComponent,
    AppSelectComponent,
    AppTextFieldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tenant-qr-generate.component.html',
  styleUrl: './tenant-qr-generate.component.scss',
})
export class TenantQrGenerateComponent {
  readonly ArrowLeft = ArrowLeft;
  readonly QrCode = QrCode;
  readonly CheckCircle2 = CheckCircle2;
  readonly AlertCircle = AlertCircle;
  readonly RefreshCw = RefreshCw;
  readonly XCircle = XCircle;
  readonly Clock = Clock;
  readonly Banknote = Banknote;
  readonly Info = Info;
  readonly Download = Download;

  readonly qrService = inject(TenantQrPaymentService);
  private readonly fb = inject(FormBuilder);
  private readonly slugService = inject(SlugService);
  private readonly fileDownload = inject(FileDownloadService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);
  readonly contractService = inject(TenantContractService);

  readonly QrStatus = QrPaymentStatus;

  readonly polling = signal(false);
  readonly cancelling = signal(false);
  readonly pollIntervalSec = 5;
  private pollTimer?: ReturnType<typeof setInterval>;

  readonly currencyOptions: AppSelectOption[] = Object.keys(Currency).map((k) => {
    const val = Currency[k as keyof typeof Currency];
    return {
      value: val,
      label: `${CurrencySymbols[val]} — ${CurrencyLabels[val]}`,
    };
  });

  readonly paymentTypeOptions: AppSelectOption[] = Object.keys(PaymentType).map((k) => {
    const val = PaymentType[k as keyof typeof PaymentType];
    return { value: val, label: PaymentTypeLabels[val] };
  });

  readonly form = this.fb.group({
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    currency: [Currency.BOB, Validators.required],
    payment_type: [PaymentType.RENT, Validators.required],
    notes: [''],
  });

  readonly qrSafeUrl = computed<SafeUrl | null>(() => {
    const src = resolveQrImageSrc(this.qrService.activeQr()?.qr_image);
    return src ? this.sanitizer.bypassSecurityTrustUrl(src) : null;
  });

  constructor() {
    this.qrService.clearError();
    this.qrService.clearActiveQr();
    this.destroyRef.onDestroy(() => this.stopPolling());
    this.prefillFromContract();
  }

  private prefillFromContract(): void {
    if (!this.contractService.currentContract()) {
      this.contractService.loadCurrentContract();
    }
    const tryPrefill = (): void => {
      const c = this.contractService.currentContract();
      if (c) {
        const amount =
          typeof c.monthly_rent === 'number' ? c.monthly_rent : Number(c.monthly_rent) || null;
        const currency = this.normalizeCurrency(c.currency) ?? Currency.BOB;
        this.form.patchValue({ amount, currency });
      } else if (this.contractService.isLoading()) {
        setTimeout(tryPrefill, 300);
      }
    };
    setTimeout(tryPrefill, 150);
  }

  private normalizeCurrency(value?: string): Currency | null {
    if (!value) return null;
    const u = value.toUpperCase();
    return Object.values(Currency).includes(u as Currency) ? (u as Currency) : null;
  }

  currencySymbol(code: string): string {
    return CurrencySymbols[code as Currency] ?? code;
  }

  onGenerate(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const val = this.form.value;
    this.qrService
      .generateQr({
        amount: val.amount!,
        currency: val.currency ?? Currency.BOB,
        payment_type: val.payment_type ?? PaymentType.RENT,
        notes: val.notes || undefined,
      })
      .subscribe({ next: () => this.startPolling() });
  }

  manualVerify(qr: QrPayment): void {
    this.doVerify(qr);
  }

  onCancel(qr: QrPayment): void {
    this.cancelling.set(true);
    this.stopPolling();
    this.qrService.cancelQr(qr.id).subscribe({
      next: () => this.resetQr(),
      error: () => this.cancelling.set(false),
    });
  }

  downloadQr(qr: QrPayment): void {
    const raw = qr.qr_image;
    if (!raw) return;
    const href =
      raw.startsWith('http') || raw.startsWith('data:') ? raw : `data:image/png;base64,${raw}`;
    this.fileDownload.downloadUrl(href, `QR-pago-${qr.id}.png`);
  }

  resetQr(): void {
    this.stopPolling();
    this.qrService.clearActiveQr();
    this.qrService.clearError();
    this.form.reset({ currency: Currency.BOB, payment_type: PaymentType.RENT });
  }

  goBack(): void {
    this.slugService.navigateTo(['portal', 'pagos']);
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollTimer = setInterval(() => {
      const qr = this.qrService.activeQr();
      if (!qr || this.qrService.isTerminalStatus(qr.status)) {
        this.stopPolling();
        return;
      }
      this.doVerify(qr);
    }, this.pollIntervalSec * 1000);
  }

  private stopPolling(): void {
    if (this.pollTimer !== undefined) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }
    this.polling.set(false);
  }

  private doVerify(qr: QrPayment): void {
    this.polling.set(true);
    this.qrService.verifyQr({ qr_id: qr.id }).subscribe({
      next: (updated) => {
        this.polling.set(false);
        if (this.qrService.isTerminalStatus(updated.status)) this.stopPolling();
      },
      error: () => this.polling.set(false),
    });
  }
}
