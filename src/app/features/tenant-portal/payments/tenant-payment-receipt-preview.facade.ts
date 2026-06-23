import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';

import { isBlobUrl } from '../../../core/utils/safe-url.util';

@Injectable()
export class TenantPaymentReceiptPreviewFacade {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly translocoService = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly objectUrl = signal<string | null>(null);

  readonly selectedFile = signal<File | null>(null);
  readonly error = signal<string | null>(null);
  readonly previewKind = signal<'image' | 'pdf' | null>(null);
  readonly isModalOpen = signal(false);
  readonly zoom = signal(1);
  readonly minZoom = 1;
  readonly maxZoom = 8;

  readonly safeUrl = computed<SafeUrl | null>(() => {
    const url = this.objectUrl();
    // Solo se confía la object URL (`blob:`) creada por esta misma fachada.
    if (!isBlobUrl(url)) return null;
    return this.sanitizer.bypassSecurityTrustUrl(url);
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.revokeObjectUrl());
  }

  selectFile(file: File | null): void {
    this.error.set(null);

    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      this.remove();
      this.error.set(
        this.translocoService.translate('public.tenantCreatePayment.receiptTypeError'),
      );
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      this.remove();
      this.error.set(
        this.translocoService.translate('public.tenantCreatePayment.receiptSizeError'),
      );
      return;
    }

    this.revokeObjectUrl();
    this.objectUrl.set(URL.createObjectURL(file));
    this.selectedFile.set(file);
    this.previewKind.set(file.type === 'application/pdf' ? 'pdf' : 'image');
  }

  setError(message: string): void {
    this.error.set(message);
  }

  clearError(): void {
    this.error.set(null);
  }

  remove(): void {
    this.closeModal();
    this.revokeObjectUrl();
    this.selectedFile.set(null);
    this.previewKind.set(null);
  }

  openModal(): void {
    if (this.previewKind() !== 'image' || !this.safeUrl()) return;
    this.zoom.set(1);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.zoom.set(1);
  }

  zoomIn(): void {
    this.zoom.update((value) => Math.min(this.maxZoom, +(value + 0.5).toFixed(2)));
  }

  zoomOut(): void {
    this.zoom.update((value) => Math.max(this.minZoom, +(value - 0.5).toFixed(2)));
  }

  resetZoom(): void {
    this.zoom.set(1);
  }

  handleWheel(event: WheelEvent): void {
    event.preventDefault();
    if (event.deltaY < 0) {
      this.zoomIn();
      return;
    }
    this.zoomOut();
  }

  private revokeObjectUrl(): void {
    const currentUrl = this.objectUrl();
    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
      this.objectUrl.set(null);
    }
  }
}
