import { Injectable, signal } from '@angular/core';
import { MenuOption } from '../models/user.model';
import { Bell, FileCheck } from 'lucide-angular';

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
    // Retornar rutas SIN el slug - el sidebar.component.ts agregará el slug dinámicamente
    // Las rutas coinciden con app.routes.ts: :slug/dashboard, :slug/propiedades, etc.
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
        label: 'Solicitudes',
        icon: 'FileCheck',
        route: '/solicitudes'
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
        label: 'Perfil',
        icon: 'User',
        route: '/perfil'
      },
      {
        label: 'Configuración',
        icon: 'Settings',
        route: '/configuracion'
      }
    ];
  }
}
