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
    if (!slug) return of(null);

    return this.http
      .get<MyPermissions>(`${environment.apiUrl}${slug}/admin/employees/my-permissions`)
      .pipe(catchError(() => of(null)));
  }
}
