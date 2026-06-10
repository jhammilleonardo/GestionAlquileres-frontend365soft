import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Eraser, LucideAngularModule, Pen, Type, Upload } from 'lucide-angular';
import { AppSegmentedControlComponent } from '../../../shared/ui';
import type { AppSegmentedControlOption } from '../../../shared/ui/segmented-control/segmented-control.component';

export type SignatureMethod = 'draw' | 'type' | 'upload';

export interface SignatureResult {
  image: string;
  method: SignatureMethod;
}

const STROKE_WIDTH = 2.5;
const STROKE_COLOR = '#1a1a2e';
const TYPED_FONT = "italic 44px 'Segoe Script', 'Brush Script MT', cursive";
const MAX_UPLOAD_BYTES = 1_500_000;

/**
 * Lienzo de firma electrónica con tres métodos (modelo Dropbox Sign / Buildium):
 * dibujar con dedo/mouse/stylus, escribir el nombre en cursiva, o subir una
 * imagen de firma. Emite la firma como data URL PNG, o null si está vacía.
 */
@Component({
  selector: 'app-signature-pad',
  standalone: true,
  imports: [FormsModule, TranslocoModule, LucideAngularModule, AppSegmentedControlComponent],
  template: `
    <div class="signature-pad">
      <app-segmented-control
        [options]="modeOptions()"
        [ngModel]="mode()"
        (valueChanged)="onModeChange($event)"
        [ariaLabel]="'public.signaturePad.modeLabel' | transloco"
      />

      @switch (mode()) {
        @case ('draw') {
          <div class="pad-surface">
            <canvas
              #canvas
              class="draw-canvas"
              role="img"
              [attr.aria-label]="'public.signaturePad.drawAria' | transloco"
              (pointerdown)="onPointerDown($event)"
              (pointermove)="onPointerMove($event)"
              (pointerup)="onPointerUp($event)"
              (pointerleave)="onPointerUp($event)"
            ></canvas>
            @if (!hasContent()) {
              <span class="placeholder">{{ 'public.signaturePad.drawHint' | transloco }}</span>
            }
          </div>
        }
        @case ('type') {
          <div class="type-area">
            <input
              type="text"
              class="type-input"
              autocomplete="name"
              [ngModel]="typedName()"
              (ngModelChange)="onTypedNameChange($event)"
              [placeholder]="'public.signaturePad.typePlaceholder' | transloco"
              [attr.aria-label]="'public.signaturePad.typeAria' | transloco"
            />
            <div class="type-preview" aria-hidden="true">
              @if (typedName().trim()) {
                <span>{{ typedName() }}</span>
              } @else {
                <span class="placeholder">{{ 'public.signaturePad.typeHint' | transloco }}</span>
              }
            </div>
          </div>
        }
        @case ('upload') {
          <div class="upload-area">
            @if (uploadedImage(); as img) {
              <img
                class="upload-preview"
                [src]="img"
                [alt]="'public.signaturePad.uploadPreviewAlt' | transloco"
              />
            } @else {
              <label class="upload-drop">
                <lucide-icon [img]="Upload" [size]="24"></lucide-icon>
                <span>{{ 'public.signaturePad.uploadHint' | transloco }}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  (change)="onFileSelected($event)"
                />
              </label>
            }
            @if (uploadError()) {
              <small class="error" role="alert">{{
                'public.signaturePad.uploadError' | transloco
              }}</small>
            }
          </div>
        }
      }

      <div class="pad-actions">
        <button type="button" class="clear-btn" [disabled]="!hasContent()" (click)="clear()">
          <lucide-icon [img]="Eraser" [size]="16"></lucide-icon>
          {{ 'public.signaturePad.clear' | transloco }}
        </button>
      </div>
    </div>
  `,
  styles: `
    .signature-pad {
      display: grid;
      gap: var(--app-space-3);
    }

    .pad-surface {
      position: relative;
      border: 1px dashed var(--app-color-border);
      border-radius: var(--app-radius-md);
      background: var(--app-color-surface);
      block-size: 180px;
      overflow: hidden;
    }

    .draw-canvas {
      inline-size: 100%;
      block-size: 100%;
      touch-action: none;
      cursor: crosshair;
      display: block;
    }

    .placeholder {
      color: var(--app-color-text-muted);
      font-style: italic;
    }

    .pad-surface .placeholder {
      position: absolute;
      inset-block-start: 50%;
      inset-inline-start: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
    }

    .type-area {
      display: grid;
      gap: var(--app-space-2);
    }

    .type-input {
      inline-size: 100%;
      min-block-size: 2.75rem;
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-md);
      background: var(--app-color-surface);
      color: var(--app-color-text);
      font: inherit;
      padding: 0 var(--app-space-3);
      outline: none;
    }

    .type-input:focus {
      border-color: var(--app-color-primary);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--app-color-primary) 18%, transparent);
    }

    .type-preview {
      display: flex;
      align-items: center;
      justify-content: center;
      min-block-size: 110px;
      border: 1px dashed var(--app-color-border);
      border-radius: var(--app-radius-md);
      background: var(--app-color-surface-muted);
    }

    .type-preview span:not(.placeholder) {
      font-family: 'Segoe Script', 'Brush Script MT', cursive;
      font-size: 2.2rem;
      font-style: italic;
      color: ${STROKE_COLOR};
    }

    .upload-area {
      display: grid;
      gap: var(--app-space-2);
    }

    .upload-drop {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--app-space-2);
      min-block-size: 140px;
      border: 1px dashed var(--app-color-border);
      border-radius: var(--app-radius-md);
      background: var(--app-color-surface-muted);
      color: var(--app-color-text-muted);
      cursor: pointer;
      text-align: center;
      padding: var(--app-space-3);
    }

    .upload-drop input[type='file'] {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      opacity: 0;
      pointer-events: none;
    }

    .upload-preview {
      max-inline-size: 100%;
      max-block-size: 140px;
      object-fit: contain;
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-md);
      background: #fff;
      padding: var(--app-space-2);
    }

    .pad-actions {
      display: flex;
      justify-content: flex-end;
    }

    .clear-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--app-space-1);
      border: none;
      background: none;
      color: var(--app-color-text-muted);
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      padding: var(--app-space-1) var(--app-space-2);
    }

    .clear-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .error {
      color: var(--app-color-danger);
      font-weight: 700;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignaturePadComponent {
  private readonly transloco = inject(TranslocoService);

  protected readonly Pen = Pen;
  protected readonly Type = Type;
  protected readonly Upload = Upload;
  protected readonly Eraser = Eraser;

  readonly signatureChange = output<SignatureResult | null>();

  protected readonly mode = signal<SignatureMethod>('draw');
  protected readonly typedName = signal('');
  protected readonly uploadedImage = signal<string | null>(null);
  protected readonly uploadError = signal(false);
  private readonly drawn = signal(false);

  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private ctx: CanvasRenderingContext2D | null = null;
  private isDrawing = false;
  private lastX = 0;
  private lastY = 0;
  private resizeObserver?: ResizeObserver;

  protected readonly modeOptions = (): AppSegmentedControlOption<SignatureMethod>[] => [
    { value: 'draw', label: this.transloco.translate('public.signaturePad.draw') },
    { value: 'type', label: this.transloco.translate('public.signaturePad.type') },
    {
      value: 'upload',
      label: this.transloco.translate('public.signaturePad.upload'),
    },
  ];

  constructor() {
    const destroyRef = inject(DestroyRef);
    effect(() => {
      const ref = this.canvasRef();
      this.resizeObserver?.disconnect();
      if (!ref) return;

      const canvas = ref.nativeElement;
      this.configureCanvas(canvas);
      // El diálogo puede medir el canvas en 0×0 hasta que termina su layout;
      // el observer lo reconfigura cuando obtiene su tamaño real.
      this.resizeObserver = new ResizeObserver(() => this.configureCanvas(canvas));
      this.resizeObserver.observe(canvas);
    });
    destroyRef.onDestroy(() => this.resizeObserver?.disconnect());
  }

  protected hasContent(): boolean {
    switch (this.mode()) {
      case 'draw':
        return this.drawn();
      case 'type':
        return this.typedName().trim().length > 0;
      case 'upload':
        return this.uploadedImage() !== null;
    }
  }

  protected onModeChange(mode: SignatureMethod | null): void {
    this.mode.set(mode ?? 'draw');
    this.emit();
  }

  // --- Modo dibujar ---

  private configureCanvas(canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return; // aún sin layout

    const ratio = window.devicePixelRatio || 1;
    const targetWidth = Math.round(rect.width * ratio);
    const targetHeight = Math.round(rect.height * ratio);

    // Evita reconfigurar (y borrar el trazo) si el tamaño no cambió.
    if (this.ctx && canvas.width === targetWidth && canvas.height === targetHeight) {
      return;
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = STROKE_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = STROKE_COLOR;
    this.ctx = ctx;
  }

  protected onPointerDown(event: PointerEvent): void {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;
    // Garantiza que el canvas esté dimensionado antes del primer trazo.
    this.configureCanvas(canvas);
    if (!this.ctx) return;
    canvas.setPointerCapture(event.pointerId);
    this.isDrawing = true;
    const point = this.pointFromEvent(event, canvas);
    this.lastX = point.x;
    this.lastY = point.y;
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.isDrawing || !this.ctx) return;
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;
    const point = this.pointFromEvent(event, canvas);
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(point.x, point.y);
    this.ctx.stroke();
    this.lastX = point.x;
    this.lastY = point.y;
    if (!this.drawn()) {
      this.drawn.set(true);
    }
  }

  protected onPointerUp(event: PointerEvent): void {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    const canvas = this.canvasRef()?.nativeElement;
    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    this.emit();
  }

  private pointFromEvent(event: PointerEvent, canvas: HTMLCanvasElement): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  // --- Modo escribir ---

  protected onTypedNameChange(value: string): void {
    this.typedName.set(value);
    this.emit();
  }

  // --- Modo subir ---

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadError.set(false);
    if (!file.type.startsWith('image/') || file.size > MAX_UPLOAD_BYTES) {
      this.uploadError.set(true);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.uploadedImage.set(reader.result as string);
      this.emit();
    };
    reader.onerror = () => this.uploadError.set(true);
    reader.readAsDataURL(file);
  }

  // --- Común ---

  clear(): void {
    if (this.ctx) {
      const canvas = this.canvasRef()?.nativeElement;
      if (canvas) {
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    this.drawn.set(false);
    this.typedName.set('');
    this.uploadedImage.set(null);
    this.uploadError.set(false);
    this.emit();
  }

  private emit(): void {
    const image = this.buildImage();
    this.signatureChange.emit(image ? { image, method: this.mode() } : null);
  }

  private buildImage(): string | null {
    switch (this.mode()) {
      case 'draw':
        return this.drawn()
          ? (this.canvasRef()?.nativeElement.toDataURL('image/png') ?? null)
          : null;
      case 'type':
        return this.renderTypedSignature();
      case 'upload':
        return this.uploadedImage();
    }
  }

  /** Renderiza el nombre escrito en cursiva sobre un canvas transparente. */
  private renderTypedSignature(): string | null {
    const text = this.typedName().trim();
    if (!text) return null;

    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = STROKE_COLOR;
    ctx.font = TYPED_FONT;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2, canvas.width - 20);

    return canvas.toDataURL('image/png');
  }
}
