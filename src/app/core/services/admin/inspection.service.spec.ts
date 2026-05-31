import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { InspectionService } from './inspection.service';
import { ApiClientService } from '../../http/api-client.service';
import { SlugService } from '../slug.service';
import { InspectionType, ItemCondition, InspectionArea } from '../../models/inspection.model';

describe('InspectionService', () => {
  let service: InspectionService;
  let get: ReturnType<typeof vi.fn>;
  let post: ReturnType<typeof vi.fn>;
  let patch: ReturnType<typeof vi.fn>;
  let httpGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    get = vi.fn().mockReturnValue(of([]));
    post = vi.fn().mockReturnValue(of({ id: 1 }));
    patch = vi.fn().mockReturnValue(of({ id: 1 }));
    httpGet = vi.fn().mockReturnValue(of(new Blob()));

    TestBed.configureTestingModule({
      providers: [
        InspectionService,
        { provide: ApiClientService, useValue: { get, post, patch } },
        { provide: HttpClient, useValue: { get: httpGet } },
        { provide: SlugService, useValue: { buildApiEndpoint: (p: string) => `acme/${p}` } },
      ],
    });
    service = TestBed.inject(InspectionService);
  });

  it('list pide las inspecciones con filtros', () => {
    service.list({ status: 'scheduled' }).subscribe();
    expect(get).toHaveBeenCalledWith('acme/admin/inspections', { params: { status: 'scheduled' } });
  });

  it('getById pide el detalle', () => {
    service.getById(4).subscribe();
    expect(get).toHaveBeenCalledWith('acme/admin/inspections/4');
  });

  it('create hace POST con el dto', () => {
    const dto = { property_id: 1, type: InspectionType.MOVE_IN, scheduled_date: '2026-05-01' };
    service.create(dto).subscribe();
    expect(post).toHaveBeenCalledWith('acme/admin/inspections', dto);
  });

  it('updateItems hace PATCH con items y bandera complete', () => {
    const items = [
      { area: InspectionArea.KITCHEN, item_name: 'Piso', condition: ItemCondition.GOOD },
    ];
    service.updateItems(4, items, true).subscribe();
    expect(patch).toHaveBeenCalledWith('acme/admin/inspections/4/items', { items, complete: true });
  });

  it('uploadItemPhotos envía FormData con item_id en params', () => {
    post.mockReturnValue(of({ photos: ['/x.png'] }));
    const file = new File(['x'], 'x.png', { type: 'image/png' });
    service.uploadItemPhotos(4, 9, [file]).subscribe();
    const call = post.mock.calls[0] as [string, unknown, { params?: unknown }];
    expect(call[0]).toBe('acme/admin/inspections/4/photos');
    expect(call[1]).toBeInstanceOf(FormData);
    expect(call[2].params).toEqual({ item_id: 9 });
  });

  it('compare pide la comparación con move_in y move_out', () => {
    service.compare(1, 2).subscribe();
    expect(get).toHaveBeenCalledWith('acme/admin/inspections/compare', {
      params: { move_in: 1, move_out: 2 },
    });
  });

  it('downloadPdf pide el blob', () => {
    service.downloadPdf(4).subscribe();
    expect(httpGet).toHaveBeenCalled();
    expect((httpGet.mock.calls[0][1] as { responseType?: string }).responseType).toBe('blob');
  });
});
