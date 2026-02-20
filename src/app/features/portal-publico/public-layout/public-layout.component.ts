import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { SlugService } from '../../../core/services/slug.service';

@Component({
    selector: 'app-public-layout',
    standalone: true,
    imports: [RouterOutlet, NavbarComponent, FooterComponent],
    template: `
    <div class="public-layout">
      <app-navbar></app-navbar>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
      <app-footer></app-footer>
    </div>
  `,
    styles: [`
    .public-layout {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .main-content {
      flex: 1;
    }
  `]
})
export class PublicLayoutComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private slugService = inject(SlugService);

  ngOnInit(): void {
    // Obtener el slug de la ruta padre y establecerlo en el servicio
    this.route.parent?.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        console.log('Portal Público - Estableciendo slug:', slug);
        this.slugService.setSlug(slug);
      }
    });
  }
}
