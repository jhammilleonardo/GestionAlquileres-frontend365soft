import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import { Payment } from '../../core/models/payment.model';
import { PaymentService } from '../../core/services/admin/payment.service';

@Injectable()
export class PaymentProofViewerFacade {
  private readonly paymentService = inject(PaymentService);
  private readonly transloco = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly selectedProofPayment = signal<Payment | null>(null);
  readonly proofObjectUrl = signal<string | null>(null);
  readonly proofMimeType = signal<string | null>(null);
  readonly proofLoadError = signal<string | null>(null);
  readonly proofLoading = signal(false);
  readonly proofZoom = signal(1);

  private readonly proofZoomStep = 0.2;
  private readonly proofZoomMin = 1;
  private readonly proofZoomMax = 2;

  constructor() {
    this.destroyRef.onDestroy(() => this.cleanupProofObjectUrl());
  }

  getProofUrl(payment: Payment): string | null {
    return this.paymentService.getProofUrl(payment);
  }

  openProof(payment: Payment): void {
    if (!this.getProofUrl(payment)) return;
    this.selectedProofPayment.set(payment);
    this.proofLoading.set(true);
    this.proofLoadError.set(null);
    this.proofZoom.set(1);
    this.cleanupProofObjectUrl();

    this.paymentService.downloadProof(payment).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        this.proofObjectUrl.set(objectUrl);
        this.proofMimeType.set(blob.type || null);
        this.proofLoading.set(false);
      },
      error: (error: { message?: string }) => {
        this.proofLoading.set(false);
        this.proofLoadError.set(
          error.message || this.transloco.translate('pagos.actions.proofLoadError'),
        );
      },
    });
  }

  closeProof(): void {
    this.selectedProofPayment.set(null);
    this.proofLoading.set(false);
    this.proofLoadError.set(null);
    this.proofZoom.set(1);
    this.cleanupProofObjectUrl();
  }

  isProofPdf(payment: Payment): boolean {
    const mimeType = this.proofMimeType()?.toLowerCase() ?? '';
    if (mimeType.includes('pdf')) return true;
    const proofFile = payment.proof_file?.toLowerCase() ?? '';
    return proofFile.endsWith('.pdf');
  }

  zoomInProof(): void {
    this.proofZoom.update((zoom) =>
      Math.min(Number((zoom + this.proofZoomStep).toFixed(2)), this.proofZoomMax),
    );
  }

  zoomOutProof(): void {
    this.proofZoom.update((zoom) =>
      Math.max(Number((zoom - this.proofZoomStep).toFixed(2)), this.proofZoomMin),
    );
  }

  resetProofZoom(): void {
    this.proofZoom.set(1);
  }

  canZoomInProof(): boolean {
    return this.proofZoom() < this.proofZoomMax;
  }

  canZoomOutProof(): boolean {
    return this.proofZoom() > this.proofZoomMin;
  }

  private cleanupProofObjectUrl(): void {
    const currentObjectUrl = this.proofObjectUrl();
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
    }
    this.proofObjectUrl.set(null);
    this.proofMimeType.set(null);
  }
}
