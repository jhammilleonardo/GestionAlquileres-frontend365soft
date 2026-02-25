import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, ActivatedRoute } from '@angular/router';

import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { SidebarService } from '../../../core/services/sidebar.service';
import { SlugService } from '../../../core/services/slug.service';

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
export class MainLayoutComponent implements OnInit {
  private sidebarService = inject(SidebarService);
  private route = inject(ActivatedRoute);
  private slugService = inject(SlugService);
  
  sidebarExpanded = this.sidebarService.expanded;
  isSidebarMobileOpen = this.sidebarService.mobileOpen;

  ngOnInit(): void {
    // Read slug from the route parent (e.g. /:slug → path: ':slug')
    const routeSlug = this.route.snapshot.parent?.paramMap.get('slug') ||
                      this.route.parent?.snapshot.paramMap.get('slug');

    const currentSlug = this.slugService.getSlug();

    if (routeSlug && routeSlug !== currentSlug) {
      // Only update if the route gives us something different (e.g. after page refresh)
      console.log('MainLayout: Actualizando slug desde ruta:', routeSlug);
      this.slugService.setSlug(routeSlug);
    }
    // If both match, or no route slug found, keep what the authGuard already set
  }

  closeSidebarMobile(): void {
    this.sidebarService.closeMobile();
  }
}
