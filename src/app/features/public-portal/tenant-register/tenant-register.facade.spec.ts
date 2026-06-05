import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { environment } from '../../../../environments/environment';
import { SlugService } from '../../../core/services/slug.service';
import { ApplicationIntentionService } from '../../../core/services/tenant/application-intention.service';
import { ReservationIntentionService } from '../../../core/services/tenant/reservation-intention.service';
import { TenantAuthService } from '../../../core/services/tenant/tenant-auth.service';
import { TenantRegisterFacade } from './tenant-register.facade';

describe('TenantRegisterFacade', () => {
  let facade: TenantRegisterFacade;
  let httpMock: HttpTestingController;
  let router: { navigate: ReturnType<typeof vi.fn> };
  let slugService: { setSlug: ReturnType<typeof vi.fn> };
  let applicationIntention: {
    hasIntention: ReturnType<typeof vi.fn>;
    navigateToApplication: ReturnType<typeof vi.fn>;
  };
  let reservationIntention: {
    hasIntention: ReturnType<typeof vi.fn>;
    navigateToReservation: ReturnType<typeof vi.fn>;
  };
  let tenantAuth: { setSessionFromToken: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    router = { navigate: vi.fn().mockResolvedValue(true) };
    slugService = { setSlug: vi.fn() };
    applicationIntention = {
      hasIntention: vi.fn().mockReturnValue(false),
      navigateToApplication: vi.fn(),
    };
    reservationIntention = {
      hasIntention: vi.fn().mockReturnValue(false),
      navigateToReservation: vi.fn(),
    };
    tenantAuth = { setSessionFromToken: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        TenantRegisterFacade,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
        { provide: SlugService, useValue: slugService },
        { provide: ApplicationIntentionService, useValue: applicationIntention },
        { provide: ReservationIntentionService, useValue: reservationIntention },
        { provide: TenantAuthService, useValue: tenantAuth },
        {
          provide: TranslocoService,
          useValue: {
            translate: (key: string, params?: Record<string, string>) =>
              params?.['slug'] ? `${key}:${params['slug']}` : key,
          },
        },
      ],
    });

    facade = TestBed.inject(TenantRegisterFacade);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    vi.useRealTimers();
    httpMock.verify();
  });

  it('rechaza slugs vacios o reservados', () => {
    facade.initialize(null);
    expect(facade.errorMessage()).toBe('public.tenantRegister.invalidSlugError');

    facade.initialize('admin');
    expect(facade.slug()).toBeNull();
    expect(facade.errorMessage()).toBe('public.tenantRegister.reservedSlugError:admin');
  });

  it('registra, guarda token y redirige segun intencion autenticada', () => {
    vi.useFakeTimers();
    reservationIntention.hasIntention.mockReturnValue(true);
    facade.initialize('demo');
    fillValidForm(facade);

    facade.submit();

    const req = httpMock.expectOne(`${environment.apiUrl}auth/demo/register`);
    expect(req.request.method).toBe('POST');
    req.flush(registerResponse({ access_token: 'tenant-token' }));

    expect(slugService.setSlug).toHaveBeenCalledWith('demo');
    expect(tenantAuth.setSessionFromToken).toHaveBeenCalledWith(
      'tenant-token',
      expect.objectContaining({ email: 'ana@test.com' }),
      'demo',
    );
    expect(facade.successMessage()).toBe('public.tenantRegister.redirectingMsg');

    vi.advanceTimersByTime(1000);

    expect(reservationIntention.navigateToReservation).toHaveBeenCalledWith('demo');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('redirige a login cuando el backend no devuelve token', () => {
    vi.useFakeTimers();
    facade.initialize('demo');
    fillValidForm(facade);

    facade.submit();

    const req = httpMock.expectOne(`${environment.apiUrl}auth/demo/register`);
    req.flush(registerResponse());

    expect(facade.successMessage()).toBe('public.tenantRegister.loginReadyMsg');

    vi.advanceTimersByTime(2000);

    expect(router.navigate).toHaveBeenCalledWith(['/', 'demo', 'login'], {
      queryParams: { registered: 'true' },
      replaceUrl: true,
    });
  });

  it('muestra error normalizado cuando falla el registro', () => {
    facade.initialize('demo');
    fillValidForm(facade);

    facade.submit();

    const req = httpMock.expectOne(`${environment.apiUrl}auth/demo/register`);
    req.flush({ message: 'Correo ya existe' }, { status: 409, statusText: 'Conflict' });

    expect(facade.isLoading()).toBe(false);
    expect(facade.errorMessage()).toBe('Correo ya existe');
  });
});

function fillValidForm(facade: TenantRegisterFacade): void {
  facade.registerForm.setValue({
    name: 'Ana Test',
    email: 'ana@test.com',
    phone: '+59170000000',
    password: 'secret1',
    confirmPassword: 'secret1',
  });
}

function registerResponse(overrides: Partial<{ access_token: string }> = {}) {
  return {
    id: 1,
    name: 'Ana Test',
    email: 'ana@test.com',
    role: 'TENANT',
    phone: '+59170000000',
    tenant_id: 1,
    created_at: '2026-06-04T00:00:00.000Z',
    ...overrides,
  };
}
