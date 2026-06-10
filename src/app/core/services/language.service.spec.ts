import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from './auth.service';
import { LanguageService } from './language.service';
import { OwnerAuthService } from './owner/owner-auth.service';
import { SlugService } from './slug.service';
import { TenantAuthService } from './tenant/tenant-auth.service';

describe('LanguageService', () => {
  const routerEvents = new Subject<NavigationEnd>();
  const adminUser = signal<{ id: number } | null>(null);
  const tenantUser = signal<{ id: number } | null>(null);
  const ownerUser = signal<{ id: number } | null>(null);
  const transloco = { setActiveLang: vi.fn() };
  const router = {
    url: '/',
    events: routerEvents.asObservable(),
  };

  beforeEach(() => {
    localStorage.clear();
    adminUser.set(null);
    tenantUser.set(null);
    ownerUser.set(null);
    transloco.setActiveLang.mockClear();
    router.url = '/';

    TestBed.configureTestingModule({
      providers: [
        LanguageService,
        { provide: TranslocoService, useValue: transloco },
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: { currentUser: adminUser.asReadonly() } },
        { provide: TenantAuthService, useValue: { currentUser: tenantUser.asReadonly() } },
        { provide: OwnerAuthService, useValue: { currentOwner: ownerUser.asReadonly() } },
        { provide: SlugService, useValue: { getSlug: () => 'fallback' } },
      ],
    });
  });

  it('stores tenant language independently from admin language in the same browser', () => {
    adminUser.set({ id: 1 });
    tenantUser.set({ id: 9 });
    router.url = '/demo/portal/home';
    const service = TestBed.inject(LanguageService);

    service.setLanguage('en');

    expect(localStorage.getItem('lang_tenant_demo_9')).toBe('en');
    expect(localStorage.getItem('lang_admin_demo_1')).toBeNull();

    router.url = '/demo/dashboard';
    routerEvents.next(new NavigationEnd(1, '/demo/dashboard', '/demo/dashboard'));
    service.setLanguage('es');

    expect(localStorage.getItem('lang_admin_demo_1')).toBe('es');
    expect(localStorage.getItem('lang_tenant_demo_9')).toBe('en');
  });

  it('stores owner language separately from tenant and admin contexts', () => {
    adminUser.set({ id: 1 });
    tenantUser.set({ id: 9 });
    ownerUser.set({ id: 4 });
    router.url = '/demo/owner';
    const service = TestBed.inject(LanguageService);

    service.setLanguage('en');

    expect(localStorage.getItem('lang_owner_demo_4')).toBe('en');
    expect(localStorage.getItem('lang_tenant_demo_9')).toBeNull();
    expect(localStorage.getItem('lang_admin_demo_1')).toBeNull();
  });
});
