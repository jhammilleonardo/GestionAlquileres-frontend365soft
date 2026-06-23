import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  Download,
  CheckCircle2,
  Home,
  User,
  Calendar,
  MapPin,
  Wallet,
  FileText,
  LogOut,
  Building2,
  Wrench,
  Mail,
  Phone,
  Eye,
  Clock,
  Tag,
  UserCog,
} from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';

import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { AppEmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AppLoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { AppStatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { LanguageService } from '../../core/services/language.service';
import { OwnerAuthService } from '../../core/services/owner/owner-auth.service';
import { SlugService } from '../../core/services/slug.service';
import { OwnerPortalFacade } from './owner-portal.facade';

@Component({
  selector: 'app-owner-portal',
  standalone: true,
  imports: [
    CurrencyPipe,
    TranslocoModule,
    LucideAngularModule,
    AppButtonComponent,
    AppEmptyStateComponent,
    AppLoadingStateComponent,
    AppStatusBadgeComponent,
  ],
  templateUrl: './owner-portal.component.html',
  styleUrl: './owner-portal.component.scss',
  providers: [OwnerPortalFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OwnerPortalComponent {
  readonly facade = inject(OwnerPortalFacade);
  readonly auth = inject(OwnerAuthService);
  readonly languageService = inject(LanguageService);
  private readonly router = inject(Router);
  private readonly slugService = inject(SlugService);

  readonly Download = Download;
  readonly CheckCircle2 = CheckCircle2;
  readonly Home = Home;
  readonly User = User;
  readonly Calendar = Calendar;
  readonly MapPin = MapPin;
  readonly Wallet = Wallet;
  readonly FileText = FileText;
  readonly LogOut = LogOut;
  readonly Building2 = Building2;
  readonly Wrench = Wrench;
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly Eye = Eye;
  readonly Clock = Clock;
  readonly Tag = Tag;
  readonly UserCog = UserCog;

  constructor() {
    this.facade.load();
  }

  logout(): void {
    const slug = this.slugService.getSlug();
    this.auth.logout();
    void this.router.navigate(['/', slug, 'owner', 'login']);
  }
}
