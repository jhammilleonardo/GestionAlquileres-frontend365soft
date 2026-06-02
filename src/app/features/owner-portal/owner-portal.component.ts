import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideAngularModule, Download, CheckCircle2, Home, User, Calendar } from 'lucide-angular';

import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { AppEmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AppLoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { AppPageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { AppStatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { OwnerPortalFacade } from './owner-portal.facade';

@Component({
  selector: 'app-owner-portal',
  standalone: true,
  imports: [
    CurrencyPipe,
    LucideAngularModule,
    AppButtonComponent,
    AppEmptyStateComponent,
    AppLoadingStateComponent,
    AppPageHeaderComponent,
    AppStatusBadgeComponent,
  ],
  templateUrl: './owner-portal.component.html',
  styleUrl: './owner-portal.component.scss',
  providers: [OwnerPortalFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OwnerPortalComponent {
  readonly facade = inject(OwnerPortalFacade);

  readonly Download = Download;
  readonly CheckCircle2 = CheckCircle2;
  readonly Home = Home;
  readonly User = User;
  readonly Calendar = Calendar;

  constructor() {
    this.facade.load();
  }
}
