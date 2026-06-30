import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ReservationService, AvailabilityDay } from './reservation.service';
import { ApiClientService } from '../http/api-client.service';
import { SlugService } from './slug.service';

describe('ReservationService', () => {
  let service: ReservationService;
  let get: ReturnType<typeof vi.fn>;
  let post: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    get = vi.fn().mockReturnValue(of([] as AvailabilityDay[]));
    post = vi.fn().mockReturnValue(of({ id: 1 }));
    TestBed.configureTestingModule({
      providers: [
        ReservationService,
        { provide: ApiClientService, useValue: { get, post } },
        { provide: SlugService, useValue: { buildApiEndpoint: (p: string) => `acme/${p}` } },
      ],
    });
    service = TestBed.inject(ReservationService);
  });

  it('getAvailability pide la disponibilidad del mes con unidad', () => {
    service.getAvailability(3, '2026-05', 7).subscribe();
    expect(get).toHaveBeenCalledWith('acme/catalog/properties/3/availability', {
      params: { month: '2026-05', unit_id: 7 },
    });
  });

  it('getAvailability sin unidad solo envía el mes', () => {
    service.getAvailability(3, '2026-05').subscribe();
    expect(get).toHaveBeenCalledWith('acme/catalog/properties/3/availability', {
      params: { month: '2026-05' },
    });
  });

  it('createReservation hace POST con las fechas', () => {
    const dto = {
      property_id: 3,
      unit_id: 7,
      checkin_date: '2026-05-10',
      checkout_date: '2026-05-15',
    };
    service.createReservation(dto).subscribe();
    expect(post).toHaveBeenCalledWith('acme/tenant/reservations', dto, {
      headers: { 'Idempotency-Key': expect.any(String) as unknown as string },
    });
  });

  it('blockDates hace POST con fechas y bandera block', () => {
    post.mockReturnValue(of({ count: 2 }));
    service.blockDates(3, 7, ['2026-05-10', '2026-05-11'], true).subscribe();
    expect(post).toHaveBeenCalledWith('acme/admin/properties/3/units/7/block-dates', {
      dates: ['2026-05-10', '2026-05-11'],
      block: true,
    });
  });
});
