import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import {
  Download,
  Eye,
  FileText,
  Home,
  LucideAngularModule,
  Pencil,
  Plus,
  RotateCcw,
} from 'lucide-angular';

import {
  Contract,
  ContractStatus,
  contractStatusLabelKey,
} from '../../../../core/models/contract.model';
import { TenantCurrencyPipe } from '../../../../shared/pipes/tenant-currency.pipe';
import { TenantDatePipe } from '../../../../shared/pipes/tenant-date.pipe';
import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { AppSkeletonTableComponent } from '../../../../shared/ui/skeleton/skeleton-table.component';
import {
  AppStatusBadgeComponent,
  AppStatusTone,
} from '../../../../shared/ui/status-badge/status-badge.component';

@Component({
  selector: 'app-contract-list',
  standalone: true,
  imports: [
    RouterModule,
    LucideAngularModule,
    TranslocoModule,
    TenantDatePipe,
    TenantCurrencyPipe,
    AppButtonComponent,
    AppSkeletonTableComponent,
    AppStatusBadgeComponent,
  ],
  templateUrl: './contract-list.component.html',
  styleUrl: './contract-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContractListComponent {
  readonly contracts = input.required<readonly Contract[]>();
  readonly loading = input(false);
  readonly emptyLoading = input(false);
  readonly detailUrl = input.required<(id: number) => string>();
  readonly editUrl = input.required<(id: number) => string>();
  readonly statusTone = input.required<(status: ContractStatus) => AppStatusTone>();

  readonly createRequested = output<void>();
  readonly pdfRequested = output<number>();
  readonly renewRequested = output<number>();

  /** Clave de traducción del estado (distingue el borrador de renovación). */
  statusLabelKey(contract: Contract): string {
    return contractStatusLabelKey(contract);
  }

  readonly ContractStatus = ContractStatus;
  readonly FileText = FileText;
  readonly Home = Home;
  readonly Eye = Eye;
  readonly Pencil = Pencil;
  readonly Download = Download;
  readonly RotateCcw = RotateCcw;
  readonly Plus = Plus;
}
