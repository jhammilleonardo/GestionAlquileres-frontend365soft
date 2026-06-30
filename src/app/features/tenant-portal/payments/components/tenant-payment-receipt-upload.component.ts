import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';
import {
  FileCheck2,
  LucideAngularModule,
  Trash2,
  Upload,
  XCircle,
  ZoomIn,
  ZoomOut,
} from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-tenant-payment-receipt-upload',
  standalone: true,
  imports: [LucideAngularModule, TranslocoModule],
  template: `
    <div class="receipt-upload-panel" [class.invalid]="error()">
      <input
        #receiptInput
        type="file"
        class="hidden-file-input"
        accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
        (change)="handleFileChange($event)"
      />

      @if (!file()) {
        <button type="button" class="receipt-upload-button" (click)="receiptInput.click()">
          <lucide-icon [img]="Upload" [size]="20"></lucide-icon>
          {{ 'public.tenantCreatePayment.uploadReceipt' | transloco }}
        </button>
        <p class="receipt-hint">
          {{ 'public.tenantCreatePayment.receiptHint' | transloco }}
        </p>
      } @else {
        <div class="receipt-preview">
          <div class="receipt-preview-media">
            @if (previewKind() === 'image' && previewUrl()) {
              <button
                type="button"
                class="receipt-preview-trigger"
                (click)="openPreview.emit()"
                [attr.aria-label]="'public.tenantCreatePayment.openReceiptModal' | transloco"
              >
                <img
                  [src]="previewUrl()!"
                  [attr.alt]="'public.tenantCreatePayment.receiptImageAlt' | transloco"
                  loading="lazy"
                />
              </button>
            } @else {
              <div class="pdf-preview">
                <lucide-icon [img]="FileCheck2" [size]="36"></lucide-icon>
                <span>PDF</span>
              </div>
            }
          </div>

          <div class="receipt-preview-info">
            <strong>{{ file()!.name }}</strong>
            <span>{{ formatFileSize(file()!.size) }}</span>
            <button type="button" class="link-button" (click)="receiptInput.click()">
              {{ 'public.tenantCreatePayment.changeReceipt' | transloco }}
            </button>
          </div>

          <button
            type="button"
            class="remove-receipt"
            (click)="remove.emit()"
            [attr.aria-label]="'public.tenantCreatePayment.removeReceipt' | transloco"
          >
            <lucide-icon [img]="Trash2" [size]="18"></lucide-icon>
          </button>
        </div>
      }

      @if (error()) {
        <p class="receipt-error">{{ error() }}</p>
      }
    </div>

    @if (modalOpen() && previewUrl()) {
      <!-- Backdrop: cerrar con clic es comodidad de mouse; el modal tiene su botón de cerrar. -->
      <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
      <div class="receipt-modal-backdrop" (click)="closeModal.emit()">
        <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events -->
        <div
          class="receipt-modal"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="'public.tenantCreatePayment.receiptModalTitle' | transloco"
          (click)="$event.stopPropagation()"
        >
          <div class="receipt-modal-header">
            <strong>{{ 'public.tenantCreatePayment.receiptModalTitle' | transloco }}</strong>
            <div class="receipt-modal-actions">
              <button
                type="button"
                class="icon-button"
                (click)="zoomOut.emit()"
                [disabled]="zoom() <= minZoom()"
                [attr.aria-label]="'public.tenantCreatePayment.zoomOut' | transloco"
              >
                <lucide-icon [img]="ZoomOut" [size]="18"></lucide-icon>
              </button>
              <span class="receipt-modal-zoom">{{ (zoom() * 100).toFixed(0) }}%</span>
              <button
                type="button"
                class="icon-button"
                (click)="zoomIn.emit()"
                [disabled]="zoom() >= maxZoom()"
                [attr.aria-label]="'public.tenantCreatePayment.zoomIn' | transloco"
              >
                <lucide-icon [img]="ZoomIn" [size]="18"></lucide-icon>
              </button>
              <button type="button" class="receipt-modal-reset" (click)="resetZoom.emit()">
                {{ 'public.tenantCreatePayment.zoomReset' | transloco }}
              </button>
              <button
                type="button"
                class="icon-button"
                (click)="closeModal.emit()"
                [attr.aria-label]="'public.tenantCreatePayment.closeReceiptModal' | transloco"
              >
                <lucide-icon [img]="XCircle" [size]="18"></lucide-icon>
              </button>
            </div>
          </div>

          <div class="receipt-modal-body" (wheel)="wheel.emit($event)">
            <img
              class="receipt-modal-image"
              [src]="previewUrl()!"
              [style.transform]="'scale(' + zoom() + ')'"
              [attr.alt]="'public.tenantCreatePayment.receiptImageAlt' | transloco"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .hidden-file-input {
      display: none;
    }

    .receipt-upload-panel {
      border: 1.5px dashed var(--app-color-border-strong);
      border-radius: 12px;
      padding: 18px;
      background: var(--app-color-surface-muted);
      margin-bottom: 16px;
    }

    .receipt-upload-panel.invalid {
      border-color: var(--app-color-danger);
      background: #fef2f2;
    }

    .receipt-upload-button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border: 1px solid var(--app-color-border-strong);
      border-radius: 10px;
      background: var(--app-color-surface);
      color: var(--app-color-text);
      min-height: 40px;
      padding: 0 14px;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }

    .receipt-hint,
    .receipt-error {
      margin: 8px 0 0;
      font-size: 0.78rem;
    }

    .receipt-hint {
      color: var(--app-color-text-muted);
    }

    .receipt-error {
      color: var(--app-color-danger);
      font-weight: 650;
    }

    .receipt-preview {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .receipt-preview-media {
      width: 72px;
      height: 72px;
      border-radius: 10px;
      overflow: hidden;
      background: var(--app-color-surface);
      border: 1px solid var(--app-color-border);
      flex: 0 0 auto;
    }

    .receipt-preview-media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .receipt-preview-trigger {
      width: 100%;
      height: 100%;
      border: 0;
      padding: 0;
      background: transparent;
      cursor: zoom-in;
    }

    .pdf-preview {
      height: 100%;
      display: grid;
      place-items: center;
      color: var(--app-color-primary);
      font-size: 0.75rem;
      font-weight: 800;
    }

    .receipt-preview-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
      gap: 2px;
      flex: 1;
    }

    .receipt-preview-info strong {
      color: var(--app-color-text);
      font-size: 0.9rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .receipt-preview-info span {
      color: var(--app-color-text-muted);
      font-size: 0.78rem;
    }

    .link-button {
      width: fit-content;
      border: 0;
      padding: 0;
      background: transparent;
      color: var(--app-color-primary);
      cursor: pointer;
      font: inherit;
      font-size: 0.8rem;
      font-weight: 700;
    }

    .remove-receipt,
    .icon-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: 0;
      border-radius: 10px;
      background: var(--app-color-surface);
      color: var(--app-color-text-muted);
      cursor: pointer;
    }

    .remove-receipt:hover,
    .icon-button:hover {
      color: var(--app-color-danger);
      background: #fef2f2;
    }

    .icon-button:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .receipt-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 1200;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: rgba(15, 23, 42, 0.72);
    }

    .receipt-modal {
      width: min(92vw, 980px);
      max-height: min(90dvh, 860px);
      border-radius: 14px;
      background: var(--app-color-surface);
      box-shadow: 0 24px 72px rgba(15, 23, 42, 0.32);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .receipt-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-bottom: 1px solid var(--app-color-border);
    }

    .receipt-modal-header strong {
      color: var(--app-color-text);
    }

    .receipt-modal-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .receipt-modal-zoom {
      min-width: 54px;
      color: var(--app-color-text-muted);
      text-align: center;
      font-size: 0.8rem;
      font-weight: 700;
    }

    .receipt-modal-reset {
      border: 1px solid var(--app-color-border);
      border-radius: 10px;
      background: var(--app-color-surface);
      color: var(--app-color-text);
      min-height: 36px;
      padding: 0 12px;
      font: inherit;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
    }

    .receipt-modal-body {
      overflow: auto;
      display: grid;
      place-items: center;
      min-height: 280px;
      padding: 16px;
      background: #0f172a;
    }

    .receipt-modal-image {
      max-width: 100%;
      max-height: calc(90dvh - 104px);
      transform-origin: center center;
      transition: transform 0.12s ease-out;
      border-radius: 8px;
    }

    @media (max-width: 640px) {
      .receipt-modal-backdrop {
        padding: 8px;
      }

      .receipt-modal {
        width: 100%;
        max-height: calc(100dvh - 16px);
        border-radius: 10px;
      }

      .receipt-modal-header {
        align-items: flex-start;
        flex-direction: column;
        padding: 10px;
      }

      .receipt-modal-actions {
        width: 100%;
      }

      .receipt-modal-body {
        max-height: calc(100dvh - 128px);
        padding: 6px;
      }

      .receipt-modal-image {
        max-height: calc(100dvh - 140px);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantPaymentReceiptUploadComponent {
  readonly file = input<File | null>(null);
  readonly error = input<string | null>(null);
  readonly previewKind = input<'image' | 'pdf' | null>(null);
  readonly previewUrl = input<SafeUrl | null>(null);
  readonly modalOpen = input(false);
  readonly zoom = input(1);
  readonly minZoom = input(1);
  readonly maxZoom = input(8);

  readonly fileSelected = output<File | null>();
  readonly openPreview = output<void>();
  readonly remove = output<void>();
  readonly closeModal = output<void>();
  readonly zoomIn = output<void>();
  readonly zoomOut = output<void>();
  readonly resetZoom = output<void>();
  readonly wheel = output<WheelEvent>();

  readonly FileCheck2 = FileCheck2;
  readonly Trash2 = Trash2;
  readonly Upload = Upload;
  readonly XCircle = XCircle;
  readonly ZoomIn = ZoomIn;
  readonly ZoomOut = ZoomOut;

  handleFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fileSelected.emit(input.files?.[0] ?? null);
    input.value = '';
  }

  formatFileSize(size: number): string {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
}
