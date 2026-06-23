import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { WebsiteService, TenantWebsiteConfig } from './website.service';
import { ApiClientService } from '../../http/api-client.service';
import { SlugService } from '../slug.service';

describe('WebsiteService', () => {
  let service: WebsiteService;
  let get: ReturnType<typeof vi.fn>;
  let patch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    get = vi.fn().mockReturnValue(of({ is_published: false } as TenantWebsiteConfig));
    patch = vi.fn().mockReturnValue(of({ is_published: true } as TenantWebsiteConfig));
    TestBed.configureTestingModule({
      providers: [
        WebsiteService,
        { provide: ApiClientService, useValue: { get, patch } },
        { provide: SlugService, useValue: { buildApiEndpoint: (p: string) => `acme/${p}` } },
      ],
    });
    service = TestBed.inject(WebsiteService);
  });

  it('getConfig pide la configuración del sitio', () => {
    service.getConfig().subscribe();
    expect(get).toHaveBeenCalledWith('acme/admin/website');
  });

  it('update hace PATCH con el dto', () => {
    service.update({ company_description: 'Hola' }).subscribe();
    expect(patch).toHaveBeenCalledWith('acme/admin/website', { company_description: 'Hola' });
  });

  it('setPublished hace PATCH al endpoint publish con el estado deseado', () => {
    service.setPublished(true).subscribe();
    expect(patch).toHaveBeenCalledWith('acme/admin/website/publish', {
      published: true,
    });
  });
});
