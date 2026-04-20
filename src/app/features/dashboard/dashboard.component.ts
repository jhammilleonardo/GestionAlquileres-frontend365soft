import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { SlugService } from '../../core/services/slug.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [TranslocoModule],
  providers: [provideTranslocoScope('dashboard')],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private router = inject(Router);
  private slugService = inject(SlugService);

  accessDenied = signal(false);

  constructor() {
    // Angular Router persiste el navigation state en history.state tras la navegación
    const navState = history.state as { accessDenied?: boolean } | undefined;
    if (navState?.accessDenied) {
      this.accessDenied.set(true);
      setTimeout(() => this.accessDenied.set(false), 5000);
    }
  }

  goToPublicProperties(): void {
    const slug = this.slugService.getSlug();
    void this.router.navigate([slug, 'publico', 'propiedades']);
  }
}
