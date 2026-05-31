import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, ActivatedRoute } from '@angular/router';

import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { SidebarService } from '../../../core/services/sidebar.service';
import { SlugService } from '../../../core/services/slug.service';
import { TenantConfigService } from '../../../core/services/admin/tenant-config.service';
import { FormatService } from '../../../core/services/format.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent implements OnInit {
  private sidebarService = inject(SidebarService);
  private route = inject(ActivatedRoute);
  private slugService = inject(SlugService);
  private tenantConfigService = inject(TenantConfigService);
  private formatService = inject(FormatService);

  sidebarExpanded = this.sidebarService.expanded;
  isSidebarMobileOpen = this.sidebarService.mobileOpen;

  ngOnInit(): void {
    // Read slug from the route parent (e.g. /:slug → path: ':slug')
    const routeSlug =
      this.route.snapshot.parent?.paramMap.get('slug') ||
      this.route.parent?.snapshot.paramMap.get('slug');

    const currentSlug = this.slugService.getSlug();

    if (routeSlug && routeSlug !== currentSlug) {
      this.slugService.setSlug(routeSlug);
    }

    const slug = routeSlug ?? this.slugService.getSlug();
    if (slug) {
      this.tenantConfigService.getConfig(slug).subscribe({
        next: (config) => this.formatService.setConfig(config),
      });
    }
  }

  closeSidebarMobile(): void {
    this.sidebarService.closeMobile();
  }
}
