import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';

import { resolveQrImageSrc } from '../../../core/utils/safe-url.util';

import { getApiErrorMessage } from '../../../core/http/http-error.util';
import { Currency, PaymentType, QrPayment } from '../../../core/models/payment.model';
import { FileDownloadService } from '../../../core/services/file-download.service';
import { TenantQrPaymentService } from '../../../core/services/tenant/tenant-qr-payment.service';

export interface TenantPaymentQrPayload {
  amount: number;
  currency: Currency;
  paymentType: PaymentType;
  notes?: string;
  /** Liga el QR a una reserva de corto plazo (en vez de a un contrato). */
  reservationId?: number;
}

@Injectable()
export class TenantPaymentQrFlowFacade implements OnDestroy {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly fileDownload = inject(FileDownloadService);
  private readonly translocoService = inject(TranslocoService);
  readonly qrService = inject(TenantQrPaymentService);

  readonly polling = signal(false);
  readonly cancelling = signal(false);
  readonly error = signal<string | null>(null);
  readonly safeUrl = computed<SafeUrl | null>(() => {
    const src = resolveQrImageSrc(this.qrService.activeQr()?.qr_image);
    return src ? this.sanitizer.bypassSecurityTrustUrl(src) : null;
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
        reservation_id: payload.reservationId,
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

    const href = resolveQrImageSrc(qr.qr_image);
    if (!href) return;
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

  /**
   * El facade se provee a nivel de componente, así que Angular invoca este hook
   * al destruirlo. Detiene el polling para no seguir consultando `verificar` en
   * segundo plano si el usuario navega fuera con un QR aún pendiente.
   */
  ngOnDestroy(): void {
    this.stopPolling();
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
