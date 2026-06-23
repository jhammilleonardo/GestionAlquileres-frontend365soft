import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SlugService } from '../slug.service';
import { ReservationIntentionService } from './reservation-intention.service';

describe('ReservationIntentionService', () => {
  let service: ReservationIntentionService;
  let navigate: ReturnType<typeof vi.fn>;
  let setSlug: ReturnType<typeof vi.fn>;

  const validIntention = {
    propertyId: 10,
    propertyTitle: 'Casa Central',
    unitId: 20,
    unitNumber: 'A-1',
    checkinDate: '2026-07-10',
    checkoutDate: '2026-07-14',
  };

  beforeEach(() => {
    localStorage.clear();
    navigate = vi.fn().mockResolvedValue(true);
    setSlug = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        ReservationIntentionService,
        { provide: Router, useValue: { navigate } },
        { provide: SlugService, useValue: { setSlug } },
      ],
    });

    service = TestBed.inject(ReservationIntentionService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('guarda y expone una intención de reserva con fechas y unidad', () => {
    service.setIntention(validIntention);

    const stored = service.getIntention();
    expect(stored).toMatchObject(validIntention);
    expect(stored?.timestamp).toEqual(expect.any(String));
    expect(service.hasIntention()).toBe(true);
  });

  it('recupera una intención válida desde localStorage al iniciar', () => {
    localStorage.setItem(
      'reservation_intention',
      JSON.stringify({
        ...validIntention,
        timestamp: new Date().toISOString(),
      }),
    );
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ReservationIntentionService,
        { provide: Router, useValue: { navigate } },
        { provide: SlugService, useValue: { setSlug } },
      ],
    });

    const restored = TestBed.inject(ReservationIntentionService);

    expect(restored.getIntention()).toMatchObject(validIntention);
  });

  it('limpia una intención expirada', () => {
    const expired = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    localStorage.setItem(
      'reservation_intention',
      JSON.stringify({
        ...validIntention,
        timestamp: expired,
      }),
    );
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ReservationIntentionService,
        { provide: Router, useValue: { navigate } },
        { provide: SlugService, useValue: { setSlug } },
      ],
    });

    const restored = TestBed.inject(ReservationIntentionService);

    expect(restored.getIntention()).toBeNull();
    expect(localStorage.getItem('reservation_intention')).toBeNull();
  });

  it('navega al login del tenant conservando el contexto de reserva', () => {
    service.navigateToLogin('demo');

    expect(navigate).toHaveBeenCalledWith(['/', 'demo', 'login'], {
      queryParams: { reservation: 'true' },
    });
  });

  it('navega al checkout de la reserva pretendida con su propiedad y unidad', () => {
    service.setIntention(validIntention);
    service.navigateToReservation('demo');

    expect(setSlug).toHaveBeenCalledWith('demo');
    expect(navigate).toHaveBeenCalledWith(['/', 'demo', 'portal', 'reservar', 10, 20], {
      replaceUrl: true,
    });
  });

  it('cae a Mis Reservas si no hay intención al navegar', () => {
    service.navigateToReservation('demo');

    expect(navigate).toHaveBeenCalledWith(['/', 'demo', 'portal', 'reservas'], {
      replaceUrl: true,
    });
  });
});
