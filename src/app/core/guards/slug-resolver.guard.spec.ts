import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap } from '@angular/router';

import { slugResolverGuard } from './slug-resolver.guard';
import { SlugService } from '../services/slug.service';

describe('slugResolverGuard', () => {
  let setSlug: ReturnType<typeof vi.fn>;
  let currentSlug: string | null;

  function run(routeSlug: string | null, parentSlug: string | null = null) {
    const parent =
      parentSlug !== null
        ? ({
            paramMap: convertToParamMap({ slug: parentSlug }),
            parent: null,
          } as unknown as ActivatedRouteSnapshot)
        : null;

    const route = {
      paramMap: convertToParamMap(routeSlug !== null ? { slug: routeSlug } : {}),
      parent,
    } as unknown as ActivatedRouteSnapshot;

    return TestBed.runInInjectionContext(() => slugResolverGuard(route, {} as never));
  }

  beforeEach(() => {
    currentSlug = null;
    setSlug = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: SlugService, useValue: { getSlug: () => currentSlug, setSlug } }],
    });
  });

  it('fija el slug tomado de la URL y permite el acceso', () => {
    expect(run('acme')).toBe(true);
    expect(setSlug).toHaveBeenCalledWith('acme');
  });

  it('resuelve el slug desde una ruta ancestra', () => {
    expect(run(null, 'acme')).toBe(true);
    expect(setSlug).toHaveBeenCalledWith('acme');
  });

  it('no re-fija el slug si ya es el actual (evita recargas innecesarias)', () => {
    currentSlug = 'acme';
    expect(run('acme')).toBe(true);
    expect(setSlug).not.toHaveBeenCalled();
  });

  it('no bloquea aunque no haya slug en la URL', () => {
    expect(run(null)).toBe(true);
    expect(setSlug).not.toHaveBeenCalled();
  });

  it('ignora un slug con formato inválido (defensa contra inyección de ruta)', () => {
    for (const malformed of ['..', 'a', 'with/slash', 'UPPER', 'has space', 'sql;drop']) {
      expect(run(malformed)).toBe(true);
    }
    expect(setSlug).not.toHaveBeenCalled();
  });
});
