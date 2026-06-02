import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { environment } from '../../../environments/environment';
import { PermissionsService } from './permissions.service';
import { SlugService } from './slug.service';
import { AuthService, isAdminMfaRequiredResponse } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: { post: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    http = { post: vi.fn(), get: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: HttpClient, useValue: http },
        { provide: Router, useValue: { navigate: vi.fn() } },
        {
          provide: SlugService,
          useValue: {
            getSlug: () => 'demo',
            setSlug: vi.fn(),
            clearSlug: vi.fn(),
          },
        },
        {
          provide: PermissionsService,
          useValue: {
            clear: vi.fn(),
            load: vi.fn(),
          },
        },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  it('requests password reset instructions', () => {
    http.post.mockReturnValue(of({ message: 'ok' }));

    service.requestPasswordReset('admin@test.com').subscribe((response) => {
      expect(response.message).toBe('ok');
    });

    expect(http.post).toHaveBeenCalledWith(`${environment.apiUrl}auth/forgot-password`, {
      email: 'admin@test.com',
    });
  });

  it('resets password with token', () => {
    http.post.mockReturnValue(of({ message: 'updated' }));

    service.resetPassword('token-123', 'NewPassword123').subscribe((response) => {
      expect(response.message).toBe('updated');
    });

    expect(http.post).toHaveBeenCalledWith(`${environment.apiUrl}auth/reset-password`, {
      token: 'token-123',
      password: 'NewPassword123',
    });
  });

  it('does not store a session when admin login requires MFA', () => {
    http.post.mockReturnValue(
      of({
        mfa_required: true,
        challenge_id: 'challenge-123',
        email_masked: 'ad***@test.com',
        expires_in_seconds: 600,
      }),
    );

    service.loginAdmin('admin@test.com', 'Admin365!').subscribe((response) => {
      expect(isAdminMfaRequiredResponse(response)).toBe(true);
    });

    expect(http.post).toHaveBeenCalledWith(`${environment.apiUrl}auth/login-admin`, {
      email: 'admin@test.com',
      password: 'Admin365!',
    });
    expect(localStorage.getItem('admin_access_token')).toBeNull();
    expect(sessionStorage.getItem('admin_access_token')).toBeNull();
  });

  it('stores admin session after MFA verification', () => {
    http.post.mockReturnValue(
      of({
        access_token: 'jwt-token',
        user: {
          id: 1,
          name: 'Admin',
          email: 'admin@test.com',
          role: 'ADMIN',
          tenant_slug: 'demo',
        },
      }),
    );

    service.verifyAdminMfa('challenge-123', '123456', true).subscribe((response) => {
      expect(response.access_token).toBe('jwt-token');
    });

    expect(http.post).toHaveBeenCalledWith(`${environment.apiUrl}auth/login-admin/mfa`, {
      challenge_id: 'challenge-123',
      code: '123456',
    });
    expect(localStorage.getItem('admin_access_token')).toBe('jwt-token');
  });
});
