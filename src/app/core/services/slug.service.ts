import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, tap, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TenantInfo {
  id: number;
  company_name: string;
  slug: string;
  currency: string;
  locale: string;
  is_active: boolean;
  logo_url?: string;
  created_at: Date;
  updated_at: Date;
}

@Injectable({
  providedIn: 'root',
})
export class SlugService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly SLUG_KEY = 'tenant_slug';

  // Cache de tenants validados
  private tenantCache = new Map<string, TenantInfo>();

  // Signal reactivo del slug actual
  private currentSlugSignal = signal<string | null>(this.loadSlugFromStorage());
  private currentTenantSignal = signal<TenantInfo | null>(null);
  private isLoadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);

  // Signals públicas de solo lectura
  readonly currentSlug = this.currentSlugSignal.asReadonly();
  readonly currentTenant = this.currentTenantSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  // Computed para saber si tenemos un tenant válido
  readonly hasValidSlug = computed(() => this.currentSlugSignal() !== null);
  readonly hasValidTenant = computed(() => this.currentTenantSignal() !== null);

  /**
   * Establecer el slug actual (llamado desde el router o componentes)
   */
  setSlug(slug: string | null): void {
    this.currentSlugSignal.set(slug);
    this.errorSignal.set(null);

    if (slug) {
      this.saveSlugToStorage(slug);
      this.validateAndLoadTenant(slug);
    } else {
      this.currentTenantSignal.set(null);
      this.removeSlugFromStorage();
    }
  }

  /**
   * Obtener el slug actual
   */
  getSlug(): string | null {
    return this.currentSlugSignal();
  }

  /**
   * Validar que el slug existe y cargar información del tenant
   */
  validateAndLoadTenant(slug: string): Observable<boolean> {
    // Verificar cache primero
    if (this.tenantCache.has(slug)) {
      const tenant = this.tenantCache.get(slug)!;
      this.currentTenantSignal.set(tenant);
      return of(true);
    }

    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.get<TenantInfo>(`${environment.apiUrl}tenants/slug/${slug}`).pipe(
      tap({
        next: (tenant) => {
          this.tenantCache.set(slug, tenant);
          this.currentTenantSignal.set(tenant);
          this.isLoadingSignal.set(false);
        },
        error: () => {
          this.currentTenantSignal.set(null);
          this.isLoadingSignal.set(false);
          this.errorSignal.set(`La organización "${slug}" no existe`);
        },
      }),
      map(() => true),
      catchError(() => of(false)),
    );
  }

  /**
   * Validar slug sin cargar toda la información (más rápido)
   * Solo verifica que existe
   */
  validateSlugExists(slug: string): Observable<boolean> {
    // Verificar cache
    if (this.tenantCache.has(slug)) {
      return of(true);
    }

    return this.http.get<TenantInfo>(`${environment.apiUrl}tenants/slug/${slug}`).pipe(
      tap((tenant) => {
        this.tenantCache.set(slug, tenant);
      }),
      map(() => true),
      catchError(() => of(false)),
    );
  }

  /**
   * Obtener información completa del tenant actual
   */
  getCurrentTenant(): TenantInfo | null {
    return this.currentTenantSignal();
  }

  /**
   * Limpiar el slug actual (logout, cambio de tenant)
   */
  clearSlug(): void {
    this.currentSlugSignal.set(null);
    this.currentTenantSignal.set(null);
    this.errorSignal.set(null);
    this.removeSlugFromStorage();
  }

  /**
   * Limpiar cache de tenants
   */
  clearCache(): void {
    this.tenantCache.clear();
  }

  /**
   * Navegar a una ruta dentro del slug actual
   */
  navigateTo(path: string[]): void {
    const slug = this.currentSlugSignal();
    console.log('[SlugService.navigateTo] Current slug:', slug);
    console.log('[SlugService.navigateTo] Path to navigate:', path);
    console.log('[SlugService.navigateTo] Full path will be:', ['/', slug, ...path]);

    if (slug) {
      const fullPath = ['/', slug, ...path];
      console.log('[SlugService.navigateTo] Executing router.navigate to:', fullPath);
      this.router.navigate(fullPath);
    } else {
      console.warn('[SlugService.navigateTo] No slug found, cannot navigate');
    }
  }

  /**
   * Construir URL completa con slug
   */
  buildUrl(path: string): string {
    const slug = this.currentSlugSignal();
    if (!slug) {
      console.warn('SlugService: No hay slug actual para construir URL');
      return path;
    }
    return `/${slug}${path.startsWith('/') ? path : '/' + path}`;
  }

  /**
   * Construir endpoint de API con slug
   */
  buildApiEndpoint(endpoint: string): string {
    const slug = this.currentSlugSignal();
    if (!slug) {
      console.warn('SlugService: No hay slug actual para construir endpoint');
      return endpoint;
    }

    // Si el endpoint ya empieza con el slug, no agregarlo de nuevo
    if (endpoint.startsWith(`${slug}/`)) {
      return endpoint;
    }

    return `${slug}/${endpoint}`;
  }

  /**
   * Construir URL completa de API (para archivos, PDFs, etc.)
   */
  buildApiUrl(path: string): string {
    const apiUrl = 'http://localhost:3000'; // TODO: mover a configuración
    return `${apiUrl}${path.startsWith('/') ? path : '/' + path}`;
  }

  /**
   * Verificar si hay error de slug
   */
  hasError(): boolean {
    return this.errorSignal() !== null;
  }

  /**
   * Obtener mensaje de error
   */
  getErrorMessage(): string | null {
    return this.errorSignal();
  }

  /**
   * Limpiar error
   */
  clearError(): void {
    this.errorSignal.set(null);
  }

  /**
   * Cargar slug desde los datos del usuario autenticado (fuente de verdad).
   * Si no hay usuario autenticado, cae en el valor guardado en storage como fallback.
   */
  private loadSlugFromStorage(): string | null {
    // Prioridad 1: slug del usuario admin autenticado
    try {
      const adminUserJson = localStorage.getItem('admin_user');
      if (adminUserJson) {
        const adminUser = JSON.parse(adminUserJson);
        if (adminUser?.tenant_slug) return adminUser.tenant_slug;
      }
    } catch {
      /* ignore */
    }

    // Prioridad 2: slug del usuario tenant autenticado
    try {
      const tenantUserJson = localStorage.getItem('tenant_user');
      if (tenantUserJson) {
        const tenantUser = JSON.parse(tenantUserJson);
        const slug = tenantUser?.tenant_slug || tenantUser?.tenantSlug;
        if (slug) return slug;
      }
    } catch {
      /* ignore */
    }

    // Fallback: valor en storage (solo si no hay usuario autenticado)
    return localStorage.getItem(this.SLUG_KEY) || sessionStorage.getItem(this.SLUG_KEY);
  }

  /**
   * Guardar slug en storage (usa localStorage para persistencia)
   */
  private saveSlugToStorage(slug: string): void {
    localStorage.setItem(this.SLUG_KEY, slug);
    sessionStorage.setItem(this.SLUG_KEY, slug);
  }

  /**
   * Eliminar slug del storage
   */
  private removeSlugFromStorage(): void {
    localStorage.removeItem(this.SLUG_KEY);
    sessionStorage.removeItem(this.SLUG_KEY);
  }
}
