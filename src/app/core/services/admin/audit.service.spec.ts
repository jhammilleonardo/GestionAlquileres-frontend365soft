import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AuditService } from './audit.service';
import { ApiClientService } from '../../http/api-client.service';
import { SlugService } from '../slug.service';
import { environment } from '../../../../environments/environment';

describe('AuditService', () => {
  let service: AuditService;
  let httpMock: HttpTestingController;
  let get: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    get = vi.fn().mockReturnValue(of({ data: [], total: 0, page: 1, limit: 20 }));
    TestBed.configureTestingModule({
      providers: [
        AuditService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ApiClientService, useValue: { get } },
        { provide: SlugService, useValue: { buildApiEndpoint: (p: string) => `acme/${p}` } },
      ],
    });
    service = TestBed.inject(AuditService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('list pide los registros con los filtros pasados', () => {
    service.list({ action: 'created', page: 2, limit: 20 }).subscribe();
    expect(get).toHaveBeenCalledWith('acme/admin/audit-logs', {
      params: { action: 'created', page: 2, limit: 20 },
    });
  });

  it('list sin filtros usa params vacíos', () => {
    service.list().subscribe();
    expect(get).toHaveBeenCalledWith('acme/admin/audit-logs', { params: {} });
  });

  it('exportCsv descarga un blob desde el endpoint de export con filtros', () => {
    service.exportCsv({ action: 'created', entity_type: '' }).subscribe();

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${environment.apiUrl}acme/admin/audit-logs/export` &&
        r.params.get('action') === 'created',
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    // Los valores vacíos no se envían como parámetro.
    expect(req.request.params.has('entity_type')).toBe(false);
    req.flush(new Blob(['csv']));
  });
});
