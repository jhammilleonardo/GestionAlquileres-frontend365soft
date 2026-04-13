import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type {
  Employee,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  ModulePermission,
} from '../../models/employee.model';

@Injectable({ providedIn: 'root' })
export class EmployeesService {
  private http = inject(HttpClient);

  private base(slug: string): string {
    return `${environment.apiUrl}${slug}/admin/employees`;
  }

  findAll(slug: string): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.base(slug));
  }

  create(slug: string, dto: CreateEmployeeDto): Observable<Employee> {
    return this.http.post<Employee>(this.base(slug), dto);
  }

  update(slug: string, id: number, dto: UpdateEmployeeDto): Observable<Employee> {
    return this.http.patch<Employee>(`${this.base(slug)}/${id}`, dto);
  }

  updatePermissions(
    slug: string,
    id: number,
    permissions: ModulePermission[],
  ): Observable<Employee> {
    return this.http.patch<Employee>(`${this.base(slug)}/${id}/permissions`, { permissions });
  }

  remove(slug: string, id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base(slug)}/${id}`);
  }
}
