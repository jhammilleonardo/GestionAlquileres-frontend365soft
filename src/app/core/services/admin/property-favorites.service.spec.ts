import { TestBed } from '@angular/core/testing';

import { PropertyFavoritesService } from './property-favorites.service';

describe('PropertyFavoritesService', () => {
  let service: PropertyFavoritesService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(PropertyFavoritesService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('saves and loads favorite ids', () => {
    service.save(new Set([1, 2]));

    expect(Array.from(service.load())).toEqual([1, 2]);
  });

  it('ignores invalid stored values', () => {
    localStorage.setItem('property_favorites', '{"bad":true}');

    expect(Array.from(service.load())).toEqual([]);
  });
});
