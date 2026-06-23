import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { isPublicApiPath, requestPath } from '../utils/auth-route.util';

export type AuthContext = 'admin' | 'owner' | 'tenant' | 'vendor';

const TOKEN_KEYS: Record<AuthContext, readonly string[]> = {
  admin: ['admin_access_token'],
  tenant: ['tenant_access_token'],
  owner: ['owner_access_token'],
  vendor: ['vendor_access_token'],
};

@Injectable({
  providedIn: 'root',
})
export class SessionTokenService {
  getToken(context: AuthContext): string | null {
    return this.readFirstAvailable(TOKEN_KEYS[context]);
  }

  setToken(context: AuthContext, token: string, persistent = true): void {
    this.clearToken(context);
    const storage = persistent ? localStorage : sessionStorage;
    storage.setItem(TOKEN_KEYS[context][0], token);
  }

  clearToken(context: AuthContext): void {
    for (const key of TOKEN_KEYS[context]) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
  }

  clearAllTokens(): void {
    for (const context of Object.keys(TOKEN_KEYS) as AuthContext[]) {
      this.clearToken(context);
    }
  }

  getTokenForRequest(url: string): string | null {
    if (!this.isApiRequest(url)) {
      return null;
    }

    const path = requestPath(url);
    if (isPublicApiPath(path) || path.startsWith('/auth/')) {
      return null;
    }

    const context = this.resolveContext(url);

    if (context) {
      return this.getToken(context);
    }

    return this.getToken('admin');
  }

  resolveContext(url: string): AuthContext | null {
    const normalized = this.normalizeUrl(url);

    if (normalized.includes('/tenant/')) {
      return 'tenant';
    }

    if (normalized.includes('/owner/')) {
      return 'owner';
    }

    if (normalized.includes('/vendor/')) {
      return 'vendor';
    }

    if (normalized.includes('/admin/')) {
      return 'admin';
    }

    return null;
  }

  private readFirstAvailable(keys: readonly string[]): string | null {
    for (const key of keys) {
      const value = localStorage.getItem(key) ?? sessionStorage.getItem(key);

      if (value) {
        return value;
      }
    }

    return null;
  }

  private normalizeUrl(url: string): string {
    try {
      return new URL(url, window.location.origin).pathname;
    } catch {
      return url;
    }
  }

  private isApiRequest(url: string): boolean {
    if (!/^https?:\/\//i.test(url)) {
      return false;
    }

    try {
      const requestUrl = new URL(url);
      const apiUrl = new URL(environment.apiUrl);
      const apiHref = apiUrl.href.endsWith('/') ? apiUrl.href : `${apiUrl.href}/`;

      return requestUrl.href.startsWith(apiHref);
    } catch {
      return false;
    }
  }
}
