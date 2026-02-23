import { Component, inject, computed, DestroyRef, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Building2, LayoutDashboard, Users, FileText, CreditCard, Wrench, Component as ComponentIcon, BarChart3, Settings, Bell, FileCheck } from 'lucide-angular';

import { SidebarService } from '../../../core/services/sidebar.service';
import { AuthService } from '../../../core/services/auth.service';
import { SlugService } from '../../../core/services/slug.service';
import { MenuOption } from '../../../core/models/user.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    LucideAngularModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})

export class SidebarComponent implements OnInit, OnDestroy {
  private sidebarService = inject(SidebarService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private slugService = inject(SlugService);
  private destroyRef = inject(DestroyRef);

  expanded = this.sidebarService.expanded;
  isMobileOpen = this.sidebarService.mobileOpen;

  // Computed para generar opciones de menú con rutas dinámicas que incluyen el slug
  menuOptions = computed<MenuOption[]>(() => {
    const baseOptions = this.sidebarService.getMenuOptions();
    return baseOptions.map(option => ({
      ...option,
      route: this.slugService.buildUrl(option.route)
    }));
  });

  // Lucide icons
  readonly Building2 = Building2;
  readonly LayoutDashboard = LayoutDashboard;
  readonly Users = Users;
  readonly FileText = FileText;
  readonly FileCheck = FileCheck;
  readonly CreditCard = CreditCard;
  readonly Wrench = Wrench;
  readonly ComponentIcon = ComponentIcon;
  readonly BarChart3 = BarChart3;
  readonly Settings = Settings;
  readonly Bell = Bell;

  getIconComponent(iconName: string) {
    const iconMap: Record<string, any> = {
      'LayoutDashboard': LayoutDashboard,
      'Building2': Building2,
      'Users': Users,
      'FileText': FileText,
      'FileCheck': FileCheck,
      'CreditCard': CreditCard,
      'Wrench': Wrench,
      'Component': ComponentIcon,
      'BarChart3': BarChart3,
      'Settings': Settings,
      'Bell': Bell
    };
    return iconMap[iconName] || Settings;
  }

  ngOnInit(): void {
    // Escuchar cambios de tamaño de pantalla
    const resizeObserver = () => {
      if (!this.sidebarService.isMobile() && this.sidebarService.mobileOpen()) {
        this.sidebarService.closeMobile();
      }
    };

    window.addEventListener('resize', resizeObserver);

    // Limpiar el listener al destruir el componente
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('resize', resizeObserver);
      document.body.style.overflow = '';
    });
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
