import {
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
  HttpHandlerFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Subject, firstValueFrom, of, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SessionExpirationService } from '../services/session-expiration.service';
import { SessionTokenService } from '../services/session-token.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  const originalApiUrl = environment.apiUrl;
  let expiration: {
    hasClientSession: ReturnType<typeof vi.fn>;
    expire: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    expiration = {
      hasClientSession: vi.fn(() => true),
      expire: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SessionTokenService,
          useValue: { getTokenForRequest: vi.fn(() => null) },
        },
        { provide: SessionExpirationService, useValue: expiration },
      ],
    });
    document.cookie = 'csrf_token=csrf-current; path=/';
  });

  afterEach(() => {
    environment.apiUrl = originalApiUrl;
  });

  function execute(req: HttpRequest<unknown>, next: HttpHandlerFn) {
    return TestBed.runInInjectionContext(() => authInterceptor(req, next));
  }

  it('renueva la cookie y reintenta una petición que devuelve 401', async () => {
    let protectedAttempts = 0;
    const next = vi.fn((request: HttpRequest<unknown>) => {
      if (request.url === `${environment.apiUrl}auth/refresh`) {
        return of(new HttpResponse({ body: { success: true } }));
      }

      protectedAttempts += 1;
      return protectedAttempts === 1
        ? throwError(() => new HttpErrorResponse({ status: 401 }))
        : of(new HttpResponse({ body: { ok: true } }));
    }) as HttpHandlerFn;

    await firstValueFrom(
      execute(new HttpRequest('GET', `${environment.apiUrl}demo/admin/properties`), next),
    );

    expect(protectedAttempts).toBe(2);
    const refreshRequest = (next as ReturnType<typeof vi.fn>).mock
      .calls[1][0] as HttpRequest<unknown>;
    expect(refreshRequest.withCredentials).toBe(true);
    expect(refreshRequest.headers.get('X-CSRF-Token')).toBe('csrf-current');
    expect(refreshRequest.headers.get('X-Auth-Context')).toBe('admin');
    expect(expiration.expire).not.toHaveBeenCalled();
  });

  it('espera la respuesta final del refresh antes de reintentar', async () => {
    const refreshResult = new Subject<HttpEvent<unknown>>();
    let protectedAttempts = 0;
    const next = vi.fn((request: HttpRequest<unknown>) => {
      if (request.url === `${environment.apiUrl}auth/refresh`) {
        return refreshResult.asObservable();
      }

      protectedAttempts += 1;
      return protectedAttempts === 1
        ? throwError(() => new HttpErrorResponse({ status: 401 }))
        : of(new HttpResponse({ body: { ok: true } }));
    }) as HttpHandlerFn;

    const request = firstValueFrom(
      execute(new HttpRequest('GET', `${environment.apiUrl}demo/admin/vendors`), next),
    );

    refreshResult.next({ type: HttpEventType.Sent });
    await Promise.resolve();
    expect(protectedAttempts).toBe(1);

    refreshResult.next(new HttpResponse({ body: { success: true } }));
    refreshResult.complete();
    await request;

    expect(protectedAttempts).toBe(2);
    expect(expiration.expire).not.toHaveBeenCalled();
  });

  it('comparte una única renovación entre peticiones concurrentes', async () => {
    const refreshResult = new Subject<HttpEvent<unknown>>();
    const attempts = new Map<string, number>();
    let refreshCalls = 0;
    const next = vi.fn((request: HttpRequest<unknown>) => {
      if (request.url === `${environment.apiUrl}auth/refresh`) {
        refreshCalls += 1;
        return refreshResult.asObservable();
      }

      const count = (attempts.get(request.url) ?? 0) + 1;
      attempts.set(request.url, count);
      return count === 1
        ? throwError(() => new HttpErrorResponse({ status: 401 }))
        : of(new HttpResponse({ body: { ok: true } }));
    }) as HttpHandlerFn;

    const first = firstValueFrom(
      execute(new HttpRequest('GET', `${environment.apiUrl}demo/properties`), next),
    );
    const second = firstValueFrom(
      execute(new HttpRequest('GET', `${environment.apiUrl}demo/payments`), next),
    );

    expect(refreshCalls).toBe(1);
    refreshResult.next(new HttpResponse({ body: { success: true } }));
    refreshResult.complete();
    await Promise.all([first, second]);

    expect(attempts.get(`${environment.apiUrl}demo/properties`)).toBe(2);
    expect(attempts.get(`${environment.apiUrl}demo/payments`)).toBe(2);
  });

  it('no comparte renovaciones entre contextos distintos', async () => {
    const refreshResult = new Subject<HttpEvent<unknown>>();
    let refreshCalls = 0;
    const attempts = new Map<string, number>();
    const next = vi.fn((request: HttpRequest<unknown>) => {
      if (request.url === `${environment.apiUrl}auth/refresh`) {
        refreshCalls += 1;
        return refreshResult.asObservable();
      }

      const count = (attempts.get(request.url) ?? 0) + 1;
      attempts.set(request.url, count);
      return count === 1
        ? throwError(() => new HttpErrorResponse({ status: 401 }))
        : of(new HttpResponse({ body: { ok: true } }));
    }) as HttpHandlerFn;

    const first = firstValueFrom(
      execute(new HttpRequest('GET', `${environment.apiUrl}demo/admin/payments`), next),
    );
    const second = firstValueFrom(
      execute(new HttpRequest('GET', `${environment.apiUrl}demo/tenant/payments`), next),
    );

    expect(refreshCalls).toBe(2);
    refreshResult.next(new HttpResponse({ body: { success: true } }));
    refreshResult.complete();
    await Promise.all([first, second]);
  });

  it('limpia la sesión cuando el refresh falla', async () => {
    const next = vi.fn((request: HttpRequest<unknown>) =>
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            url: request.url,
          }),
      ),
    ) as HttpHandlerFn;

    await expect(
      firstValueFrom(
        execute(new HttpRequest('GET', `${environment.apiUrl}demo/admin/properties`), next),
      ),
    ).rejects.toBeInstanceOf(HttpErrorResponse);

    expect(expiration.expire).toHaveBeenCalledWith('admin');
  });

  it('no intenta renovar credenciales inválidas del login', async () => {
    const next = vi.fn(() =>
      throwError(() => new HttpErrorResponse({ status: 401 })),
    ) as HttpHandlerFn;

    await expect(
      firstValueFrom(
        execute(new HttpRequest('POST', `${environment.apiUrl}auth/login-admin`, {}), next),
      ),
    ).rejects.toBeInstanceOf(HttpErrorResponse);

    expect(next).toHaveBeenCalledTimes(1);
    expect(expiration.expire).not.toHaveBeenCalled();
  });

  it('no intenta renovar credenciales inválidas del login cuando la API vive bajo /api', async () => {
    environment.apiUrl = 'https://app.example.com/api/';
    const next = vi.fn(() =>
      throwError(() => new HttpErrorResponse({ status: 401 })),
    ) as HttpHandlerFn;

    await expect(
      firstValueFrom(
        execute(new HttpRequest('POST', `${environment.apiUrl}auth/login-admin`, {}), next),
      ),
    ).rejects.toBeInstanceOf(HttpErrorResponse);

    expect(next).toHaveBeenCalledTimes(1);
    expect(expiration.expire).not.toHaveBeenCalled();
  });

  it('no renueva ni expira la sesión por un 401 del catálogo público', async () => {
    const next = vi.fn(() =>
      throwError(() => new HttpErrorResponse({ status: 401 })),
    ) as HttpHandlerFn;

    await expect(
      firstValueFrom(
        execute(new HttpRequest('GET', `${environment.apiUrl}demo/catalog/website`), next),
      ),
    ).rejects.toBeInstanceOf(HttpErrorResponse);

    expect(next).toHaveBeenCalledTimes(1);
    expect(expiration.expire).not.toHaveBeenCalled();
  });

  it('no renueva ni expira la sesión por un 401 del catálogo público bajo /api', async () => {
    environment.apiUrl = 'https://app.example.com/api/';
    const next = vi.fn(() =>
      throwError(() => new HttpErrorResponse({ status: 401 })),
    ) as HttpHandlerFn;

    await expect(
      firstValueFrom(
        execute(new HttpRequest('GET', `${environment.apiUrl}demo/catalog/website`), next),
      ),
    ).rejects.toBeInstanceOf(HttpErrorResponse);

    expect(next).toHaveBeenCalledTimes(1);
    expect(expiration.expire).not.toHaveBeenCalled();
  });
});
