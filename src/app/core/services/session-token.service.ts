import { Injectable } from '@angular/core';

export type AuthContext = 'admin' | 'owner' | 'tenant';

const TOKEN_KEYS: Record<AuthContext, readonly string[]> = {
  admin: ['admin_access_token'],
  tenant: ['tenant_access_token'],
  owner: ['owner_access_token'],
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

  getTokenForRequest(url: string): string | null {
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
}
