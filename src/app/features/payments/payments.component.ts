import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule, provideTranslocoScope } from '@jsverse/transloco';
import {
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Download,
  ExternalLink,
  Eye,
  Filter,
  LucideAngularModule,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TrendingUp,
  X,
  XCircle,
} from 'lucide-angular';

import { TenantCurrencyPipe } from '../../shared/pipes/tenant-currency.pipe';
import { TenantDatePipe } from '../../shared/pipes/tenant-date.pipe';
import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { AppDatePickerComponent } from '../../shared/ui/date-picker/date-picker.component';
import { AppDialogComponent } from '../../shared/ui/dialog/dialog.component';
import { AppLoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { AppPageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { AppSelectComponent } from '../../shared/ui/select/select.component';
import { AppStatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { AppTextareaComponent } from '../../shared/ui/textarea/textarea.component';
import { PaymentCreateDialogComponent } from './components/payment-create-dialog/payment-create-dialog.component';
import { PaymentProofDialogComponent } from './components/payment-proof-dialog/payment-proof-dialog.component';
import { PaymentStatsComponent } from './components/payment-stats/payment-stats.component';
import { PaymentTableComponent } from './components/payment-table/payment-table.component';
import { PaymentsFacade } from './payments.facade';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    TranslocoModule,
    TenantDatePipe,
    TenantCurrencyPipe,
    AppButtonComponent,
    AppDatePickerComponent,
    AppDialogComponent,
    AppLoadingStateComponent,
    AppPageHeaderComponent,
    AppSelectComponent,
    AppStatusBadgeComponent,
    AppTextareaComponent,
    PaymentCreateDialogComponent,
    PaymentProofDialogComponent,
    PaymentTableComponent,
    PaymentStatsComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'pagos', alias: 'payments' })],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentsComponent extends PaymentsFacade {
  readonly DollarSign = DollarSign;
  readonly TrendingUp = TrendingUp;
  readonly AlertCircle = AlertCircle;
  readonly CheckCircle2 = CheckCircle2;
  readonly XCircle = XCircle;
  readonly Filter = Filter;
  readonly Eye = Eye;
  readonly RefreshCw = RefreshCw;
  readonly Plus = Plus;
  readonly X = X;
  readonly Search = Search;
  readonly Download = Download;
  readonly Trash2 = Trash2;
  readonly ExternalLink = ExternalLink;
}
