import { Injectable, signal } from '@angular/core';
import { MenuOption } from '../models/user.model';
import { Bell } from 'lucide-angular';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private expandedSignal = signal(true);
  expanded = this.expandedSignal.asReadonly();

  // Estado del sidebar en móvil
  private mobileOpenSignal = signal(false);
  mobileOpen = this.mobileOpenSignal.asReadonly();

  toggle(): void {
    this.expandedSignal.update(value => !value);
  }

  expand(): void {
    this.expandedSignal.set(true);
  }

  collapse(): void {
    this.expandedSignal.set(false);
  }

  // Métodos para control móvil del sidebar
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
        label: 'Notificaciones',
        icon: 'Bell',
        route: '/notificaciones'
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
