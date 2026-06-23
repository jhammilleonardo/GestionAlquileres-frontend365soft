import { Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { getApiErrorMessage } from '../../http/http-error.util';
import { SessionTokenService } from '../session-token.service';
import { SlugService } from '../slug.service';
import { SessionExpirationService } from '../session-expiration.service';

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
  access_token?: string;
  user: VendorUser;
}

@Injectable({ providedIn: 'root' })
export class VendorAuthService {
  private readonly http = inject(HttpClient);
  private readonly sessionToken = inject(SessionTokenService);
  private readonly slugService = inject(SlugService);
  private readonly sessionExpiration = inject(SessionExpirationService);

  private readonly vendorUserKey = 'vendor_user';
  private readonly currentVendorSignal = signal<VendorUser | null>(this.loadVendorFromStorage());
  private readonly isLoadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly currentVendor = this.currentVendorSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  constructor() {
    this.sessionExpiration.expired$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.currentVendorSignal.set(null);
    });
  }

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
    this.http
      .post(`${environment.apiUrl}auth/logout`, {})
      .pipe(catchError(() => of(null)))
      .subscribe();
    this.sessionToken.clearToken('vendor');
    localStorage.removeItem(this.vendorUserKey);
    sessionStorage.removeItem(this.vendorUserKey);
    this.currentVendorSignal.set(null);
    if (slug) this.slugService.setSlug(slug);
  }

  hasSessionForSlug(slug: string | null | undefined): boolean {
    // La sesión vive en la cookie HttpOnly; el objeto user es la señal cliente.
    if (!this.currentVendorSignal()) return false;
    if (!slug) return true;
    return this.currentVendorSignal()?.tenant_slug === slug;
  }

  private setSession(response: VendorLoginResponse, rememberMe: boolean): void {
    // El JWT va en la cookie HttpOnly; sólo se persiste el objeto user.
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
