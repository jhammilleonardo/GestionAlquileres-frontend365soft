import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../../environments/environment';
import { SessionTokenService } from './session-token.service';

describe('SessionTokenService', () => {
  let service: SessionTokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionTokenService);
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('guarda tokens persistentes en localStorage', () => {
    service.setToken('admin', 'admin-token');

    expect(localStorage.getItem('admin_access_token')).toBe('admin-token');
    expect(service.getToken('admin')).toBe('admin-token');
  });

  it('guarda tokens no persistentes en sessionStorage', () => {
    service.setToken('tenant', 'tenant-token', false);

    expect(sessionStorage.getItem('tenant_access_token')).toBe('tenant-token');
    expect(localStorage.getItem('tenant_access_token')).toBeNull();
    expect(service.getToken('tenant')).toBe('tenant-token');
  });

  it('elimina tokens persistentes anteriores al guardar una sesion temporal', () => {
    service.setToken('admin', 'persistent-token', true);
    service.setToken('admin', 'session-token', false);

    expect(localStorage.getItem('admin_access_token')).toBeNull();
    expect(sessionStorage.getItem('admin_access_token')).toBe('session-token');
    expect(service.getToken('admin')).toBe('session-token');
  });

  it('limpia el token en ambos storages', () => {
    localStorage.setItem('owner_access_token', 'local-owner-token');
    sessionStorage.setItem('owner_access_token', 'session-owner-token');

    service.clearToken('owner');

    expect(localStorage.getItem('owner_access_token')).toBeNull();
    expect(sessionStorage.getItem('owner_access_token')).toBeNull();
  });

  it('resuelve contexto tenant, owner y admin desde la URL', () => {
    expect(service.resolveContext('/demo/tenant/payments')).toBe('tenant');
    expect(service.resolveContext('/demo/owner/statements')).toBe('owner');
    expect(service.resolveContext('/demo/admin/contracts')).toBe('admin');
  });

  it('usa token admin para endpoints del API sin contexto de portal', () => {
    service.setToken('admin', 'admin-token');

    expect(service.getTokenForRequest(`${environment.apiUrl}tenants`)).toBe('admin-token');
  });

  it('no adjunta tokens a rutas relativas o dominios externos', () => {
    service.setToken('admin', 'admin-token');
    service.setToken('tenant', 'tenant-token');

    expect(service.getTokenForRequest('/tenants')).toBeNull();
    expect(service.getTokenForRequest('https://example.com/demo/admin/properties')).toBeNull();
  });

  it('no adjunta el token admin al catálogo público ni a autenticación', () => {
    service.setToken('admin', 'admin-token');

    expect(service.getTokenForRequest(`${environment.apiUrl}demo/catalog/website`)).toBeNull();
    expect(service.getTokenForRequest(`${environment.apiUrl}auth/login-admin`)).toBeNull();
  });

  it('elige el token correcto para requests por contexto', () => {
    service.setToken('admin', 'admin-token');
    service.setToken('tenant', 'tenant-token');
    service.setToken('owner', 'owner-token');

    expect(service.getTokenForRequest(`${environment.apiUrl}demo/tenant/payments`)).toBe(
      'tenant-token',
    );
    expect(service.getTokenForRequest(`${environment.apiUrl}demo/owner/dashboard`)).toBe(
      'owner-token',
    );
    expect(service.getTokenForRequest(`${environment.apiUrl}demo/admin/properties`)).toBe(
      'admin-token',
    );
  });
});
