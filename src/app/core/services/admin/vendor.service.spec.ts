import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { VendorService } from './vendor.service';
import { ApiClientService } from '../../http/api-client.service';
import { SlugService } from '../slug.service';
import { Vendor, VendorSpecialty } from '../../models/vendor.model';

describe('VendorService', () => {
  let service: VendorService;
  let get: ReturnType<typeof vi.fn>;
  let post: ReturnType<typeof vi.fn>;
  let patch: ReturnType<typeof vi.fn>;
  let del: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    get = vi.fn().mockReturnValue(of([]));
    post = vi.fn().mockReturnValue(of({ id: 1 }));
    patch = vi.fn().mockReturnValue(of({ id: 1 }));
    del = vi.fn().mockReturnValue(of({ message: 'ok' }));

    TestBed.configureTestingModule({
      providers: [
        VendorService,
        { provide: ApiClientService, useValue: { get, post, patch, delete: del } },
        { provide: SlugService, useValue: { buildApiEndpoint: (p: string) => `acme/${p}` } },
      ],
    });
    service = TestBed.inject(VendorService);
  });

  it('list normaliza rating y montos string a número', () => {
    get.mockReturnValue(
      of([
        {
          id: 1,
          name: 'A',
          specialty: VendorSpecialty.PLUMBING,
          average_rating: '4.5',
          total_orders: '3',
          rate_per_hour: '20.00',
          rate_flat: null,
        },
      ] as unknown as Vendor[]),
    );

    let result: Vendor[] = [];
    service.list().subscribe((v) => (result = v));

    expect(get).toHaveBeenCalledWith('acme/admin/vendors', { params: {} });
    expect(result[0].average_rating).toBe(4.5);
    expect(result[0].total_orders).toBe(3);
    expect(result[0].rate_per_hour).toBe(20);
    expect(result[0].rate_flat).toBeNull();
  });

  it('getById pide el proveedor por id', () => {
    get.mockReturnValue(of({ id: 7, name: 'X', specialty: VendorSpecialty.GENERAL } as Vendor));
    service.getById(7).subscribe();
    expect(get).toHaveBeenCalledWith('acme/admin/vendors/7');
  });

  it('getHistory pide el historial de órdenes', () => {
    service.getHistory(7).subscribe();
    expect(get).toHaveBeenCalledWith('acme/admin/vendors/7/history');
  });

  it('create hace POST con el dto', () => {
    const dto = { name: 'Nuevo', specialty: VendorSpecialty.ELECTRICAL };
    service.create(dto).subscribe();
    expect(post).toHaveBeenCalledWith('acme/admin/vendors', dto);
  });

  it('update hace PATCH al proveedor', () => {
    service.update(7, { name: 'Editado' }).subscribe();
    expect(patch).toHaveBeenCalledWith('acme/admin/vendors/7', { name: 'Editado' });
  });

  it('remove hace DELETE al proveedor', () => {
    service.remove(7).subscribe();
    expect(del).toHaveBeenCalledWith('acme/admin/vendors/7');
  });
});
