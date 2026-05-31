import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { UnitService } from './unit.service';
import { ApiClientService } from '../../http/api-client.service';
import { SlugService } from '../slug.service';
import { Unit } from '../../models/unit.model';

describe('UnitService', () => {
  let service: UnitService;
  let get: ReturnType<typeof vi.fn>;
  let post: ReturnType<typeof vi.fn>;
  let patch: ReturnType<typeof vi.fn>;
  let del: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    get = vi.fn().mockReturnValue(of([]));
    post = vi.fn().mockReturnValue(of({ id: 1 } as Unit));
    patch = vi.fn().mockReturnValue(of({ id: 1 } as Unit));
    del = vi.fn().mockReturnValue(of({ message: 'ok' }));

    TestBed.configureTestingModule({
      providers: [
        UnitService,
        { provide: ApiClientService, useValue: { get, post, patch, delete: del } },
        { provide: SlugService, useValue: { buildApiEndpoint: (p: string) => `acme/${p}` } },
      ],
    });
    service = TestBed.inject(UnitService);
  });

  it('findByProperty pide las unidades de una propiedad', () => {
    service.findByProperty(3).subscribe();
    expect(get).toHaveBeenCalledWith('acme/admin/properties/3/units');
  });

  it('create hace POST con el dto', () => {
    service.create(3, { unit_number: 'A1' }).subscribe();
    expect(post).toHaveBeenCalledWith('acme/admin/properties/3/units', { unit_number: 'A1' });
  });

  it('update hace PATCH a la unidad específica', () => {
    service.update(3, 7, { unit_number: 'B2' }).subscribe();
    expect(patch).toHaveBeenCalledWith('acme/admin/properties/3/units/7', { unit_number: 'B2' });
  });

  it('remove hace DELETE a la unidad específica', () => {
    service.remove(3, 7).subscribe();
    expect(del).toHaveBeenCalledWith('acme/admin/properties/3/units/7');
  });
});
