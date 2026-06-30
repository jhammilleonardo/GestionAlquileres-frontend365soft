import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import {
  LucideAngularModule,
  ArrowLeft,
  Camera,
  FileText,
  CheckCircle2,
  Save,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-angular';

import { InspectionService } from '../../core/services/admin/inspection.service';
import { SecureFileService } from '../../core/services/secure-file.service';
import { CanComponentDeactivate } from '../../core/guards/unsaved-changes.guard';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { SlugService } from '../../core/services/slug.service';
import {
  Inspection,
  InspectionArea,
  InspectionItem,
  InspectionStatus,
  ItemCondition,
} from '../../core/models/inspection.model';
import { FileDownloadService } from '../../core/services/file-download.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { AppLoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import {
  AppStatusBadgeComponent,
  AppStatusTone,
} from '../../shared/ui/status-badge/status-badge.component';

interface AreaGroup {
  area: InspectionArea;
  items: InspectionItem[];
}

@Component({
  selector: 'app-inspection-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    TranslocoModule,
    LucideAngularModule,
    AppButtonComponent,
    AppLoadingStateComponent,
    AppStatusBadgeComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'inspecciones', alias: 'inspections' })],
  templateUrl: './inspection-detail.component.html',
  styleUrl: './inspection-detail.component.scss',
})
export class InspectionDetailComponent implements CanComponentDeactivate {
  readonly ArrowLeft = ArrowLeft;
  readonly Camera = Camera;
  readonly FileText = FileText;
  readonly CheckCircle2 = CheckCircle2;
  readonly Save = Save;
  readonly Trash2 = Trash2;
  readonly X = X;
  readonly ZoomIn = ZoomIn;
  readonly ZoomOut = ZoomOut;

  private readonly minZoom = 1;
  private readonly maxZoom = 4;
  private readonly zoomStep = 0.5;

  readonly conditions = Object.values(ItemCondition);

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly slugService = inject(SlugService);
  private readonly inspectionService = inject(InspectionService);
  private readonly secureFile = inject(SecureFileService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly fileDownload = inject(FileDownloadService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly inspection = signal<Inspection | null>(null);
  readonly items = signal<InspectionItem[]>([]);
  readonly isLoading = signal(true);
  readonly saving = signal(false);
  readonly uploadingItemId = signal<number | null>(null);
  readonly photoUrls = signal<Record<string, string>>({});
  readonly lightboxUrl = signal<string | null>(null);
  /** Hay ediciones de checklist (condición/notas/título/ítems) aún sin guardar. */
  readonly dirty = signal(false);
  readonly lightboxZoom = signal(1);

  private tempIdCounter = 0;

  readonly groupedItems = computed<AreaGroup[]>(() => {
    const groups = new Map<InspectionArea, InspectionItem[]>();
    for (const item of this.items()) {
      const list = groups.get(item.area) ?? [];
      list.push(item);
      groups.set(item.area, list);
    }
    return Array.from(groups.entries()).map(([area, items]) => ({ area, items }));
  });

  readonly isCompleted = computed(() => this.inspection()?.status === InspectionStatus.COMPLETED);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.load(id);
    } else {
      this.isLoading.set(false);
      this.back();
    }
  }

  private load(id: number): void {
    this.isLoading.set(true);
    this.inspectionService.getById(id).subscribe({
      next: (inspection) => {
        this.inspection.set(inspection);
        this.items.set((inspection.items ?? []).map((i) => ({ ...i })));
        this.dirty.set(false);
        this.loadPhotoUrls();
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.back();
      },
    });
  }

  conditionTone(condition: ItemCondition): AppStatusTone {
    switch (condition) {
      case ItemCondition.GOOD:
        return 'success';
      case ItemCondition.FAIR:
        return 'info';
      case ItemCondition.POOR:
        return 'warning';
      case ItemCondition.DAMAGED:
        return 'danger';
    }
  }

  setCondition(item: InspectionItem, condition: ItemCondition): void {
    this.items.update((items) => items.map((i) => (i === item ? { ...i, condition } : i)));
    this.dirty.set(true);
  }

  setNotes(item: InspectionItem, notes: string): void {
    this.items.update((items) => items.map((i) => (i === item ? { ...i, notes } : i)));
    this.dirty.set(true);
  }

  setName(item: InspectionItem, item_name: string): void {
    this.items.update((items) => items.map((i) => (i === item ? { ...i, item_name } : i)));
    this.dirty.set(true);
  }

  addItem(area: InspectionArea): void {
    const newItem: InspectionItem = {
      area,
      item_name: '',
      condition: ItemCondition.GOOD,
      notes: '',
      _tempId: ++this.tempIdCounter,
    };
    this.items.update((items) => [...items, newItem]);
    this.dirty.set(true);
  }

  inputValue(event: Event): string {
    return event.target instanceof HTMLInputElement ? event.target.value : '';
  }

