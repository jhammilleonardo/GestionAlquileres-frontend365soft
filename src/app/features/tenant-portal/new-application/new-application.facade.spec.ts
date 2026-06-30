import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Property, PropertyStatus } from '../../../core/models/property.model';
import { PropertyService } from '../../../core/services/admin/property.service';
import { SlugService } from '../../../core/services/slug.service';
import { ReservationIntentionService } from '../../../core/services/tenant/reservation-intention.service';
import { ToastService } from '../../../shared/ui';
import { NewApplicationFacade } from './new-application.facade';

describe('NewApplicationFacade', () => {
  let facade: NewApplicationFacade;
  let propertyService: {
    getProperties: ReturnType<typeof vi.fn>;
    getPropertyById: ReturnType<typeof vi.fn>;
  };
  let slugService: { navigateTo: ReturnType<typeof vi.fn> };
  let reservationIntention: {
    getIntention: ReturnType<typeof vi.fn>;
    clearIntention: ReturnType<typeof vi.fn>;
  };
  let toast: { error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    propertyService = {
      getProperties: vi.fn().mockReturnValue(of([longProperty(), shortProperty(), bothProperty()])),
      getPropertyById: vi.fn().mockReturnValue(of(shortProperty())),
    };
    slugService = { navigateTo: vi.fn() };
    reservationIntention = {
      getIntention: vi.fn().mockReturnValue(null),
      clearIntention: vi.fn(),
    };
    toast = { error: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        NewApplicationFacade,
        { provide: PropertyService, useValue: propertyService },
        { provide: SlugService, useValue: slugService },
        { provide: ReservationIntentionService, useValue: reservationIntention },
        { provide: ToastService, useValue: toast },
        { provide: TranslocoService, useValue: { translate: (key: string) => key } },
      ],
    });

    facade = TestBed.inject(NewApplicationFacade);
  });

  it('carga propiedades y filtra por modalidad de alquiler', () => {
    facade.initialize();

    expect(facade.isLoading()).toBe(false);
    expect(facade.filteredProperties()).toHaveLength(3);

    facade.filters.rentalMode = 'SHORT_TERM';
    expect(facade.filteredProperties().map((property) => property.id)).toEqual([2, 3]);

    facade.filters.rentalMode = 'LONG_TERM';
    expect(facade.filteredProperties().map((property) => property.id)).toEqual([1, 3]);
  });

  it('calcula precio comparable para alquiler corto', () => {
    const property = shortProperty({ min_price_per_night: null });

    expect(facade.supportsShortTerm(property)).toBe(true);
    expect(facade.supportsLongTerm(property)).toBe(false);
    expect(facade.getShortTermPrice(property)).toBe(45);
  });

  it('abre reserva corta cargando detalle y unidad disponible', () => {
    facade.reserveShortTerm(shortProperty());

    expect(propertyService.getPropertyById).toHaveBeenCalledWith(2);
    expect(facade.isLoadingReservationProperty()).toBe(false);
    expect(facade.selectedReservationProperty()?.id).toBe(2);
    expect(facade.selectedReservationUnitId()).toBe(20);
  });

  it('restaura intención de reserva guardada', () => {
    reservationIntention.getIntention.mockReturnValue({
      propertyId: 2,
      propertyTitle: 'Studio',
      unitId: 20,
      unitNumber: 'A',
      checkinDate: '2026-06-10',
      checkoutDate: '2026-06-12',
      createdAt: Date.now(),
    });

    facade.initialize();

    expect(propertyService.getPropertyById).toHaveBeenCalledWith(2);
    expect(facade.initialReservationCheckin()).toBe('2026-06-10');
    expect(facade.initialReservationCheckout()).toBe('2026-06-12');
    expect(facade.selectedReservationUnitId()).toBe(20);
  });

  it('notifica errores al cargar propiedades', () => {
    propertyService.getProperties.mockReturnValue(throwError(() => new Error('fail')));

    facade.loadProperties();

    expect(facade.isLoading()).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('tenantApplications.marketplace.loadError');
  });

  it('navega al wizard de solicitud larga', () => {
    facade.applyLongTerm(longProperty());

    expect(slugService.navigateTo).toHaveBeenCalledWith(['portal', 'application-wizard', '1']);
  });

  it('no navega al wizard de solicitud larga para propiedades solo de corto plazo', () => {
    facade.applyLongTerm(shortProperty());

    expect(slugService.navigateTo).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('tenantApplications.marketplace.longTermUnavailable');
  });
});

function longProperty(overrides: Partial<Property> = {}): Property {
  return property({
    id: 1,
    title: 'Casa',
    rental_type: 'LONG_TERM',
    monthly_rent: 900,
    ...overrides,
  });
}

function shortProperty(overrides: Partial<Property> = {}): Property {
  return property({
    id: 2,
    title: 'Studio',
    rental_type: 'SHORT_TERM',
    min_price_per_night: 50,
    units: [
      {
        id: 20,
        unit_number: 'A',
        rental_type: 'SHORT_TERM',
        price_per_night: 45,
        cleaning_fee: 10,
        min_nights: 2,
      },
    ],
    ...overrides,
  });
}

function bothProperty(overrides: Partial<Property> = {}): Property {
  return property({
    id: 3,
    title: 'Loft',
    rental_type: 'BOTH',
    monthly_rent: 1200,
    min_price_per_night: 80,
    ...overrides,
  });
}

function property(overrides: Partial<Property>): Property {
  return {
    id: 1,
    title: 'Propiedad',
    property_type_id: 1,
    property_subtype_id: 1,
    status: PropertyStatus.DISPONIBLE,
    addresses: [
      {
        address_type: 'primary',
        street_address: 'Main St',
        city: 'Cochabamba',
        country: 'BO',
      },
    ],
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}
