import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

import { AuthContext, SessionTokenService } from './session-token.service';
import { isPublicPageUrl } from '../utils/auth-route.util';

const USER_KEYS: Record<AuthContext, string> = {
  admin: 'admin_user',
  tenant: 'tenant_user',
  owner: 'owner_user',
  vendor: 'vendor_user',
};
const SLUG_KEYS = ['tenant_slug', 'current_tenant_slug'] as const;

export interface SessionExpirationEvent {
  context: AuthContext | null;
}

@Injectable({ providedIn: 'root' })
export class SessionExpirationService {
  private readonly router = inject(Router);
  private readonly sessionTokens = inject(SessionTokenService);
  private readonly expiredSubject = new Subject<SessionExpirationEvent>();
  private handlingExpiration = false;

  readonly expired$ = this.expiredSubject.asObservable();

  hasClientSession(context: AuthContext | null = null): boolean {
    if (context) {
      return this.hasStorageKey(USER_KEYS[context]);
    }

    return Object.values(USER_KEYS).some((key) => this.hasStorageKey(key));
  }

  expire(context: AuthContext | null = null): void {
    if (this.handlingExpiration) return;
    this.handlingExpiration = true;

    const returnUrl = this.router.url;
    if (context) {
      this.clearContextSession(context);
    } else {
      this.clearAllSessions();
    }
    this.expiredSubject.next({ context });

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

  private clearContextSession(context: AuthContext): void {
    this.sessionTokens.clearToken(context);
    const key = USER_KEYS[context];
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }

  private clearAllSessions(): void {
    this.sessionTokens.clearAllTokens();
    for (const key of [...Object.values(USER_KEYS), ...SLUG_KEYS]) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
  }

  private hasStorageKey(key: string): boolean {
    return localStorage.getItem(key) !== null || sessionStorage.getItem(key) !== null;
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
