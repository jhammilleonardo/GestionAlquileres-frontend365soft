import { Injectable, signal, inject, computed } from '@angular/core';
import { MenuOption } from '../models/user.model';
import { PermissionsService } from './permissions.service';

/** Todos los items del menú con su clave de módulo.
 *  module: undefined → siempre visible (dashboard, perfil, notificaciones). */
const ALL_MENU_ITEMS: MenuOption[] = [
  { label: 'Dashboard', icon: 'LayoutDashboard', route: '/dashboard' },
  { label: 'Propiedades', icon: 'Building2', route: '/propiedades', module: 'properties' },
  { label: 'Inquilinos', icon: 'Users', route: '/inquilinos', module: 'users' },
  { label: 'Contratos', icon: 'FileText', route: '/contratos', module: 'contracts' },
  { label: 'Solicitudes', icon: 'FileCheck', route: '/solicitudes', module: 'applications' },
  { label: 'Pagos', icon: 'CreditCard', route: '/pagos', module: 'payments' },
  { label: 'Mantenimiento', icon: 'Wrench', route: '/mantenimiento', module: 'maintenance' },
  { label: 'Notificaciones', icon: 'Bell', route: '/notificaciones' },
  { label: 'Configuración', icon: 'Settings', route: '/configuracion', module: 'config' },
  { label: 'Perfil', icon: 'User', route: '/perfil' },
];

@Injectable({ providedIn: 'root' })
export class SidebarService {
  private permissionsService = inject(PermissionsService);

  private expandedSignal = signal(true);
  expanded = this.expandedSignal.asReadonly();

  private mobileOpenSignal = signal(false);
  mobileOpen = this.mobileOpenSignal.asReadonly();

  /** Items filtrados según permisos del usuario logueado */
  readonly menuItems = computed<MenuOption[]>(() => {
    const allowed = this.permissionsService.allowedModules();
    const role = this.permissionsService.role();

    // Sin permisos cargados aún → no mostrar nada (evita flash)
    if (!role) return [];

    return ALL_MENU_ITEMS.filter((item) => {
      // Items sin módulo → siempre visibles
      if (!item.module) return true;
      // ADMIN / SUPERADMIN → ven todo
      if (role === 'ADMIN' || role === 'SUPERADMIN') return true;
      // TECNICO → solo mantenimiento (hardcodeado, independiente del backend)
      if (role === 'TECNICO') return item.module === 'maintenance';
      // EMPLEADO → solo módulos asignados por el admin
      return allowed.includes(item.module);
    });
  });

  toggle(): void {
    this.expandedSignal.update((v) => !v);
  }
  expand(): void {
    this.expandedSignal.set(true);
  }
  collapse(): void {
    this.expandedSignal.set(false);
  }

  openMobile(): void {
    this.mobileOpenSignal.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeMobile(): void {
    this.mobileOpenSignal.set(false);
    document.body.style.overflow = '';
  }

  toggleMobile(): void {
    if (this.mobileOpenSignal()) {
      this.closeMobile();
    } else {
      this.openMobile();
    }
  }

  isMobile(): boolean {
    return window.innerWidth < 1024;
  }

  /** @deprecated Usar menuItems signal en su lugar */
  getMenuOptions(): MenuOption[] {
    return ALL_MENU_ITEMS;
  }
}
