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
    // Obtener el slug del tenant desde localStorage
    const tenantSlug = localStorage.getItem('tenant_slug') || 'soft-prueba';
    const baseRoute = `/${tenantSlug}/admin`;

    return [
      {
        label: 'Dashboard',
        icon: 'LayoutDashboard',
        route: `${baseRoute}/dashboard`
      },
      {
        label: 'Propiedades',
        icon: 'Building2',
        route: `${baseRoute}/propiedades`
      },
      {
        label: 'Inquilinos',
        icon: 'Users',
        route: `${baseRoute}/inquilinos`
      },
      {
        label: 'Contratos',
        icon: 'FileText',
        route: `${baseRoute}/contratos`
      },
      {
        label: 'Pagos',
        icon: 'CreditCard',
        route: `${baseRoute}/pagos`
      },
      {
        label: 'Mantenimiento',
        icon: 'Wrench',
        route: `${baseRoute}/mantenimiento`
      },
      {
        label: 'Componentes UI',
        icon: 'Component',
        route: `${baseRoute}/componentes`
      },
      {
        label: 'Reportes',
        icon: 'BarChart3',
        route: `${baseRoute}/reportes`
      },
      {
        label: 'Configuración',
        icon: 'Settings',
        route: `${baseRoute}/configuracion`
      }
    ];
  }
}
