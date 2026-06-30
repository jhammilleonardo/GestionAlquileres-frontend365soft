import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';

import { ApiClientService, QueryParams } from '../../http/api-client.service';
import { SlugService } from '../slug.service';
import { environment } from '../../../../environments/environment';
import {
  ChargeFineDto,
  CreateViolationDto,
  PaginatedViolations,
  Violation,
  ViolationEvent,
  ViolationStats,
  ViolationStatus,
} from '../../models/violation.model';
import { ImageOptimizationService } from '../image-optimization.service';

@Injectable({ providedIn: 'root' })
export class ViolationService {
  private readonly api = inject(ApiClientService);
  private readonly http = inject(HttpClient);
  private readonly slugService = inject(SlugService);
  private readonly imageOptimization = inject(ImageOptimizationService);

  list(params: QueryParams = {}): Observable<PaginatedViolations> {
    return this.api.get<PaginatedViolations>(this.endpoint('admin/violations'), { params });
  }

  stats(): Observable<ViolationStats> {
    return this.api.get<ViolationStats>(this.endpoint('admin/violations/stats'));
  }

  getById(id: number): Observable<Violation> {
    return this.api.get<Violation>(this.endpoint(`admin/violations/${id}`));
  }

  create(dto: CreateViolationDto): Observable<Violation> {
    return this.api.post<Violation, CreateViolationDto>(this.endpoint('admin/violations'), dto);
  }

  updateStatus(
    id: number,
    status: ViolationStatus,
    resolvedNotes?: string,
    dueDate?: string,
  ): Observable<Violation> {
    return this.api.patch<
      Violation,
      { status: ViolationStatus; resolved_notes?: string; due_date?: string }
    >(this.endpoint(`admin/violations/${id}/status`), {
      status,
      resolved_notes: resolvedNotes,
      due_date: dueDate,
    });
  }

  addNote(id: number, note: string): Observable<ViolationEvent[]> {
    return this.api.post<ViolationEvent[], { note: string }>(
      this.endpoint(`admin/violations/${id}/notes`),
      { note },
    );
  }

  chargeFine(id: number, dto: ChargeFineDto): Observable<Violation> {
    return this.api.post<Violation, ChargeFineDto>(
      this.endpoint(`admin/violations/${id}/fine`),
      dto,
    );
  }

  waiveFine(id: number): Observable<Violation> {
    return this.api.post<Violation, Record<string, never>>(
      this.endpoint(`admin/violations/${id}/fine/waive`),
      {},
    );
  }

  payFine(id: number): Observable<Violation> {
    return this.api.post<Violation, Record<string, never>>(
      this.endpoint(`admin/violations/${id}/fine/pay`),
      {},
    );
  }

  notify(id: number): Observable<{ message: string }> {
    return this.api.post<{ message: string }, Record<string, never>>(
      this.endpoint(`admin/violations/${id}/notify`),
      {},
    );
  }

  uploadEvidence(id: number, files: File[]): Observable<{ evidence_photos: string[] }> {
    return from(this.imageOptimization.filesToFormData(files, 'files')).pipe(
      switchMap((formData) =>
        this.api.post<{ evidence_photos: string[] }, FormData>(
          this.endpoint(`admin/violations/${id}/upload`),
          formData,
        ),
      ),
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
