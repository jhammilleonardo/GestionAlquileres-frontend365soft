import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

import { PermissionsService, type MyPermissions } from './permissions.service';
import { SlugService } from './slug.service';
import { SessionTokenService } from './session-token.service';
import { environment } from '../../../environments/environment';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let httpMock: HttpTestingController;
  // Token de admin simulado; null = sin sesión admin (portal público, inquilino…).
  let adminToken: string | null;

  function configure(): void {
    TestBed.configureTestingModule({
      providers: [
        PermissionsService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SlugService, useValue: { getSlug: () => 'acme' } },
        { provide: SessionTokenService, useValue: { getToken: () => adminToken } },
        { provide: Router, useValue: { events: new Subject() } },
      ],
    });
    service = TestBed.inject(PermissionsService);
    httpMock = TestBed.inject(HttpTestingController);
  }

  function setup(): void {
    adminToken = 'admin-token';
    configure();
    // El constructor dispara un fetch inicial; lo respondemos vacío por defecto.
    flushInitial();
  }

  function flushInitial(perms: MyPermissions | null = null): void {
    const req = httpMock.expectOne(`${environment.apiUrl}acme/admin/employees/my-permissions`);
    req.flush(perms);
  }

  beforeEach(() => {
    adminToken = null;
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    httpMock.match(() => true).forEach((r) => r.flush(null));
    httpMock.verify();
  });

  it('no llama al endpoint admin si no hay token de admin (portal público)', () => {
    adminToken = null;
    configure();

    // Sin token admin no debe haber ninguna petición a my-permissions.
    httpMock.expectNone(`${environment.apiUrl}acme/admin/employees/my-permissions`);
    expect(service.permissions()).toBeNull();
    expect(service.canView('properties')).toBe(false);
  });

  it('canView devuelve false si no hay permisos cargados', () => {
    setup();
    expect(service.canView('properties')).toBe(false);
  });

  it('ADMIN puede ver cualquier módulo', () => {
    setup();
    service.load();
    httpMock
      .expectOne(`${environment.apiUrl}acme/admin/employees/my-permissions`)
      .flush({ role: 'ADMIN', allowedModules: [] } satisfies MyPermissions);

    expect(service.canView('properties')).toBe(true);
    expect(service.canView('payments')).toBe(true);
  });

  it('EMPLEADO solo puede ver módulos asignados', () => {
    setup();
    service.load();
    httpMock
      .expectOne(`${environment.apiUrl}acme/admin/employees/my-permissions`)
      .flush({ role: 'EMPLEADO', allowedModules: ['properties'] } satisfies MyPermissions);

    expect(service.canView('properties')).toBe(true);
    expect(service.canView('payments')).toBe(false);
  });

  it('clear reinicia los permisos a null', () => {
    setup();
    service.load();
    httpMock
      .expectOne(`${environment.apiUrl}acme/admin/employees/my-permissions`)
      .flush({ role: 'ADMIN', allowedModules: [] } satisfies MyPermissions);

    service.clear();
    expect(service.permissions()).toBeNull();
    expect(service.canView('properties')).toBe(false);
  });

  it('expone role y allowedModules como computed', () => {
    setup();
    service.load();
    httpMock.expectOne(`${environment.apiUrl}acme/admin/employees/my-permissions`).flush({
      role: 'EMPLEADO',
      allowedModules: ['contracts', 'payments'],
    } satisfies MyPermissions);

    expect(service.role()).toBe('EMPLEADO');
    expect(service.allowedModules()).toEqual(['contracts', 'payments']);
  });

  it('usa permisos completos para ADMIN si el endpoint falla', () => {
    localStorage.setItem('admin_user', JSON.stringify({ role: 'ADMIN' }));
    adminToken = 'admin-token';
    configure();

    httpMock
      .expectOne(`${environment.apiUrl}acme/admin/employees/my-permissions`)
      .flush({ message: 'error' }, { status: 500, statusText: 'Server error' });

    expect(service.role()).toBe('ADMIN');
    expect(service.canView('properties')).toBe(true);
    expect(service.canView('payments')).toBe(true);
  });
});
