import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
} from 'lucide-angular';

import { InspectionService } from '../../core/services/admin/inspection.service';
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
import { environment } from '../../../environments/environment';

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
export class InspectionDetailComponent {
  readonly ArrowLeft = ArrowLeft;
  readonly Camera = Camera;
  readonly FileText = FileText;
  readonly CheckCircle2 = CheckCircle2;
  readonly Save = Save;

  readonly conditions = Object.values(ItemCondition);

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly slugService = inject(SlugService);
  private readonly inspectionService = inject(InspectionService);
  private readonly fileDownload = inject(FileDownloadService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly inspection = signal<Inspection | null>(null);
  readonly items = signal<InspectionItem[]>([]);
  readonly isLoading = signal(true);
  readonly saving = signal(false);
  readonly uploadingItemId = signal<number | null>(null);

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
  }

  setNotes(item: InspectionItem, notes: string): void {
    this.items.update((items) => items.map((i) => (i === item ? { ...i, notes } : i)));
  }

  textareaValue(event: Event): string {
    return event.target instanceof HTMLTextAreaElement ? event.target.value : '';
  }

  photoUrl(path: string): string {
    return path.startsWith('http') ? path : `${environment.apiUrl.replace(/\/$/, '')}${path}`;
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
    this.saving.set(true);
    this.inspectionService.updateItems(inspection.id, this.items(), complete).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.inspection.set(updated);
        this.items.set((updated.items ?? []).map((i) => ({ ...i })));
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
}
