import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PropertyService } from './property.service';
import { ApiHttpService } from '../api-http.service';
import { SlugService } from '../slug.service';
import { of } from 'rxjs';
import { PropertyStatus } from '../../../models/property.model';

describe('PropertyService Helpers', () => {
  let service: PropertyService;
  let apiHttpMock: any;
  let slugServiceMock: any;

  beforeEach(() => {
    apiHttpMock = {
      get: vi.fn(),
      post: vi.fn()
    };
    slugServiceMock = {
      buildApiEndpoint: vi.fn((path) => `soft-prueba/${path}`),
      getSlug: vi.fn(() => 'soft-prueba')
    };

    TestBed.configureTestingModule({
      providers: [
        PropertyService,
        { provide: ApiHttpService, useValue: apiHttpMock },
        { provide: SlugService, useValue: slugServiceMock }
      ]
    });
    service = TestBed.inject(PropertyService);
  });

  const mockProperty = {
    id: 1,
    title: 'Test Property',
    images: ['/uploads/img1.jpg'],
    addresses: [{ street_address: 'Calle 1', city: 'La Paz' }],
    monthly_rent: 1000,
    currency: 'USD',
    square_meters: 100,
    property_type: { name: 'Casa' }
  } as any;

  it('should build image URL correctly', () => {
    const url = service.getPropertyImageUrl(mockProperty);
    expect(url).toBe('http://localhost:3000/uploads/img1.jpg');
  });

  it('should format address correctly', () => {
    const addr = service.getPropertyAddress(mockProperty);
    expect(addr).toBe('Calle 1, La Paz');
  });

  it('should format price correctly', () => {
    const price = service.getPropertyPrice(mockProperty);
    // Node.js toLocaleString might not include commas depending on environment
    expect(price.replace(/,/g, '')).toBe('USD 1000');
  });

  it('should format area correctly', () => {
    const area = service.getPropertyArea(mockProperty);
    expect(area).toBe('100 m²');
  });
});
