import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiHttpService } from '../api-http.service';
import { SlugService } from '../slug.service';
import { Unit, UnitFormData } from '../../models/unit.model';

@Injectable({ providedIn: 'root' })
export class UnitService {
  private apiHttp = inject(ApiHttpService);
  private slugService = inject(SlugService);

  private endpoint(propertyId: number, suffix = ''): string {
    return this.slugService.buildApiEndpoint(`admin/properties/${propertyId}/units${suffix}`);
  }

  findByProperty(propertyId: number): Observable<Unit[]> {
    return this.apiHttp.get<Unit[]>(this.endpoint(propertyId));
  }

  create(propertyId: number, dto: Partial<UnitFormData>): Observable<Unit> {
    return this.apiHttp.post<Unit>(this.endpoint(propertyId), dto);
  }

  update(propertyId: number, unitId: number, dto: Partial<UnitFormData>): Observable<Unit> {
    return this.apiHttp.patch<Unit>(this.endpoint(propertyId, `/${unitId}`), dto);
  }

  remove(propertyId: number, unitId: number): Observable<{ message: string }> {
    return this.apiHttp.delete<{ message: string }>(this.endpoint(propertyId, `/${unitId}`));
  }
}
