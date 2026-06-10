import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { getApiErrorMessage } from '../../http/http-error.util';
import { SessionTokenService } from '../session-token.service';
import { SlugService } from '../slug.service';

export interface VendorUser {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: string;
  tenant_slug: string;
  vendor_id: number;
}

export interface VendorLoginResponse {
  access_token: string;
  user: VendorUser;
}

@Injectable({ providedIn: 'root' })
export class VendorAuthService {
  private readonly http = inject(HttpClient);
  private readonly sessionToken = inject(SessionTokenService);
  private readonly slugService = inject(SlugService);

  private readonly vendorUserKey = 'vendor_user';
  private readonly currentVendorSignal = signal<VendorUser | null>(this.loadVendorFromStorage());
  private readonly isLoadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly currentVendor = this.currentVendorSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  login(
    slug: string,
    email: string,
    password: string,
    rememberMe = false,
  ): Observable<VendorLoginResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);
    this.slugService.setSlug(slug);

    return this.http
      .post<VendorLoginResponse>(`${environment.apiUrl}auth/${slug}/vendor/login`, {
        email,
        password,
      })
      .pipe(
        tap((response) => {
          this.setSession(response, rememberMe);
          this.isLoadingSignal.set(false);
        }),
        catchError((error: unknown) => {
          this.isLoadingSignal.set(false);
          this.errorSignal.set(getApiErrorMessage(error, 'Error al iniciar sesión'));
          throw error;
        }),
      );
  }

  logout(slug = this.slugService.getSlug()): void {
    this.sessionToken.clearToken('vendor');
    localStorage.removeItem(this.vendorUserKey);
    sessionStorage.removeItem(this.vendorUserKey);
    this.currentVendorSignal.set(null);
    if (slug) this.slugService.setSlug(slug);
  }

  hasToken(): boolean {
    return Boolean(this.sessionToken.getToken('vendor'));
  }

  hasSessionForSlug(slug: string | null | undefined): boolean {
    if (!this.hasToken()) return false;
    if (!slug) return true;
    return this.currentVendorSignal()?.tenant_slug === slug;
  }

  private setSession(response: VendorLoginResponse, rememberMe: boolean): void {
    this.sessionToken.setToken('vendor', response.access_token, rememberMe);
    const storage = rememberMe ? localStorage : sessionStorage;
    localStorage.removeItem(this.vendorUserKey);
    sessionStorage.removeItem(this.vendorUserKey);
    storage.setItem(this.vendorUserKey, JSON.stringify(response.user));
    this.currentVendorSignal.set(response.user);
  }

  private loadVendorFromStorage(): VendorUser | null {
    const raw =
      localStorage.getItem(this.vendorUserKey) ?? sessionStorage.getItem(this.vendorUserKey);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as VendorUser;
    } catch {
      localStorage.removeItem(this.vendorUserKey);
      sessionStorage.removeItem(this.vendorUserKey);
      return null;
    }
  }
}
