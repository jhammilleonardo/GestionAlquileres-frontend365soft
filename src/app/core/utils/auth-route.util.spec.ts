import { afterEach, describe, expect, it } from 'vitest';

import { environment } from '../../../environments/environment';
import { authContextForRequest, isPublicApiPath, requestPath } from './auth-route.util';

describe('auth-route.util', () => {
  const originalApiUrl = environment.apiUrl;

  afterEach(() => {
    environment.apiUrl = originalApiUrl;
  });

  it('devuelve el path normal cuando la API no tiene prefijo publico', () => {
    environment.apiUrl = 'http://localhost:3000/';

    expect(requestPath('http://localhost:3000/auth/login-admin')).toBe('/auth/login-admin');
  });

  it('quita el prefijo publico de environment.apiUrl antes de evaluar rutas auth', () => {
    environment.apiUrl = 'https://app.example.com/api/';

    expect(requestPath('https://app.example.com/api/auth/login-admin')).toBe('/auth/login-admin');
    expect(requestPath('https://app.example.com/api/demo/catalog/website')).toBe(
      '/demo/catalog/website',
    );
    expect(isPublicApiPath(requestPath('https://app.example.com/api/demo/catalog/website'))).toBe(
      true,
    );
  });

  it('resuelve contexto por ruta de API', () => {
    environment.apiUrl = 'https://app.example.com/api/';

    expect(authContextForRequest('https://app.example.com/api/auth/login-admin')).toBe('admin');
    expect(authContextForRequest('https://app.example.com/api/auth/acme/login')).toBe('tenant');
    expect(authContextForRequest('https://app.example.com/api/auth/acme/owner/login')).toBe(
      'owner',
    );
    expect(authContextForRequest('https://app.example.com/api/acme/admin/payments')).toBe('admin');
    expect(authContextForRequest('https://app.example.com/api/acme/tenant/payments')).toBe(
      'tenant',
    );
  });
});
