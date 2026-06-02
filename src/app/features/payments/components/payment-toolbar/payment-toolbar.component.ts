import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { Download, Filter, LucideAngularModule, Plus, RefreshCw } from 'lucide-angular';

import { AppButtonComponent } from '../../../../shared/ui/button/button.component';

@Component({
  selector: 'app-payment-toolbar',
  standalone: true,
  imports: [LucideAngularModule, TranslocoModule, AppButtonComponent],
  templateUrl: './payment-toolbar.component.html',
  styleUrl: './payment-toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentToolbarComponent {
  readonly loading = input(false);

  readonly refreshed = output<void>();
  readonly exported = output<void>();
  readonly createOpened = output<void>();
  readonly filtersToggled = output<void>();

  readonly Download = Download;
  readonly Filter = Filter;
  readonly Plus = Plus;
  readonly RefreshCw = RefreshCw;
}
