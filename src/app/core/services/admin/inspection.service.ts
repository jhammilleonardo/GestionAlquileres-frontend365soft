import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';

import { ApiClientService, QueryParams } from '../../http/api-client.service';
import { SlugService } from '../slug.service';
import { environment } from '../../../../environments/environment';
import {
  CreateInspectionDto,
  CreateInspectionTemplateDto,
  Inspection,
  InspectionComparisonItem,
  InspectionItem,
  InspectionTemplate,
  UpdateInspectionTemplateDto,
} from '../../models/inspection.model';
import { ImageOptimizationService } from '../image-optimization.service';

@Injectable({ providedIn: 'root' })
export class InspectionService {
  private readonly api = inject(ApiClientService);
  private readonly http = inject(HttpClient);
  private readonly slugService = inject(SlugService);
  private readonly imageOptimization = inject(ImageOptimizationService);

  list(params: QueryParams = {}): Observable<Inspection[]> {
    return this.api.get<Inspection[]>(this.endpoint('admin/inspections'), { params });
  }

  getById(id: number): Observable<Inspection> {
    return this.api.get<Inspection>(this.endpoint(`admin/inspections/${id}`));
  }

  create(dto: CreateInspectionDto): Observable<Inspection> {
    return this.api.post<Inspection, CreateInspectionDto>(this.endpoint('admin/inspections'), dto);
  }

  updateItems(id: number, items: InspectionItem[], complete: boolean): Observable<Inspection> {
    // El backend valida con forbidNonWhitelisted: solo enviar los campos del DTO
    // (las fotos se gestionan por su propio endpoint y romperían la validación).
    const payload = items.map((item) => ({
      ...(item.id ? { id: item.id } : {}),
      area: item.area,
      item_name: item.item_name,
      condition: item.condition,
      ...(item.notes != null ? { notes: item.notes } : {}),
    }));
    return this.api.patch<Inspection, { items: typeof payload; complete: boolean }>(
      this.endpoint(`admin/inspections/${id}/items`),
      { items: payload, complete },
    );
  }

  removeItem(id: number, itemId: number): Observable<Inspection> {
    return this.api.delete<Inspection>(this.endpoint(`admin/inspections/${id}/items/${itemId}`));
  }

  uploadItemPhotos(id: number, itemId: number, files: File[]): Observable<{ photos: string[] }> {
    return from(this.imageOptimization.filesToFormData(files, 'files')).pipe(
      switchMap((formData) =>
        this.api.post<{ photos: string[] }, FormData>(
          this.endpoint(`admin/inspections/${id}/photos`),
          formData,
          { params: { item_id: itemId } },
        ),
      ),
    );
  }

  compare(moveInId: number, moveOutId: number): Observable<InspectionComparisonItem[]> {
    return this.api.get<InspectionComparisonItem[]>(this.endpoint('admin/inspections/compare'), {
      params: { move_in: moveInId, move_out: moveOutId },
    });
  }

  downloadPdf(id: number): Observable<Blob> {
    const url = `${environment.apiUrl}${this.endpoint(`admin/inspections/${id}/pdf`)}`;
    return this.http.get(url, { responseType: 'blob' });
  }

  // ─── Plantillas ─────────────────────────────────────────────────────────────

  listTemplates(): Observable<InspectionTemplate[]> {
    return this.api.get<InspectionTemplate[]>(this.endpoint('admin/inspection-templates'));
  }

  createTemplate(dto: CreateInspectionTemplateDto): Observable<InspectionTemplate> {
    return this.api.post<InspectionTemplate, CreateInspectionTemplateDto>(
      this.endpoint('admin/inspection-templates'),
      dto,
    );
  }

  updateTemplate(id: number, dto: UpdateInspectionTemplateDto): Observable<InspectionTemplate> {
    return this.api.patch<InspectionTemplate, UpdateInspectionTemplateDto>(
      this.endpoint(`admin/inspection-templates/${id}`),
      dto,
    );
  }

  deleteTemplate(id: number): Observable<void> {
    return this.api.delete<void>(this.endpoint(`admin/inspection-templates/${id}`));
  }

  private endpoint(path: string): string {
    return this.slugService.buildApiEndpoint(path);
  }
}
