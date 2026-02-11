import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SlugService } from '../../core/services/slug.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  private router = inject(Router);
  private slugService = inject(SlugService);

  goToPublicProperties() {
    const slug = this.slugService.getSlug();
    this.router.navigate([slug, 'publico', 'propiedades']);
  }
}
