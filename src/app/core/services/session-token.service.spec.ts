import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

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

  it('usa token admin para endpoints sin contexto de portal', () => {
    service.setToken('admin', 'admin-token');

    expect(service.getTokenForRequest('/tenants')).toBe('admin-token');
  });

  it('elige el token correcto para requests por contexto', () => {
    service.setToken('admin', 'admin-token');
    service.setToken('tenant', 'tenant-token');
    service.setToken('owner', 'owner-token');

    expect(service.getTokenForRequest('/demo/tenant/payments')).toBe('tenant-token');
    expect(service.getTokenForRequest('/demo/owner/dashboard')).toBe('owner-token');
    expect(service.getTokenForRequest('/demo/admin/properties')).toBe('admin-token');
  });
});
