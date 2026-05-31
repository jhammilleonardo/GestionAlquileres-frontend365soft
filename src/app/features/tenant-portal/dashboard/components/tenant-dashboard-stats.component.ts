import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { FileText, LucideAngularModule, MessageSquare, Wrench } from 'lucide-angular';

@Component({
  selector: 'app-tenant-dashboard-stats',
  standalone: true,
  imports: [LucideAngularModule, TranslocoModule],
  templateUrl: './tenant-dashboard-stats.component.html',
  styleUrl: './tenant-dashboard-stats.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantDashboardStatsComponent {
  readonly loading = input(false);
  readonly activeRequests = input(0);
  readonly unreadMessages = input(0);
  readonly documentsCount = input(0);

  readonly Wrench = Wrench;
  readonly MessageSquare = MessageSquare;
  readonly FileText = FileText;
}
