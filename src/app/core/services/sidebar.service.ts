import { Injectable, signal } from '@angular/core';
import { MenuOption } from '../models/user.model';
import { Bell } from 'lucide-angular';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private expandedSignal = signal(true);
  expanded = this.expandedSignal.asReadonly();

  toggle(): void {
    this.expandedSignal.update(value => !value);
  }

  expand(): void {
    this.expandedSignal.set(true);
  }

  collapse(): void {
    this.expandedSignal.set(false);
  }

  getMenuOptions(): MenuOption[] {
    return [
      {
        label: 'Dashboard',
        icon: 'LayoutDashboard',
        route: '/dashboard'
      },
      {
        label: 'Propiedades',
        icon: 'Building2',
        route: '/propiedades'
      },
      {
        label: 'Inquilinos',
        icon: 'Users',
        route: '/inquilinos'
      },
      {
        label: 'Contratos',
        icon: 'FileText',
        route: '/contratos'
      },
      {
        label: 'Pagos',
        icon: 'CreditCard',
        route: '/pagos'
      },
      {
        label: 'Mantenimiento',
        icon: 'Wrench',
        route: '/mantenimiento'
      },
      {
        label: 'Notificaciones',
        icon: 'Bell',
        route: '/notificaciones'
      },
      {
        label: 'Componentes UI',
        icon: 'Component',
        route: '/componentes'
      },
      {
        label: 'Reportes',
        icon: 'BarChart3',
        route: '/reportes'
      },
      {
        label: 'Configuración',
        icon: 'Settings',
        route: '/configuracion'
      }
    ];
  }
}
