import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EmployeesService } from '../../core/services/admin/employees.service';
import { environment } from '../../../environments/environment';
import type { Employee, ModulePermission } from '../../core/models/employee.model';
import { mergePermissions } from '../../core/models/employee.model';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const SLUG = 'empresa-test';
const BASE = `${environment.apiUrl}${SLUG}/admin/employees`;

const mockEmployee: Employee = {
  id: 1,
  name: 'Ana García',
  email: 'ana@empresa.com',
  role: 'EMPLEADO',
  is_active: true,
  last_connection: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  permissions: [
    { module: 'properties', can_view: true, can_create: false, can_edit: false, can_delete: false },
  ],
};

// ─── EmployeesService HTTP tests ──────────────────────────────────────────────

describe('EmployeesService', () => {
  let service: EmployeesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), EmployeesService],
    });
    service = TestBed.inject(EmployeesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('findAll — hace GET al endpoint correcto', () => {
    service.findAll(SLUG).subscribe();
    const req = httpMock.expectOne(BASE);
    expect(req.request.method).toBe('GET');
    req.flush([mockEmployee]);
  });

  it('create — hace POST con el body correcto', () => {
    const dto = { name: 'Luis Paz', email: 'luis@empresa.com', password: 'pass123' };
    service.create(SLUG, dto).subscribe();

    const req = httpMock.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush({ ...mockEmployee, ...dto, id: 2 });
  });

  it('updatePermissions — hace PATCH a /:id/permissions con el body correcto', () => {
    const permissions: ModulePermission[] = [
      {
        module: 'properties',
        can_view: true,
        can_create: true,
        can_edit: false,
        can_delete: false,
      },
      {
        module: 'payments',
        can_view: false,
        can_create: false,
        can_edit: false,
        can_delete: false,
      },
    ];

    service.updatePermissions(SLUG, mockEmployee.id, permissions).subscribe();

    const req = httpMock.expectOne(`${BASE}/${mockEmployee.id}/permissions`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ permissions });
    req.flush({ ...mockEmployee, permissions });
  });

  it('updatePermissions — la URL incluye el id correcto', () => {
    const targetId = 42;
    service.updatePermissions(SLUG, targetId, []).subscribe();

    const req = httpMock.expectOne(`${BASE}/${targetId}/permissions`);
    expect(req.request.url).toContain(`/employees/${targetId}/permissions`);
    req.flush({ ...mockEmployee, id: targetId });
  });

  it('remove — hace DELETE a /:id', () => {
    service.remove(SLUG, mockEmployee.id).subscribe();

    const req = httpMock.expectOne(`${BASE}/${mockEmployee.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Empleado desactivado' });
  });

  it('update — hace PATCH a /:id con is_active', () => {
    service.update(SLUG, mockEmployee.id, { is_active: true }).subscribe();

    const req = httpMock.expectOne(`${BASE}/${mockEmployee.id}`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ is_active: true });
    req.flush({ ...mockEmployee, is_active: true });
  });
});

// ─── mergePermissions unit tests ─────────────────────────────────────────────

describe('mergePermissions', () => {
  it('completa módulos faltantes con defaults en false', () => {
    const existing: ModulePermission[] = [
      {
        module: 'properties',
        can_view: true,
        can_create: true,
        can_edit: false,
        can_delete: false,
      },
    ];

    const merged = mergePermissions(existing);

    const props = merged.find((p) => p.module === 'properties');
    expect(props?.can_view).toBe(true);
    expect(props?.can_create).toBe(true);

    const payments = merged.find((p) => p.module === 'payments');
    expect(payments?.can_view).toBe(false);
    expect(payments?.can_create).toBe(false);
  });

  it('devuelve un permiso por cada módulo de PERMISSION_MODULES', () => {
    const merged = mergePermissions([]);
    // Debe tener al menos los 7 módulos implementados
    expect(merged.length).toBeGreaterThanOrEqual(7);
    const modules = merged.map((p) => p.module);
    expect(modules).toContain('properties');
    expect(modules).toContain('maintenance');
    expect(modules).toContain('employees');
  });

  it('no muta los permisos existentes', () => {
    const existing: ModulePermission[] = [
      { module: 'payments', can_view: true, can_create: true, can_edit: true, can_delete: true },
    ];
    const merged = mergePermissions(existing);
    const payments = merged.find((p) => p.module === 'payments');
    expect(payments).toEqual(existing[0]);
  });
});
