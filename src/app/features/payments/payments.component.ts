import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoModule, provideTranslocoScope } from '@jsverse/transloco';
import { AlertCircle, LucideAngularModule } from 'lucide-angular';

import { AppPageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { PaymentBulkActionsComponent } from './components/payment-bulk-actions/payment-bulk-actions.component';
import { PaymentCreateDialogComponent } from './components/payment-create-dialog/payment-create-dialog.component';
import { PaymentDetailDialogComponent } from './components/payment-detail-dialog/payment-detail-dialog.component';
import { PaymentFiltersComponent } from './components/payment-filters/payment-filters.component';
import { PaymentListSectionComponent } from './components/payment-list-section/payment-list-section.component';
import { PaymentProofDialogComponent } from './components/payment-proof-dialog/payment-proof-dialog.component';
import { PaymentRejectDialogComponent } from './components/payment-reject-dialog/payment-reject-dialog.component';
import { PaymentStatsComponent } from './components/payment-stats/payment-stats.component';
import { PaymentToolbarComponent } from './components/payment-toolbar/payment-toolbar.component';
import { PendingApprovalPanelComponent } from './components/pending-approval-panel/pending-approval-panel.component';
import { PaymentsFacade } from './payments.facade';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [
    LucideAngularModule,
    TranslocoModule,
    AppPageHeaderComponent,
    PaymentBulkActionsComponent,
    PaymentCreateDialogComponent,
    PaymentDetailDialogComponent,
    PaymentFiltersComponent,
    PaymentListSectionComponent,
    PaymentProofDialogComponent,
    PaymentRejectDialogComponent,
    PaymentStatsComponent,
    PaymentToolbarComponent,
    PendingApprovalPanelComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'pagos', alias: 'payments' })],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentsComponent extends PaymentsFacade {
  readonly AlertCircle = AlertCircle;
}
