import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { CreditCard, FileText, LucideAngularModule, MessageSquare, Wrench } from 'lucide-angular';

@Component({
  selector: 'app-tenant-dashboard-quick-actions',
  standalone: true,
  imports: [RouterModule, LucideAngularModule, TranslocoModule],
  templateUrl: './tenant-dashboard-quick-actions.component.html',
  styleUrl: './tenant-dashboard-quick-actions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantDashboardQuickActionsComponent {
  readonly maintenanceCreateUrl = input.required<string>();
  readonly paymentCreateUrl = input.required<string>();
  readonly messagesUrl = input.required<string>();
  readonly documentsUrl = input.required<string>();

  readonly Wrench = Wrench;
  readonly CreditCard = CreditCard;
  readonly MessageSquare = MessageSquare;
  readonly FileText = FileText;
}
