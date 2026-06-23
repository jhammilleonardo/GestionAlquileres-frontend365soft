import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type {
  AssignOwnerPropertyDto,
  CreateRentalOwnerDto,
  OwnerAssignedProperty,
  RentalOwner,
  RentalOwnerInvite,
  RentalOwnerMessage,
  RentalOwnerSummary,
  UpdateRentalOwnerDto,
} from '../../models/rental-owner.model';

@Injectable({ providedIn: 'root' })
export class RentalOwnersService {
  private http = inject(HttpClient);

  private base(slug: string): string {
    return `${environment.apiUrl}${slug}/admin/rental-owners`;
  }

  findAll(slug: string): Observable<RentalOwnerSummary[]> {
    return this.http.get<RentalOwnerSummary[]>(this.base(slug));
  }

  create(slug: string, dto: CreateRentalOwnerDto): Observable<RentalOwner> {
    return this.http.post<RentalOwner>(this.base(slug), dto);
  }

  update(slug: string, id: number, dto: UpdateRentalOwnerDto): Observable<RentalOwner> {
    return this.http.patch<RentalOwner>(`${this.base(slug)}/${id}`, dto);
  }

  deactivate(slug: string, id: number): Observable<RentalOwnerMessage> {
    return this.http.delete<RentalOwnerMessage>(`${this.base(slug)}/${id}`);
  }

  getProperties(slug: string, id: number): Observable<OwnerAssignedProperty[]> {
    return this.http.get<OwnerAssignedProperty[]>(`${this.base(slug)}/${id}/properties`);
  }

  assignProperty(slug: string, id: number, dto: AssignOwnerPropertyDto): Observable<unknown> {
    return this.http.post(`${this.base(slug)}/${id}/properties`, dto);
  }

  removeProperty(slug: string, id: number, propertyId: number): Observable<RentalOwnerMessage> {
    return this.http.delete<RentalOwnerMessage>(
      `${this.base(slug)}/${id}/properties/${propertyId}`,
    );
  }

  /**
   * Invita al propietario: asegura su cuenta y genera un enlace de un solo uso
   * para que defina su propia contraseña. Sirve para invitar o reenviar acceso.
   */
  invite(slug: string, id: number): Observable<RentalOwnerInvite> {
    return this.http.post<RentalOwnerInvite>(`${this.base(slug)}/${id}/invite`, {});
  }
}
