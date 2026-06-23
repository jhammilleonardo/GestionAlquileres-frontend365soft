import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { Building2, LucideAngularModule, Plus } from 'lucide-angular';

import { Property } from '../../../../core/models/property.model';
import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { AppSkeletonCardGridComponent } from '../../../../shared/ui/skeleton/skeleton-card-grid.component';
import { PropertyCardComponent } from '../property-card/property-card.component';

@Component({
  selector: 'app-property-list-section',
  standalone: true,
  imports: [
    LucideAngularModule,
    TranslocoModule,
    AppButtonComponent,
    AppSkeletonCardGridComponent,
    PropertyCardComponent,
  ],
  templateUrl: './property-list-section.component.html',
  styleUrl: './property-list-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyListSectionComponent {
  readonly properties = input<readonly Property[]>([]);
  readonly loading = input(false);
  readonly imageResolver = input.required<(property: Property) => string>();

  readonly createOpened = output<void>();
  readonly viewed = output<Property>();
  readonly edited = output<Property>();
  readonly statusToggled = output<Property>();
  readonly deleted = output<Property>();
  readonly imageFailed = output<{ property: Property; url: string }>();

  readonly Building2 = Building2;
  readonly Plus = Plus;
}
