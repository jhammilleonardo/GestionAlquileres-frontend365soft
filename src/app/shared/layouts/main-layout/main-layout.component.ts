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
    // Asegurar que el slug esté establecido desde la ruta
    // El slug está en la ruta padre, no en la ruta actual
    const slug = this.route.snapshot.parent?.paramMap.get('slug') || 
                 this.route.parent?.snapshot.paramMap.get('slug');
    if (slug) {
      console.log('MainLayout: Estableciendo slug desde ruta padre:', slug);
      this.slugService.setSlug(slug);
    } else {
      console.warn('MainLayout: No se encontró slug en la ruta padre');
      // Intentar cargar desde localStorage como fallback
      const storedSlug = this.slugService.getSlug();
      if (storedSlug) {
        console.log('MainLayout: Usando slug desde localStorage:', storedSlug);
      }
    }
  }

  closeSidebarMobile(): void {
    this.sidebarService.closeMobile();
  }
}
