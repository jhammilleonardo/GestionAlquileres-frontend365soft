import { Injectable, signal, inject, computed } from '@angular/core';
import { MenuOption } from '../models/user.model';
import { PermissionsService } from './permissions.service';

/** Todos los items del menú con su clave de módulo.
 *  module: undefined → siempre visible (dashboard, perfil, notificaciones). */
const ALL_MENU_ITEMS: MenuOption[] = [
  { label: 'sidebar.menu.dashboard', icon: 'LayoutDashboard', route: '/dashboard' },
  {
    label: 'sidebar.menu.properties',
    icon: 'Building2',
    route: '/propiedades',
    module: 'properties',
  },
  { label: 'sidebar.menu.tenants', icon: 'Users', route: '/inquilinos', module: 'users' },
  { label: 'sidebar.menu.contracts', icon: 'FileText', route: '/contratos', module: 'contracts' },
  {
    label: 'sidebar.menu.applications',
    icon: 'FileCheck',
    route: '/solicitudes',
    module: 'applications',
  },
  { label: 'sidebar.menu.payments', icon: 'CreditCard', route: '/pagos', module: 'payments' },
  {
    label: 'sidebar.menu.maintenance',
    icon: 'Wrench',
    route: '/mantenimiento',
    module: 'maintenance',
  },
  { label: 'sidebar.menu.reports', icon: 'BarChart3', route: '/reportes', module: 'reports' },
  { label: 'sidebar.menu.vendors', icon: 'Wrench', route: '/proveedores', module: 'vendors' },
  { label: 'sidebar.menu.expenses', icon: 'CreditCard', route: '/gastos', module: 'expenses' },
  {
    label: 'sidebar.menu.violations',
    icon: 'AlertCircle',
    route: '/violaciones',
    module: 'violations',
  },
  {
    label: 'sidebar.menu.inspections',
    icon: 'FileCheck',
    route: '/inspecciones',
    module: 'inspections',
  },
  { label: 'sidebar.menu.employees', icon: 'UserCog', route: '/empleados', module: 'employees' },
  { label: 'sidebar.menu.messages', icon: 'MessageSquare', route: '/mensajes', module: 'config' },
  { label: 'sidebar.menu.notifications', icon: 'Bell', route: '/notificaciones' },
  { label: 'sidebar.menu.website', icon: 'Globe', route: '/mi-sitio-web', module: 'config' },
  { label: 'sidebar.menu.audit', icon: 'ShieldCheck', route: '/auditoria', module: 'config' },
  { label: 'sidebar.menu.settings', icon: 'Settings', route: '/configuracion', module: 'config' },
  { label: 'sidebar.menu.profile', icon: 'User', route: '/perfil' },
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
