import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AuditService } from './audit.service';
import { ApiClientService } from '../../http/api-client.service';
import { SlugService } from '../slug.service';

describe('AuditService', () => {
  let service: AuditService;
  let get: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    get = vi.fn().mockReturnValue(of({ data: [], total: 0, page: 1, limit: 20 }));
    TestBed.configureTestingModule({
      providers: [
        AuditService,
        { provide: ApiClientService, useValue: { get } },
        { provide: SlugService, useValue: { buildApiEndpoint: (p: string) => `acme/${p}` } },
      ],
    });
    service = TestBed.inject(AuditService);
  });

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
});
