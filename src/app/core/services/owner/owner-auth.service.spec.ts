import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionTokenService } from '../session-token.service';
import { SlugService } from '../slug.service';
import { OwnerAuthService } from './owner-auth.service';

describe('OwnerAuthService', () => {
  let http: { post: ReturnType<typeof vi.fn> };
  let sessionToken: {
    setToken: ReturnType<typeof vi.fn>;
    clearToken: ReturnType<typeof vi.fn>;
    getToken: ReturnType<typeof vi.fn>;
  };
  let service: OwnerAuthService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    http = { post: vi.fn() };
    sessionToken = {
      setToken: vi.fn(),
      clearToken: vi.fn(),
      getToken: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        OwnerAuthService,
        { provide: HttpClient, useValue: http },
        { provide: SessionTokenService, useValue: sessionToken },
        { provide: SlugService, useValue: { setSlug: vi.fn(), getSlug: () => 'demo' } },
      ],
    });
    service = TestBed.inject(OwnerAuthService);
  });

  it('stores owner token and user when login succeeds', () => {
    http.post.mockReturnValue(
      of({
        access_token: 'owner-token',
        user: {
          id: 1,
          email: 'owner@test.com',
          name: 'Owner',
          role: 'PROPIETARIO',
          tenant_slug: 'demo',
          rental_owner_id: 10,
        },
      }),
    );

    service.login('demo', 'owner@test.com', 'secret', true).subscribe();

    expect(sessionToken.clearToken).toHaveBeenCalledWith('owner');
    expect(sessionToken.setToken).toHaveBeenCalledWith('owner', 'owner-token', true);
    expect(service.currentOwner()?.rental_owner_id).toBe(10);
    expect(localStorage.getItem('owner_user')).toContain('owner@test.com');
  });

  it('clears owner session on logout', () => {
    localStorage.setItem('owner_user', '{"id":1}');

    service.logout('demo');

    expect(sessionToken.clearToken).toHaveBeenCalledWith('owner');
    expect(localStorage.getItem('owner_user')).toBeNull();
  });

  it('requires the owner session to match the current slug', () => {
    http.post.mockReturnValue(
      of({
        access_token: 'owner-token',
        user: {
          id: 1,
          email: 'owner@test.com',
          name: 'Owner',
          role: 'PROPIETARIO',
          tenant_slug: 'demo',
          rental_owner_id: 10,
        },
      }),
    );
    sessionToken.getToken.mockReturnValue('owner-token');

    service.login('demo', 'owner@test.com', 'secret', true).subscribe();

    expect(service.hasSessionForSlug('demo')).toBe(true);
    expect(service.hasSessionForSlug('other')).toBe(false);
  });
});
