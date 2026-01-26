import { Injectable, signal } from '@angular/core';
import { MenuOption } from '../models/user.model';

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
        icon: 'dashboard',
        route: '/dashboard'
      },
      {
        label: 'Propiedades',
        icon: 'apartment',
        route: '/propiedades'
      },
      {
        label: 'Inquilinos',
        icon: 'people',
        route: '/inquilinos'
      },
      {
        label: 'Contratos',
        icon: 'description',
        route: '/contratos'
      },
      {
        label: 'Pagos',
        icon: 'payments',
        route: '/pagos'
      },
      {
        label: 'Mantenimiento',
        icon: 'build',
        route: '/mantenimiento'
      },
      {
        label: 'Componentes UI',
        icon: 'widgets',
        route: '/componentes'
      },
      {
        label: 'Reportes',
        icon: 'analytics',
        route: '/reportes'
      },
      {
        label: 'Configuración',
        icon: 'settings',
        route: '/configuracion'
      }
    ];
  }
}
