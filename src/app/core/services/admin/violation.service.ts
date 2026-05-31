import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiClientService, QueryParams } from '../../http/api-client.service';
import { SlugService } from '../slug.service';
import { environment } from '../../../../environments/environment';
import {
  CreateViolationDto,
  PaginatedViolations,
  Violation,
  ViolationStatus,
} from '../../models/violation.model';

@Injectable({ providedIn: 'root' })
export class ViolationService {
  private readonly api = inject(ApiClientService);
  private readonly http = inject(HttpClient);
  private readonly slugService = inject(SlugService);

  list(params: QueryParams = {}): Observable<PaginatedViolations> {
    return this.api.get<PaginatedViolations>(this.endpoint('admin/violations'), { params });
  }

  create(dto: CreateViolationDto): Observable<Violation> {
    return this.api.post<Violation, CreateViolationDto>(this.endpoint('admin/violations'), dto);
  }

  updateStatus(id: number, status: ViolationStatus, resolvedNotes?: string): Observable<Violation> {
    return this.api.patch<Violation, { status: ViolationStatus; resolved_notes?: string }>(
      this.endpoint(`admin/violations/${id}/status`),
      { status, resolved_notes: resolvedNotes },
    );
  }

  notify(id: number): Observable<{ message: string }> {
    return this.api.post<{ message: string }, Record<string, never>>(
      this.endpoint(`admin/violations/${id}/notify`),
      {},
    );
  }

  uploadEvidence(id: number, files: File[]): Observable<{ evidence_photos: string[] }> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return this.api.post<{ evidence_photos: string[] }, FormData>(
      this.endpoint(`admin/violations/${id}/upload`),
      formData,
    );
  }

  downloadPdf(id: number): Observable<Blob> {
    const url = `${environment.apiUrl}${this.endpoint(`admin/violations/${id}/pdf`)}`;
    return this.http.get(url, { responseType: 'blob' });
  }

  private endpoint(path: string): string {
    return this.slugService.buildApiEndpoint(path);
  }
}
