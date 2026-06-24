import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { filter, switchMap, catchError, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment';
import { SlugService } from './slug.service';
import type { UserRole } from '../models/user.model';

export interface MyPermissions {
  role: UserRole;
  allowedModules: string[];
}

const ADMIN_MODULES = [
  'properties',
  'units',
  'users',
  'contracts',
  'payments',
  'maintenance',
  'reports',
  'config',
  'employees',
  'owners',
  'inspections',
  'violations',
  'expenses',
  'vendors',
  'messages',
  'audit',
  'website',
  'applications',
  'accounting',
];

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private http = inject(HttpClient);
  private slugService = inject(SlugService);
  private router = inject(Router);

  private permissionsSignal = signal<MyPermissions | null>(null);

  /** Permisos del usuario logueado (null mientras carga) */
  readonly permissions = this.permissionsSignal.asReadonly();

  /** Lista de módulos permitidos */
  readonly allowedModules = computed(() => this.permissionsSignal()?.allowedModules ?? []);

  /** Rol del usuario logueado */
  readonly role = computed(() => this.permissionsSignal()?.role ?? null);

  constructor() {
    // Carga inmediata al iniciar el servicio (resuelve el caso de refresh de página,
    // donde NavigationEnd ocurre DESPUÉS de que los guards necesitan los permisos)
    this.fetchPermissions().subscribe((perms) => {
      if (perms) this.permissionsSignal.set(perms);
    });

    // Re-fetch en cada navegación para detectar cambios de permisos sin logout
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        switchMap(() => this.fetchPermissions()),
        takeUntilDestroyed(),
      )
      .subscribe((perms) => {
        if (perms) this.permissionsSignal.set(perms);
      });
  }

  /** Comprueba si el usuario puede ver un módulo específico */
  canView(module: string): boolean {
    const perms = this.permissionsSignal();
    if (!perms) return false;
    if (perms.role === 'ADMIN' || perms.role === 'SUPERADMIN') return true;
    return perms.allowedModules.includes(module);
  }

  /** Carga los permisos manualmente (tras login o cambio de permisos) */
  load(): void {
    this.fetchPermissions().subscribe((perms) => {
      if (perms) this.permissionsSignal.set(perms);
    });
  }

  /** Limpia los permisos al hacer logout */
  clear(): void {
    this.permissionsSignal.set(null);
  }

  private fetchPermissions() {
    const slug = this.slugService.getSlug();
    // Los permisos solo aplican al área admin. Sin sesión de admin (portal
    // público, inquilino, owner/vendor o sin sesión) NO se llama al endpoint
    // admin: evita el 401 que el interceptor interpretaría como sesión vencida
    // y terminaría cerrando la sesión del usuario.
    //
    // La sesión admin se detecta por el usuario persistido (`admin_user`), NO por
    // un token en storage: el JWT del admin viaja en una cookie HttpOnly y no es
    // legible desde JS, así que `getToken('admin')` siempre sería null.
    if (!slug || !this.hasAdminSession()) return of(null);

    return this.http
      .get<MyPermissions>(`${environment.apiUrl}${slug}/admin/employees/my-permissions`)
      .pipe(catchError(() => of(this.getFallbackPermissions())));
  }

  private hasAdminSession(): boolean {
    return this.getStoredAdminUser() !== null;
  }

  private getFallbackPermissions(): MyPermissions | null {
    const user = this.getStoredAdminUser();
    const role = user?.role;

    if (role === 'ADMIN' || role === 'SUPERADMIN') {
      return { role, allowedModules: ADMIN_MODULES };
    }

    if (role === 'TECNICO') {
      return { role, allowedModules: ['maintenance'] };
    }

    return role ? { role, allowedModules: [] } : null;
  }

  private getStoredAdminUser(): { role?: UserRole } | null {
    const raw = localStorage.getItem('admin_user') ?? sessionStorage.getItem('admin_user');
    if (!raw) return null;

    try {
      return JSON.parse(raw) as { role?: UserRole };
    } catch {
      return null;
    }
  }
}
