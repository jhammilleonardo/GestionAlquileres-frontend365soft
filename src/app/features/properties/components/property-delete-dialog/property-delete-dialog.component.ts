import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { LucideAngularModule, Trash2 } from 'lucide-angular';

import { Property } from '../../../../core/models/property.model';
import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { AppDialogComponent } from '../../../../shared/ui/dialog/dialog.component';

@Component({
  selector: 'app-property-delete-dialog',
  standalone: true,
  imports: [LucideAngularModule, TranslocoModule, AppButtonComponent, AppDialogComponent],
  templateUrl: './property-delete-dialog.component.html',
  styleUrl: './property-delete-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyDeleteDialogComponent {
  readonly property = input.required<Property>();

  readonly cancelled = output<void>();
  readonly confirmed = output<void>();

  readonly Trash2 = Trash2;
}
