import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiClientService, QueryParams } from '../../http/api-client.service';
import { SlugService } from '../slug.service';
import {
  CreateVendorDto,
  UpdateVendorDto,
  Vendor,
  VendorHistoryItem,
} from '../../models/vendor.model';

@Injectable({ providedIn: 'root' })
export class VendorService {
  private readonly api = inject(ApiClientService);
  private readonly slugService = inject(SlugService);

  list(params: QueryParams = {}): Observable<Vendor[]> {
    return this.api
      .get<Vendor[]>(this.endpoint('admin/vendors'), { params })
      .pipe(map((vendors) => vendors.map((v) => this.normalize(v))));
  }

  getById(id: number): Observable<Vendor> {
    return this.api
      .get<Vendor>(this.endpoint(`admin/vendors/${id}`))
      .pipe(map((v) => this.normalize(v)));
  }

  getHistory(id: number): Observable<VendorHistoryItem[]> {
    return this.api.get<VendorHistoryItem[]>(this.endpoint(`admin/vendors/${id}/history`));
  }

  create(dto: CreateVendorDto): Observable<Vendor> {
    return this.api.post<Vendor, CreateVendorDto>(this.endpoint('admin/vendors'), dto);
  }

  update(id: number, dto: UpdateVendorDto): Observable<Vendor> {
    return this.api.patch<Vendor, UpdateVendorDto>(this.endpoint(`admin/vendors/${id}`), dto);
  }

  remove(id: number): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(this.endpoint(`admin/vendors/${id}`));
  }

  createAccount(id: number): Observable<{ email: string; temporaryPassword: string }> {
    return this.api.post<{ email: string; temporaryPassword: string }, object>(
      this.endpoint(`admin/vendors/${id}/account`),
      {},
    );
  }

  /** Los montos y el rating llegan como string desde Postgres numeric. */
  private normalize(vendor: Vendor): Vendor {
    return {
      ...vendor,
      average_rating: this.toNumber(vendor.average_rating),
      total_orders: this.toNumber(vendor.total_orders),
      rate_per_hour: this.toNumber(vendor.rate_per_hour),
      rate_flat: this.toNumber(vendor.rate_flat),
    };
  }

  private toNumber(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private endpoint(path: string): string {
    return this.slugService.buildApiEndpoint(path);
  }
}
