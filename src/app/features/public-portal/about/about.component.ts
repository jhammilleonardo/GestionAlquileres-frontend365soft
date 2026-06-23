import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { LucideAngularModule, Users, Target, Award, Heart } from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';

import { PublicBrandingService } from '../../../core/services/public-branding.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-about',
  standalone: true,
  imports: [LucideAngularModule, TranslocoModule],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css'],
})
export class AboutComponent {
  readonly Users = Users;
  readonly Target = Target;
  readonly Award = Award;
  readonly Heart = Heart;

  private readonly brandingService = inject(PublicBrandingService);

  // Contenido "Quiénes somos" personalizado por el tenant (con fallback a i18n)
  readonly aboutContent = computed(() => this.brandingService.branding()?.about_content || null);

  // Íconos fijos por posición — el tenant edita texto, el ícono se asigna por orden
  private readonly valueIcons = [this.Heart, this.Target, this.Award, this.Users];

  // Valores personalizados por el tenant (con fallback a los 4 valores i18n por defecto)
  readonly values = computed(() =>
    (this.brandingService.branding()?.about_values ?? []).map((v, i) => ({
      icon: this.valueIcons[i % this.valueIcons.length],
      title: v.title,
      description: v.description,
    })),
  );
  readonly hasCustomValues = computed(() => this.values().length > 0);
}
