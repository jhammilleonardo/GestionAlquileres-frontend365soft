import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Building2, PanelLeftClose, PanelLeftOpen, LayoutDashboard, Users, FileText, CreditCard, Wrench, Component as ComponentIcon, BarChart3, Settings } from 'lucide-angular';

import { SidebarService } from '../../../core/services/sidebar.service';
import { AuthService } from '../../../core/services/auth.service';
import { MenuOption } from '../../../core/models/user.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatMenuModule,
    LucideAngularModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  private sidebarService = inject(SidebarService);
  private authService = inject(AuthService);
  private router = inject(Router);

  expanded = this.sidebarService.expanded;
  menuOptions = signal<MenuOption[]>(this.sidebarService.getMenuOptions());
  currentUser = this.authService.currentUser;

  // Lucide icons
  readonly Building2 = Building2;
  readonly PanelLeftClose = PanelLeftClose;
  readonly PanelLeftOpen = PanelLeftOpen;
  readonly LayoutDashboard = LayoutDashboard;
  readonly Users = Users;
  readonly FileText = FileText;
  readonly CreditCard = CreditCard;
  readonly Wrench = Wrench;
  readonly ComponentIcon = ComponentIcon;
  readonly BarChart3 = BarChart3;
  readonly Settings = Settings;

  getIconComponent(iconName: string) {
    const iconMap: Record<string, any> = {
      'LayoutDashboard': LayoutDashboard,
      'Building2': Building2,
      'Users': Users,
      'FileText': FileText,
      'CreditCard': CreditCard,
      'Wrench': Wrench,
      'Component': ComponentIcon,
      'BarChart3': BarChart3,
      'Settings': Settings
    };
    return iconMap[iconName] || Settings;
  }

  toggleSidebar(): void {
    this.sidebarService.toggle();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
