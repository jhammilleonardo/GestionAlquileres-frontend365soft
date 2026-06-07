import { computed, inject, Injectable, signal } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';

import { getApiErrorMessage } from '../../../core/http/http-error.util';
import { Currency, PaymentType, QrPayment } from '../../../core/models/payment.model';
import { FileDownloadService } from '../../../core/services/file-download.service';
import { TenantQrPaymentService } from '../../../core/services/tenant/tenant-qr-payment.service';

export interface TenantPaymentQrPayload {
  amount: number;
  currency: Currency;
  paymentType: PaymentType;
  notes?: string;
}

@Injectable()
export class TenantPaymentQrFlowFacade {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly fileDownload = inject(FileDownloadService);
  private readonly translocoService = inject(TranslocoService);
  readonly qrService = inject(TenantQrPaymentService);

  readonly polling = signal(false);
  readonly cancelling = signal(false);
  readonly error = signal<string | null>(null);
  readonly safeUrl = computed<SafeUrl | null>(() => {
    const qr = this.qrService.activeQr();
    if (!qr?.qr_image) return null;
    if (qr.qr_image.startsWith('http')) return this.sanitizer.bypassSecurityTrustUrl(qr.qr_image);

    const src = qr.qr_image.startsWith('data:')
      ? qr.qr_image
      : `data:image/png;base64,${qr.qr_image}`;
    return this.sanitizer.bypassSecurityTrustUrl(src);
  });

  private pollTimer?: ReturnType<typeof setInterval>;

  clearActiveQr(): void {
    this.stopPolling();
    this.qrService.clearActiveQr();
    this.error.set(null);
  }

  generate(payload: TenantPaymentQrPayload): void {
    this.error.set(null);
    this.qrService
      .generateQr({
        amount: payload.amount,
        currency: payload.currency,
        payment_type: payload.paymentType,
        notes: payload.notes,
      })
      .subscribe({
        next: () => this.startPolling(),
        error: (error: unknown) =>
          this.error.set(
            getApiErrorMessage(error, this.translocoService.translate('common.errors.generateQr')),
          ),
      });
  }

  verifyActive(): void {
    const qr = this.qrService.activeQr();
    if (qr) this.verify(qr);
  }

  downloadActive(): void {
    const qr = this.qrService.activeQr();
    if (!qr?.qr_image) return;

    const raw = qr.qr_image;
    const href =
      raw.startsWith('http') || raw.startsWith('data:') ? raw : `data:image/png;base64,${raw}`;
    this.fileDownload.downloadUrl(href, `QR-pago-${qr.id}.png`);
  }

  cancelActive(): void {
    const qr = this.qrService.activeQr();
    if (!qr) return;

    this.cancelling.set(true);
    this.stopPolling();
    this.qrService.cancelQr(qr.id).subscribe({
      next: () => this.cancelling.set(false),
      error: () => this.cancelling.set(false),
    });
  }

  stopPolling(): void {
    if (this.pollTimer !== undefined) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }
    this.polling.set(false);
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollTimer = setInterval(() => {
      const qr = this.qrService.activeQr();
      if (!qr || this.qrService.isTerminalStatus(qr.status)) {
        this.stopPolling();
        return;
      }

      this.verify(qr);
    }, 5000);
  }

  private verify(qr: QrPayment): void {
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
