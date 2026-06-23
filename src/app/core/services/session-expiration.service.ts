import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

import { SessionTokenService } from './session-token.service';
import { isPublicPageUrl } from '../utils/auth-route.util';

const USER_KEYS = ['admin_user', 'tenant_user', 'owner_user', 'vendor_user'] as const;
const SLUG_KEYS = ['tenant_slug', 'current_tenant_slug'] as const;

@Injectable({ providedIn: 'root' })
export class SessionExpirationService {
  private readonly router = inject(Router);
  private readonly sessionTokens = inject(SessionTokenService);
  private readonly expiredSubject = new Subject<void>();
  private handlingExpiration = false;

  readonly expired$ = this.expiredSubject.asObservable();

  hasClientSession(): boolean {
    return USER_KEYS.some(
      (key) => localStorage.getItem(key) !== null || sessionStorage.getItem(key) !== null,
    );
  }

  expire(): void {
    if (this.handlingExpiration) return;
    this.handlingExpiration = true;

    const returnUrl = this.router.url;
    this.sessionTokens.clearAllTokens();
    for (const key of [...USER_KEYS, ...SLUG_KEYS]) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
    this.expiredSubject.next();

    if (isPublicPageUrl(returnUrl)) {
      this.handlingExpiration = false;
      return;
    }

    const navigation = this.loginNavigation(returnUrl);
    void this.router
      .navigate(navigation.commands, {
        queryParams: { returnUrl },
        replaceUrl: true,
      })
      .finally(() => {
        this.handlingExpiration = false;
      });
  }

  private loginNavigation(url: string): { commands: string[] } {
    const owner = url.match(/^\/([^/]+)\/owner(?:\/|$)/);
    if (owner) return { commands: ['/', owner[1], 'owner', 'login'] };

    const vendor = url.match(/^\/([^/]+)\/vendor(?:\/|$)/);
    if (vendor) return { commands: ['/', vendor[1], 'vendor', 'login'] };

    const tenant = url.match(/^\/([^/]+)\/portal(?:\/|$)/);
    if (tenant) return { commands: ['/', tenant[1], 'login'] };

    return { commands: ['/login'] };
  }
}
