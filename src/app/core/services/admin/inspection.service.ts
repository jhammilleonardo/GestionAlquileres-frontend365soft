import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';

import { ApiClientService, QueryParams } from '../../http/api-client.service';
import { SlugService } from '../slug.service';
import { environment } from '../../../../environments/environment';
import {
  CreateInspectionDto,
  Inspection,
  InspectionComparisonItem,
  InspectionItem,
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
    return this.api.patch<Inspection, { items: InspectionItem[]; complete: boolean }>(
      this.endpoint(`admin/inspections/${id}/items`),
      { items, complete },
    );
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

  private endpoint(path: string): string {
    return this.slugService.buildApiEndpoint(path);
  }
}
