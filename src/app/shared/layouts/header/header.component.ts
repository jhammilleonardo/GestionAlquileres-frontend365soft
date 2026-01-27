import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { LucideAngularModule, Menu, Bell, Search, ChevronDown, LogOut } from 'lucide-angular';

import { AuthService } from '../../../core/services/auth.service';
import { SidebarService } from '../../../core/services/sidebar.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    LucideAngularModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private sidebarService = inject(SidebarService);
  private router = inject(Router);

  currentUser = this.authService.currentUser;
  notificationCount = signal(5);

  // Lucide icons
  readonly Menu = Menu;
  readonly Bell = Bell;
  readonly Search = Search;
  readonly ChevronDown = ChevronDown;
  readonly LogOut = LogOut;

  toggleSidebar(): void {
    this.sidebarService.toggle();
  }

  goToProfile(): void {
    this.router.navigate(['/perfil']);
  }

  goToSettings(): void {
    this.router.navigate(['/configuracion']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
