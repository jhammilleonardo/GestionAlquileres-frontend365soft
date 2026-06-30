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
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, UserPlus, RefreshCw, Users, KeyRound, Search } from 'lucide-angular';
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
import { AppTextFieldComponent } from '../../shared/ui/text-field/text-field.component';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { getApiErrorMessage } from '../../core/http/http-error.util';

@Component({
  selector: 'app-rental-owners',
  standalone: true,
  providers: [provideTranslocoScope({ scope: 'propietarios', alias: 'rentalOwners' })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    FormsModule,
    LucideAngularModule,
    TranslocoModule,
    CreateOwnerDialogComponent,
    OwnerDetailPanelComponent,
    AppButtonComponent,
    AppDialogComponent,
    AppEmptyStateComponent,
    AppLoadingStateComponent,
    AppPageHeaderComponent,
    AppTextFieldComponent,
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
  private confirmDialog = inject(ConfirmDialogService);

  readonly UserPlusIcon = UserPlus;
  readonly RefreshCwIcon = RefreshCw;
  readonly UsersIcon = Users;
  readonly KeyRoundIcon = KeyRound;
  readonly SearchIcon = Search;

  owners = signal<RentalOwnerSummary[]>([]);
  selectedOwner = signal<RentalOwnerSummary | null>(null);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  isCreateDialogOpen = signal(false);
  searchTerm = signal('');

  /** Propietario en edición (null = el diálogo está en modo creación). */
  editingOwner = signal<RentalOwnerSummary | null>(null);

  isPanelOpen = computed(() => this.selectedOwner() !== null);

  readonly filteredOwners = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.owners();
    return this.owners().filter((owner) =>
      [owner.name, owner.primary_email, owner.phone_number, owner.company_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  });

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
    this.editingOwner.set(null);
    this.isCreateDialogOpen.set(true);
  }

  openEditDialog(owner: RentalOwnerSummary): void {
    this.editingOwner.set(owner);
    this.isCreateDialogOpen.set(true);
  }

  closeCreateDialog(): void {
    this.isCreateDialogOpen.set(false);
    this.editingOwner.set(null);
  }

  onSearch(value: string): void {
    this.searchTerm.set(value);
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

  onOwnerUpdated(owner: RentalOwner): void {
    this.closeCreateDialog();
    this.toast.success(
      this.transloco.translate('rentalOwners.updatedSuccess', { name: owner.name }),
    );
    // Reflejar cambios en el panel abierto sin perder los datos derivados.
    this.selectedOwner.update((prev) => (prev ? { ...prev, ...owner } : prev));
    this.loadOwners();
  }

  async deactivateOwner(owner: RentalOwnerSummary): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.transloco.translate('rentalOwners.deactivateTitle'),
      message: this.transloco.translate('rentalOwners.deactivateMessage', { name: owner.name }),
      confirmLabel: this.transloco.translate('rentalOwners.deactivate'),
      cancelLabel: this.transloco.translate('common.cancel'),
      variant: 'danger',
    });
    if (!confirmed) return;

    const slug = this.slugService.getSlug()!;
    this.rentalOwnersService
      .deactivate(slug, owner.id)
      .pipe(
        catchError((err: { error?: { message?: string } }) => {
          this.toast.error(
            getApiErrorMessage(err, this.transloco.translate('rentalOwners.deactivateError')),
          );
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.toast.success(
          this.transloco.translate('rentalOwners.deactivatedSuccess', { name: owner.name }),
        );
        this.closePanel();
        this.loadOwners();
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
