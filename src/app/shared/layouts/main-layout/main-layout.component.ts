import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { SidebarService } from '../../../core/services/sidebar.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    SidebarComponent,
    HeaderComponent
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  private sidebarService = inject(SidebarService);
  sidebarExpanded = this.sidebarService.expanded;
}
