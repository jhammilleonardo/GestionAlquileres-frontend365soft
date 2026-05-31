import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { ViolationService } from './violation.service';
import { ApiClientService } from '../../http/api-client.service';
import { SlugService } from '../slug.service';
import { ViolationStatus, ViolationType } from '../../models/violation.model';

describe('ViolationService', () => {
  let service: ViolationService;
  let get: ReturnType<typeof vi.fn>;
  let post: ReturnType<typeof vi.fn>;
  let patch: ReturnType<typeof vi.fn>;
  let httpGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    get = vi.fn().mockReturnValue(of({ data: [], total: 0 }));
    post = vi.fn().mockReturnValue(of({ id: 1 }));
    patch = vi.fn().mockReturnValue(of({ id: 1 }));
    httpGet = vi.fn().mockReturnValue(of(new Blob()));

    TestBed.configureTestingModule({
      providers: [
        ViolationService,
        { provide: ApiClientService, useValue: { get, post, patch } },
        { provide: HttpClient, useValue: { get: httpGet } },
        { provide: SlugService, useValue: { buildApiEndpoint: (p: string) => `acme/${p}` } },
      ],
    });
    service = TestBed.inject(ViolationService);
  });

  it('list pide las violaciones con filtros', () => {
    service.list({ status: 'open' }).subscribe();
    expect(get).toHaveBeenCalledWith('acme/admin/violations', { params: { status: 'open' } });
  });

  it('create hace POST con el dto', () => {
    const dto = { property_id: 1, tenant_id: 2, type: ViolationType.NOISE, description: 'Ruido' };
    service.create(dto).subscribe();
    expect(post).toHaveBeenCalledWith('acme/admin/violations', dto);
  });

  it('updateStatus hace PATCH con estado y notas', () => {
    service.updateStatus(5, ViolationStatus.RESOLVED, 'Solucionado').subscribe();
    expect(patch).toHaveBeenCalledWith('acme/admin/violations/5/status', {
      status: ViolationStatus.RESOLVED,
      resolved_notes: 'Solucionado',
    });
  });

  it('notify hace POST al endpoint notify', () => {
    post.mockReturnValue(of({ message: 'ok' }));
    service.notify(5).subscribe();
    expect(post).toHaveBeenCalledWith('acme/admin/violations/5/notify', {});
  });

  it('uploadEvidence envía FormData con los archivos', () => {
    post.mockReturnValue(of({ evidence_photos: ['/a.png'] }));
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    service.uploadEvidence(5, [file]).subscribe();
    const call = post.mock.calls[0] as [string, unknown];
    expect(call[0]).toBe('acme/admin/violations/5/upload');
    expect(call[1]).toBeInstanceOf(FormData);
  });

  it('downloadPdf pide el blob por HttpClient', () => {
    service.downloadPdf(5).subscribe();
    expect(httpGet).toHaveBeenCalled();
    const opts = httpGet.mock.calls[0][1] as { responseType?: string };
    expect(opts.responseType).toBe('blob');
  });
});
