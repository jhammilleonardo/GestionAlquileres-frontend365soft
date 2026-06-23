import { HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { of } from 'rxjs';

import { credentialsCsrfInterceptor } from './credentials-csrf.interceptor';
import { environment } from '../../../environments/environment';

describe('credentialsCsrfInterceptor', () => {
  let next: HttpHandlerFn & ReturnType<typeof vi.fn>;

  const lastReq = () => (next.mock.calls[0] as [HttpRequest<unknown>])[0];

  beforeEach(() => {
    next = vi.fn((req: HttpRequest<unknown>) => of(req)) as never;
    document.cookie = 'csrf_token=abc123; path=/';
  });

  it('agrega withCredentials a las requests de la API', () => {
    credentialsCsrfInterceptor(new HttpRequest('GET', `${environment.apiUrl}demo/x`), next);
    expect(lastReq().withCredentials).toBe(true);
  });

  it('reenvía el token CSRF como header en mutaciones', () => {
    credentialsCsrfInterceptor(new HttpRequest('POST', `${environment.apiUrl}demo/x`, {}), next);
    expect(lastReq().headers.get('X-CSRF-Token')).toBe('abc123');
  });

  it('no agrega CSRF en métodos seguros (GET)', () => {
    credentialsCsrfInterceptor(new HttpRequest('GET', `${environment.apiUrl}demo/x`), next);
    expect(lastReq().headers.has('X-CSRF-Token')).toBe(false);
  });

  it('no toca requests a terceros (fuera de la API)', () => {
    credentialsCsrfInterceptor(new HttpRequest('GET', 'https://tiles.example.com/1.png'), next);
    expect(lastReq().withCredentials).toBeFalsy();
  });
});
