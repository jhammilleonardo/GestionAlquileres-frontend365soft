import {
  Component,
  inject,
  signal,
  computed,
  DestroyRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { LucideAngularModule, UserPlus, RefreshCw, Users, KeyRound } from 'lucide-angular';
import { catchError, EMPTY } from 'rxjs';
import { TranslocoModule, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';

import { RentalOwnersService } from '../../core/services/admin/rental-owners.service';
import { SlugService } from '../../core/services/slug.service';
import type { RentalOwner, RentalOwnerSummary } from '../../core/models/rental-owner.model';
import { CreateOwnerDialogComponent } from './components/create-owner-dialog/create-owner-dialog.component';
import { OwnerDetailPanelComponent } from './components/owner-detail-panel/owner-detail-panel.component';
import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { AppDialogComponent } from '../../shared/ui/dialog/dialog.component';
import { AppEmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AppLoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { AppPageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { getApiErrorMessage } from '../../core/http/http-error.util';

@Component({
  selector: 'app-rental-owners',
  standalone: true,
  providers: [provideTranslocoScope({ scope: 'propietarios', alias: 'rentalOwners' })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    LucideAngularModule,
    TranslocoModule,
    CreateOwnerDialogComponent,
    OwnerDetailPanelComponent,
    AppButtonComponent,
    AppDialogComponent,
    AppEmptyStateComponent,
    AppLoadingStateComponent,
    AppPageHeaderComponent,
  ],
  templateUrl: './rental-owners.component.html',
  styleUrl: './rental-owners.component.scss',
})
export class RentalOwnersComponent {
  private rentalOwnersService = inject(RentalOwnersService);
  private slugService = inject(SlugService);
  private transloco = inject(TranslocoService);
  private destroyRef = inject(DestroyRef);
  private toast = inject(ToastService);

  readonly UserPlusIcon = UserPlus;
  readonly RefreshCwIcon = RefreshCw;
  readonly UsersIcon = Users;
  readonly KeyRoundIcon = KeyRound;

  owners = signal<RentalOwnerSummary[]>([]);
  selectedOwner = signal<RentalOwnerSummary | null>(null);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  isCreateDialogOpen = signal(false);

  isPanelOpen = computed(() => this.selectedOwner() !== null);

  constructor() {
    this.loadOwners();
  }

  loadOwners(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    const slug = this.slugService.getSlug()!;

    this.rentalOwnersService
      .findAll(slug)
      .pipe(
        catchError((err: { error?: { message?: string } }) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            getApiErrorMessage(err, this.transloco.translate('rentalOwners.loadError')),
          );
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((list) => {
        this.owners.set(list);
        this.isLoading.set(false);
        // Mantener el panel sincronizado con los datos recargados.
        const current = this.selectedOwner();
        if (current) {
          this.selectedOwner.set(list.find((o) => o.id === current.id) ?? null);
        }
      });
  }

  selectOwner(owner: RentalOwnerSummary): void {
    this.selectedOwner.set(this.selectedOwner()?.id === owner.id ? null : owner);
  }

  closePanel(): void {
    this.selectedOwner.set(null);
  }

  openCreateDialog(): void {
    this.isCreateDialogOpen.set(true);
  }

  closeCreateDialog(): void {
    this.isCreateDialogOpen.set(false);
  }

  onOwnerCreated(owner: RentalOwner): void {
    this.isCreateDialogOpen.set(false);
    this.toast.success(
      this.transloco.translate('rentalOwners.createdSuccess', { name: owner.name }),
    );
    this.loadOwners();
    // Abrir el panel del nuevo propietario para continuar con propiedades/cuenta.
    this.selectedOwner.set({
      ...owner,
      properties_count: 0,
      pending_balance: 0,
      has_account: false,
    });
  }

  onAccountChanged(): void {
    this.loadOwners();
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }
}