  async removeItem(item: InspectionItem): Promise<void> {
    // Ítem nuevo aún sin guardar: basta con quitarlo del estado local.
    if (!item.id) {
      this.items.update((items) => items.filter((i) => i !== item));
      return;
    }
    const inspection = this.inspection();
    if (!inspection) return;
    const confirmed = await this.confirmDialog.confirm({
      title: this.transloco.translate('inspections.removeItemTitle'),
      message: this.transloco.translate('inspections.removeItemMessage', {
        name: item.item_name,
      }),
      confirmLabel: this.transloco.translate('common.delete'),
      cancelLabel: this.transloco.translate('common.cancel'),
      variant: 'danger',
    });
    if (!confirmed) return;
    this.inspectionService.removeItem(inspection.id, item.id).subscribe({
      // Filtramos localmente para no descartar ediciones sin guardar de otros ítems.
      next: () => {
        this.items.update((items) => items.filter((i) => i.id !== item.id));
        this.toast.success(this.transloco.translate('inspections.itemRemoved'));
      },
      error: () => this.toast.error(this.transloco.translate('inspections.saveError')),
    });
  }

  textareaValue(event: Event): string {
    return event.target instanceof HTMLTextAreaElement ? event.target.value : '';
  }

  photoSrc(path: string): string | null {
    return this.photoUrls()[path] ?? null;
  }

  openLightbox(url: string): void {
    this.lightboxZoom.set(1);
    this.lightboxUrl.set(url);
  }

  closeLightbox(): void {
    this.lightboxUrl.set(null);
  }

  zoomIn(): void {
    this.lightboxZoom.update((z) => Math.min(this.maxZoom, z + this.zoomStep));
  }

  zoomOut(): void {
    this.lightboxZoom.update((z) => Math.max(this.minZoom, z - this.zoomStep));
  }

  toggleZoom(): void {
    this.lightboxZoom.update((z) => (z > this.minZoom ? this.minZoom : 2));
  }

  onWheelZoom(event: WheelEvent): void {
    event.preventDefault();
    if (event.deltaY < 0) {
      this.zoomIn();
    } else {
      this.zoomOut();
    }
  }

  /** Las fotos son privadas (requieren JWT): se cargan como object URL autenticado. */
  private loadPhotoUrls(): void {
    const paths = this.items().flatMap((i) => i.photos ?? []);
    for (const path of paths) {
      if (this.photoUrls()[path]) continue;
      this.secureFile.getObjectUrl(path, 'admin').subscribe({
        next: (url) => this.photoUrls.update((urls) => ({ ...urls, [path]: url })),
        error: () => undefined,
      });
    }
  }

  onPhotoSelected(item: InspectionItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    const inspection = this.inspection();
    if (!inspection || !item.id || files.length === 0) {
      return;
    }
    this.uploadingItemId.set(item.id);
    this.inspectionService.uploadItemPhotos(inspection.id, item.id, files).subscribe({
      next: (res) => {
        this.uploadingItemId.set(null);
        this.items.update((items) =>
          items.map((i) => (i.id === item.id ? { ...i, photos: res.photos } : i)),
        );
        this.loadPhotoUrls();
        this.toast.success(this.transloco.translate('inspections.photosUploaded'));
      },
      error: () => {
        this.uploadingItemId.set(null);
        this.toast.error(this.transloco.translate('inspections.photoError'));
      },
    });
  }

  save(complete: boolean): void {
    const inspection = this.inspection();
    if (!inspection) return;
    // Descartar ítems nuevos sin nombre: el backend exige item_name no vacío.
    const items = this.items()
      .map((i) => ({ ...i, item_name: i.item_name.trim() }))
      .filter((i) => i.item_name.length > 0);
    this.saving.set(true);
    this.inspectionService.updateItems(inspection.id, items, complete).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.dirty.set(false);
        this.inspection.set(updated);
        this.items.set((updated.items ?? []).map((i) => ({ ...i })));
        this.loadPhotoUrls();
        this.toast.success(
          this.transloco.translate(complete ? 'inspections.completed' : 'inspections.saved'),
        );
      },
      error: () => {
        this.saving.set(false);
        this.toast.error(this.transloco.translate('inspections.saveError'));
      },
    });
  }

  downloadPdf(): void {
    const inspection = this.inspection();
    if (!inspection) return;
    this.inspectionService.downloadPdf(inspection.id).subscribe({
      next: (blob) => {
        this.fileDownload.downloadBlob(blob, `inspeccion_${inspection.id}.pdf`);
      },
      error: () => this.toast.error(this.transloco.translate('inspections.pdfError')),
    });
  }

  back(): void {
    const slug = this.slugService.getSlug();
    void this.router.navigate([slug, 'inspecciones']);
  }

  /** Aviso nativo al refrescar o cerrar la pestaña con cambios sin guardar. */
  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.dirty()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  /** Llamado por el guard al navegar dentro de la app (CanDeactivate). */
  async canDeactivate(): Promise<boolean> {
    if (!this.dirty()) return true;
    return this.confirmDialog.confirm({
      title: this.transloco.translate('inspections.unsavedTitle'),
      message: this.transloco.translate('inspections.unsavedMessage'),
      confirmLabel: this.transloco.translate('inspections.unsavedLeave'),
      cancelLabel: this.transloco.translate('inspections.unsavedStay'),
      variant: 'danger',
    });
  }
}
