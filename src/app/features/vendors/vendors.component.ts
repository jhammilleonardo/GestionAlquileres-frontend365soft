import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule, provideTranslocoScope } from '@jsverse/transloco';
import {
  BriefcaseBusiness,
  ClipboardCheck,
  DollarSign,
  LucideAngularModule,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
} from 'lucide-angular';

import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { AppEmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AppLoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { AppPageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { AppSelectComponent } from '../../shared/ui/select/select.component';
import { TenantCurrencyPipe } from '../../shared/pipes/tenant-currency.pipe';
import { VendorDetailPanelComponent } from './components/vendor-detail-panel/vendor-detail-panel.component';
import { VendorFormDialogComponent } from './components/vendor-form-dialog/vendor-form-dialog.component';
import { VendorListComponent } from './components/vendor-list/vendor-list.component';
import { VendorsFacade } from './vendors.facade';

@Component({
  selector: 'app-vendors',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslocoModule,
    LucideAngularModule,
    AppButtonComponent,
    AppSelectComponent,
    TenantCurrencyPipe,
    AppLoadingStateComponent,
    AppEmptyStateComponent,
    AppPageHeaderComponent,
    VendorDetailPanelComponent,
    VendorFormDialogComponent,
    VendorListComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'vendors', alias: 'vendors' })],
  templateUrl: './vendors.component.html',
  styleUrl: './vendors.component.scss',
})
export class VendorsComponent extends VendorsFacade {
  readonly Plus = Plus;
  readonly Search = Search;
  readonly RotateCcw = RotateCcw;
  readonly BriefcaseBusiness = BriefcaseBusiness;
  readonly ClipboardCheck = ClipboardCheck;
  readonly DollarSign = DollarSign;
  readonly ShieldCheck = ShieldCheck;
}
