import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslocoService } from '@jsverse/transloco';

import { SlugService } from './slug.service';

describe('SlugService', () => {
  let service: SlugService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        SlugService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TranslocoService, useValue: { translate: (k: string) => k } },
      ],
    });
    service = TestBed.inject(SlugService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Drenar cualquier validación de tenant pendiente
    httpMock.match(() => true).forEach((req) => req.flush({}));
    httpMock.verify();
  });

  it('getSlug devuelve null si no se ha seteado', () => {
    expect(service.getSlug()).toBeNull();
  });

  it('setSlug actualiza el slug actual', () => {
    service.setSlug('acme');
    expect(service.getSlug()).toBe('acme');
  });

  describe('buildUrl', () => {
    it('antepone el slug a la ruta', () => {
      service.setSlug('acme');
      expect(service.buildUrl('/contratos')).toBe('/acme/contratos');
    });

    it('normaliza rutas sin slash inicial', () => {
      service.setSlug('acme');
      expect(service.buildUrl('contratos')).toBe('/acme/contratos');
    });

    it('devuelve la ruta sin cambios si no hay slug', () => {
      expect(service.buildUrl('/contratos')).toBe('/contratos');
    });
  });

  describe('buildApiEndpoint', () => {
    it('antepone el slug al endpoint', () => {
      service.setSlug('acme');
      expect(service.buildApiEndpoint('admin/contracts')).toBe('acme/admin/contracts');
    });

    it('no duplica el slug si el endpoint ya lo incluye', () => {
      service.setSlug('acme');
      expect(service.buildApiEndpoint('acme/admin/contracts')).toBe('acme/admin/contracts');
    });

    it('devuelve el endpoint sin cambios si no hay slug', () => {
      expect(service.buildApiEndpoint('admin/contracts')).toBe('admin/contracts');
    });
  });

  it('clearSlug limpia el slug actual', () => {
    service.setSlug('acme');
    service.clearSlug();
    expect(service.getSlug()).toBeNull();
  });
});
