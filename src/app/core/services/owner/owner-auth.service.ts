import { Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { getApiErrorMessage } from '../../http/http-error.util';
import { SessionTokenService } from '../session-token.service';
import { SlugService } from '../slug.service';
import { SessionExpirationService } from '../session-expiration.service';

export interface OwnerUser {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: string;
  tenant_slug: string;
  rental_owner_id: number;
}

export interface OwnerLoginResponse {
  access_token?: string;
  user: OwnerUser;
}

@Injectable({ providedIn: 'root' })
export class OwnerAuthService {
  private readonly http = inject(HttpClient);
  private readonly sessionToken = inject(SessionTokenService);
  private readonly slugService = inject(SlugService);
  private readonly sessionExpiration = inject(SessionExpirationService);

  private readonly ownerUserKey = 'owner_user';
  private readonly currentOwnerSignal = signal<OwnerUser | null>(this.loadOwnerFromStorage());
  private readonly isLoadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly currentOwner = this.currentOwnerSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  constructor() {
    this.sessionExpiration.expired$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.currentOwnerSignal.set(null);
    });
  }

  login(
    slug: string,
    email: string,
    password: string,
    rememberMe = false,
  ): Observable<OwnerLoginResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);
    this.slugService.setSlug(slug);

    return this.http
      .post<OwnerLoginResponse>(`${environment.apiUrl}auth/${slug}/owner/login`, {
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
    this.sessionToken.clearToken('owner');
    localStorage.removeItem(this.ownerUserKey);
    sessionStorage.removeItem(this.ownerUserKey);
    this.currentOwnerSignal.set(null);
    if (slug) this.slugService.setSlug(slug);
  }

  hasSessionForSlug(slug: string | null | undefined): boolean {
    // La sesión vive en la cookie HttpOnly; el objeto user es la señal cliente.
    if (!this.currentOwnerSignal()) return false;
    if (!slug) return true;
    return this.currentOwnerSignal()?.tenant_slug === slug;
  }

  private setSession(response: OwnerLoginResponse, rememberMe: boolean): void {
    // El JWT va en la cookie HttpOnly; sólo se persiste el objeto user.
    const storage = rememberMe ? localStorage : sessionStorage;
    localStorage.removeItem(this.ownerUserKey);
    sessionStorage.removeItem(this.ownerUserKey);
    storage.setItem(this.ownerUserKey, JSON.stringify(response.user));
    this.currentOwnerSignal.set(response.user);
  }

  private loadOwnerFromStorage(): OwnerUser | null {
    const raw =
      localStorage.getItem(this.ownerUserKey) ?? sessionStorage.getItem(this.ownerUserKey);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as OwnerUser;
    } catch {
      localStorage.removeItem(this.ownerUserKey);
      sessionStorage.removeItem(this.ownerUserKey);
      return null;
    }
  }
}
