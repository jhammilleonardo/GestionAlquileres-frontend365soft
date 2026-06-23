import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import {
  Check,
  Crop,
  FlipHorizontal2,
  GripVertical,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Star,
  Trash2,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
  LucideAngularModule,
} from 'lucide-angular';
import {
  ImageCroppedEvent,
  ImageCropperComponent,
  ImageTransform,
  OutputFormat,
} from 'ngx-image-cropper';

import { AppButtonComponent } from '../button/button.component';
import { ImageOptimizationService } from '../../../core/services/image-optimization.service';

/** Vista de una imagen: el archivo de origen y su URL de previsualización cacheada. */
interface UploaderImage {
  readonly file: File;
  readonly previewUrl: string;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ZOOM_STEP = 0.1;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const DEFAULT_TRANSFORM: ImageTransform = { scale: 1, rotate: 0, flipH: false, flipV: false };

/** Relaciones de aspecto del recortador. `null` = libre. */
interface AspectChoice {
  readonly labelKey: string;
  readonly ratio: number | null;
}

const ASPECT_CHOICES: readonly AspectChoice[] = [
  { labelKey: 'imageUploader.aspectFree', ratio: null },
  { labelKey: 'imageUploader.aspect43', ratio: 4 / 3 },
  { labelKey: 'imageUploader.aspect11', ratio: 1 },
  { labelKey: 'imageUploader.aspect169', ratio: 16 / 9 },
];

/**
 * Uploader de imágenes controlado: el estado (lista de archivos) lo posee el padre.
 * Recibe `files`, emite `filesChange` ante cada alta, baja, reorden, portada o recorte.
 * Soporta previsualización, arrastrar para reordenar y editar/recortar (ngx-image-cropper).
 */
@Component({
  selector: 'app-image-uploader',
  standalone: true,
  imports: [
    TranslocoModule,
    LucideAngularModule,
    CdkDropList,
    CdkDrag,
    ImageCropperComponent,
    AppButtonComponent,
  ],
  templateUrl: './image-uploader.component.html',
  styleUrl: './image-uploader.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppImageUploaderComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly imageOptimization = inject(ImageOptimizationService);

  readonly files = input<readonly File[]>([]);
  readonly maxFiles = input(10);
  readonly maxSizeMb = input(5);
  /** Proporción inicial del recortador. `null` = libre. Ej.: 16/9 para una portada. */
  readonly defaultAspect = input<number | null>(4 / 3);
  /**
   * Bloquea el recorte a `defaultAspect`: oculta el resto de proporciones y las
   * herramientas que no se usan, mostrando solo el formato real del portal.
   */
  readonly lockAspect = input(false);

  readonly filesChange = output<File[]>();

  protected readonly UploadIcon = Upload;
  protected readonly CropIcon = Crop;
  protected readonly Trash2Icon = Trash2;
  protected readonly StarIcon = Star;
  protected readonly GripVerticalIcon = GripVertical;
  protected readonly RotateCcwIcon = RotateCcw;
  protected readonly RotateCwIcon = RotateCw;
  protected readonly ZoomInIcon = ZoomIn;
  protected readonly ZoomOutIcon = ZoomOut;
  protected readonly FlipIcon = FlipHorizontal2;
  protected readonly RefreshIcon = RefreshCw;
  protected readonly CheckIcon = Check;
  protected readonly XIcon = X;

  protected readonly aspectChoices = ASPECT_CHOICES;
  // Etiqueta del formato bloqueado (p. ej. "16:9") para mostrarlo como indicador.
  protected readonly lockedAspectLabelKey = computed(() => {
    const ratio = this.defaultAspect();
    return (
      ASPECT_CHOICES.find((choice) => choice.ratio === ratio)?.labelKey ??
      'imageUploader.aspectFree'
    );
  });
  // El selector nativo permite elegir cualquier imagen; la conversión a WebP y
  // la validación de tamaño se hacen al ingresar (ver addFiles).
  protected readonly acceptAttr = 'image/*';

  /** Caché archivo → object URL para no regenerar previsualizaciones en cada cambio. */
  private readonly previewCache = new Map<File, string>();
  protected readonly items = signal<UploaderImage[]>([]);

  protected readonly isDragOver = signal(false);
  protected readonly rejectedInvalid = signal(0);
  protected readonly rejectedMax = signal(0);

  protected readonly cropTarget = signal<File | null>(null);
  protected readonly transform = signal<ImageTransform>(DEFAULT_TRANSFORM);
  protected readonly aspectRatio = signal(4 / 3);
  protected readonly maintainAspect = signal(true);
  private croppedBlob: Blob | null = null;

  protected readonly canAddMore = computed(() => this.items().length < this.maxFiles());
  private readonly remainingSlots = computed(() => this.maxFiles() - this.files().length);

  constructor() {
    // Sincroniza la vista (con caché de URLs) cada vez que cambia la lista de archivos del padre.
    effect(() => {
      const files = this.files();
      this.items.set(files.map((file) => ({ file, previewUrl: this.previewFor(file) })));
      this.evictUnusedPreviews(files);
    });

    this.destroyRef.onDestroy(() => {
      this.previewCache.forEach((url) => URL.revokeObjectURL(url));
      this.previewCache.clear();
    });
  }

  // ==================== Alta de archivos ====================

  protected onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    void this.addFiles(Array.from(input.files ?? []));
    input.value = '';
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    void this.addFiles(Array.from(event.dataTransfer?.files ?? []));
  }

  private async addFiles(incoming: File[]): Promise<void> {
    if (incoming.length === 0) return;

    const maxBytes = this.maxSizeMb() * 1024 * 1024;
    const valid: File[] = [];
    let invalidCount = 0;

    for (const file of incoming) {
      // Solo descartamos de entrada lo que ni siquiera es una imagen. El límite
      // de tamaño se aplica al WebP resultante, no al original: convertir primero
      // permite aceptar fotos pesadas (de cámara/celular) que se reducen mucho.
      if (!file.type.startsWith('image/')) {
        invalidCount++;
        continue;
      }

      const optimized = await this.imageOptimization.optimizeFile(file);
      const converted = optimized !== file; // optimizeFile devuelve el original si no pudo convertir
      const typeOk = converted || ACCEPTED_TYPES.includes(optimized.type);

      if (typeOk && optimized.size <= maxBytes) {
        valid.push(optimized);
      } else {
        invalidCount++;
      }
    }

    const accepted = valid.slice(0, this.remainingSlots());
    this.rejectedInvalid.set(invalidCount);
    this.rejectedMax.set(valid.length - accepted.length);

    if (accepted.length > 0) {
      this.emit([...this.files(), ...accepted]);
    }
  }

  // ==================== Grid: reordenar / portada / borrar ====================

  protected onReorder(event: CdkDragDrop<UploaderImage[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    const next = [...this.files()];
    moveItemInArray(next, event.previousIndex, event.currentIndex);
    this.emit(next);
  }

  protected makeCover(file: File): void {
    const next = this.files().filter((f) => f !== file);
    this.emit([file, ...next]);
  }

  protected removeImage(file: File): void {
    this.emit(this.files().filter((f) => f !== file));
  }

  // ==================== Recorte ====================

  protected openCrop(file: File): void {
    this.croppedBlob = null;
    this.transform.set(DEFAULT_TRANSFORM);
    const aspect = this.defaultAspect();
    this.aspectRatio.set(aspect ?? 4 / 3);
    this.maintainAspect.set(aspect !== null);
    this.cropTarget.set(file);
  }

  protected closeCrop(): void {
    this.cropTarget.set(null);
    this.croppedBlob = null;
  }

  protected onImageCropped(event: ImageCroppedEvent): void {
    this.croppedBlob = event.blob ?? null;
  }

  protected rotate(direction: -1 | 1): void {
    this.transform.update((t) => ({ ...t, rotate: ((t.rotate ?? 0) + direction * 90) % 360 }));
  }

  protected zoom(direction: -1 | 1): void {
    this.transform.update((t) => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, (t.scale ?? 1) + direction * ZOOM_STEP));
      return { ...t, scale: Math.round(next * 100) / 100 };
    });
  }

  protected flip(): void {
    this.transform.update((t) => ({ ...t, flipH: !t.flipH }));
  }

  protected setAspect(choice: AspectChoice): void {
    if (choice.ratio === null) {
      this.maintainAspect.set(false);
      return;
    }
    this.maintainAspect.set(true);
    this.aspectRatio.set(choice.ratio);
  }

  protected isAspectActive(choice: AspectChoice): boolean {
    return choice.ratio === null
      ? !this.maintainAspect()
      : this.maintainAspect() && this.aspectRatio() === choice.ratio;
  }

  protected resetCrop(): void {
    this.transform.set(DEFAULT_TRANSFORM);
  }

  protected saveCrop(): void {
    const target = this.cropTarget();
    if (!target || !this.croppedBlob) {
      this.closeCrop();
      return;
    }

    const edited = new File([this.croppedBlob], this.toWebpName(target.name), {
      type: this.croppedBlob.type || 'image/webp',
    });

    this.emit(this.files().map((f) => (f === target ? edited : f)));
    this.closeCrop();
  }

  protected cropFormat(file: File): OutputFormat {
    void file;
    return 'webp';
  }

  // ==================== Helpers ====================

  private previewFor(file: File): string {
    let url = this.previewCache.get(file);
    if (!url) {
      url = URL.createObjectURL(file);
      this.previewCache.set(file, url);
    }
    return url;
  }

  private evictUnusedPreviews(current: readonly File[]): void {
    for (const [file, url] of this.previewCache) {
      if (!current.includes(file)) {
        URL.revokeObjectURL(url);
        this.previewCache.delete(file);
      }
    }
  }

  private emit(files: File[]): void {
    this.filesChange.emit(files);
  }

  private toWebpName(name: string): string {
    const base = name.replace(/\.[^.]+$/, '');
    return `${base || 'image'}.webp`;
  }
}
