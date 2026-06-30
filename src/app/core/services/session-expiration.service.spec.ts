import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { SessionExpirationService } from './session-expiration.service';
import { SessionTokenService } from './session-token.service';

describe('SessionExpirationService', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('limpia todas las sesiones y conserva la ruta de retorno', () => {
    const navigate = vi.fn(() => Promise.resolve(true));
    const clearAllTokens = vi.fn();
    const clearToken = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        SessionExpirationService,
        {
          provide: Router,
          useValue: { url: '/demo/propiedades', navigate },
        },
        {
          provide: SessionTokenService,
          useValue: { clearAllTokens, clearToken },
        },
      ],
    });
    localStorage.setItem('admin_user', '{"id":"1"}');
    sessionStorage.setItem('tenant_user', '{"id":2}');
    const service = TestBed.inject(SessionExpirationService);
    const expired = vi.fn();
    service.expired$.subscribe(expired);

    service.expire();

    expect(clearAllTokens).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('admin_user')).toBeNull();
    expect(sessionStorage.getItem('tenant_user')).toBeNull();
    expect(expired).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/demo/propiedades' },
      replaceUrl: true,
    });
  });

  it('limpia solo la sesión del contexto vencido', () => {
    const navigate = vi.fn(() => Promise.resolve(true));
    const clearAllTokens = vi.fn();
    const clearToken = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        SessionExpirationService,
        {
          provide: Router,
          useValue: { url: '/demo/vendor', navigate },
        },
        {
          provide: SessionTokenService,
          useValue: { clearAllTokens, clearToken },
        },
      ],
    });
    localStorage.setItem('admin_user', '{"id":"1"}');
    sessionStorage.setItem('tenant_user', '{"id":2}');
    sessionStorage.setItem('owner_user', '{"id":3}');
    sessionStorage.setItem('vendor_user', '{"id":4}');
    localStorage.setItem('tenant_slug', 'demo');
    const service = TestBed.inject(SessionExpirationService);
    const expired = vi.fn();
    service.expired$.subscribe(expired);

    service.expire('vendor');

    expect(clearToken).toHaveBeenCalledWith('vendor');
    expect(clearAllTokens).not.toHaveBeenCalled();
    expect(localStorage.getItem('admin_user')).toContain('"1"');
    expect(sessionStorage.getItem('tenant_user')).toContain('2');
    expect(sessionStorage.getItem('owner_user')).toContain('3');
    expect(sessionStorage.getItem('vendor_user')).toBeNull();
    expect(localStorage.getItem('tenant_slug')).toBe('demo');
    expect(expired).toHaveBeenCalledWith({ context: 'vendor' });
    expect(navigate).toHaveBeenCalledWith(['/', 'demo', 'vendor', 'login'], {
      queryParams: { returnUrl: '/demo/vendor' },
      replaceUrl: true,
    });
  });

  it('limpia una sesión vencida sin abandonar el portal público', () => {
    const navigate = vi.fn(() => Promise.resolve(true));
    const clearAllTokens = vi.fn();
    const clearToken = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        SessionExpirationService,
        {
          provide: Router,
          useValue: { url: '/demo/publico/propiedades/6', navigate },
        },
        {
          provide: SessionTokenService,
          useValue: { clearAllTokens, clearToken },
        },
      ],
    });
    localStorage.setItem('admin_user', '{"id":"1"}');
    const service = TestBed.inject(SessionExpirationService);

    service.expire();

    expect(clearAllTokens).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('admin_user')).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
  });
});
