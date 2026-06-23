import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../../../environments/environment';
import { CreateApplicationDto } from '../../models/application.model';
import { SessionTokenService } from '../session-token.service';
import { SlugService } from '../slug.service';
import { ApplicationService } from './application.service';

describe('ApplicationService', () => {
  let service: ApplicationService;
  let httpMock: HttpTestingController;
  let sessionToken: SessionTokenService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        ApplicationService,
        SessionTokenService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: SlugService,
          useValue: {
            buildApiEndpoint: (endpoint: string) => `demo/${endpoint}`,
          },
        },
      ],
    });

    service = TestBed.inject(ApplicationService);
    httpMock = TestBed.inject(HttpTestingController);
    sessionToken = TestBed.inject(SessionTokenService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('usa token tenant al crear una solicitud aunque exista token admin', () => {
    sessionToken.setToken('admin', 'admin-token');
    sessionToken.setToken('tenant', 'tenant-token');

    const payload = {
      property_id: 1,
      personal_data: {
        full_name: 'Tenant Demo',
        phone: '70000000',
        identity_document: '12345678',
        current_address: 'Demo street',
      },
      employment_data: {
        employer_name: 'Demo SRL',
        position: 'Analyst',
        monthly_income: 5000,
        employment_duration: '2026-01-01',
        employer_phone: '70000001',
      },
      rental_history: [],
      references: [],
    } as unknown as CreateApplicationDto;

    service.createApplication(payload).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}demo/applications`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe('Bearer tenant-token');
    req.flush({ id: 1 });
  });

  it('usa token tenant para consultar solicitudes propias', () => {
    sessionToken.setToken('admin', 'admin-token');
    sessionToken.setToken('tenant', 'tenant-token');

    service.getMyApplications().subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}demo/applications/my-applications`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer tenant-token');
    req.flush([]);
  });

  it('no envia Authorization vacio cuando la sesion usa cookie HttpOnly', () => {
    sessionToken.setToken('admin', 'admin-token');

    service.getMyApplications().subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}demo/applications/my-applications`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('mantiene endpoints admin sin token tenant explicito', () => {
    sessionToken.setToken('tenant', 'tenant-token');

    service.getAllApplications().subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}demo/applications`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });
});
