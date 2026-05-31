import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { FileText, Home, LucideAngularModule } from 'lucide-angular';

import { TenantUser } from '../../../../core/services/tenant/tenant-auth.service';

@Component({
  selector: 'app-tenant-dashboard-welcome',
  standalone: true,
  imports: [LucideAngularModule, TranslocoModule],
  templateUrl: './tenant-dashboard-welcome.component.html',
  styleUrl: './tenant-dashboard-welcome.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantDashboardWelcomeComponent {
  readonly firstName = input.required<string>();
  readonly contract = input<TenantUser['contract'] | null | undefined>(null);

  readonly Home = Home;
  readonly FileText = FileText;
}
