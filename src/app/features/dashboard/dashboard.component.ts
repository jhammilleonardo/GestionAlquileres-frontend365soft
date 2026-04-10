import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SlugService } from '../../core/services/slug.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  private slugService = inject(SlugService);

  accessDenied = signal(false);

  ngOnInit(): void {
    const state = this.router.getCurrentNavigation()?.extras.state as
      | { accessDenied?: boolean }
      | undefined;
    if (state?.accessDenied) {
      this.accessDenied.set(true);
      setTimeout(() => this.accessDenied.set(false), 5000);
    }
  }

  goToPublicProperties(): void {
    const slug = this.slugService.getSlug();
    void this.router.navigate([slug, 'publico', 'propiedades']);
  }
}
