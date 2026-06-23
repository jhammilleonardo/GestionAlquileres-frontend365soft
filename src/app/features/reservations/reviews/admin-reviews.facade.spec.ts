import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ReservationAdminService } from '../../../core/services/admin/reservation-admin.service';
import { PropertyService } from '../../../core/services/admin/property.service';
import { AdminReview } from '../../../core/models/reservation-admin.model';
import { AdminReviewsFacade } from './admin-reviews.facade';

function makeReview(rating: number): AdminReview {
  return {
    id: rating,
    reservation_id: 1,
    property_id: 3,
    unit_id: 7,
    rating,
    comment: 'ok',
    created_at: '2026-06-01',
    property_name: 'Casa',
    unit_number: 'A1',
    guest_name: 'Ana',
  };
}

describe('AdminReviewsFacade', () => {
  let service: { listReviews: ReturnType<typeof vi.fn> };
  let facade: AdminReviewsFacade;

  beforeEach(() => {
    service = { listReviews: vi.fn(() => of([makeReview(5), makeReview(4)])) };

    TestBed.configureTestingModule({
      providers: [
        AdminReviewsFacade,
        { provide: ReservationAdminService, useValue: service },
        {
          provide: PropertyService,
          useValue: { getAdminProperties: vi.fn(() => of([{ id: 3, title: 'Casa' }])) },
        },
      ],
    });
    facade = TestBed.inject(AdminReviewsFacade);
  });

  it('carga reseñas y opciones de propiedad al iniciar', () => {
    expect(facade.reviews()).toHaveLength(2);
    expect(facade.isLoading()).toBe(false);
    expect(facade.propertyOptions().length).toBe(2); // "todas" + 1
  });

  it('calcula el promedio de las reseñas', () => {
    expect(facade.average()).toBe(4.5);
  });

  it('filtra por propiedad al cambiar el select (auto-apply)', async () => {
    service.listReviews.mockClear();
    facade.filterForm.setValue({ property_id: 3 });
    await vi.waitFor(() => {
      expect(service.listReviews).toHaveBeenCalledWith(3);
    });
  });

  it('mapea las estrellas según el rating', () => {
    expect(facade.stars(3)).toEqual([true, true, true, false, false]);
  });
});
