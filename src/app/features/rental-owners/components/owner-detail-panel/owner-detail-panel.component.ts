import {
  Component,
  inject,
  signal,
  computed,
  input,
  output,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { catchError, EMPTY } from 'rxjs';
import {
  LucideAngularModule,
  X,
  KeyRound,
  Copy,
  Check,
  Plus,
  Trash2,
  Building2,
  Mail,
  Phone,
  Send,
  Pencil,
  Ban,
  Link as LinkIcon,
} from 'lucide-angular';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';

import { RentalOwnersService } from '../../../../core/services/admin/rental-owners.service';
import { PropertyService } from '../../../../core/services/admin/property.service';
import { SlugService } from '../../../../core/services/slug.service';
import type {
  OwnerAssignedProperty,
  OwnerContract,
  OwnerStatement,
  RentalOwnerInvite,
  RentalOwnerSummary,
} from '../../../../core/models/rental-owner.model';
import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { AppSelectComponent } from '../../../../shared/ui/select/select.component';
import type { AppSelectOption } from '../../../../shared/ui/select/select.component';
import { AppStatusBadgeComponent } from '../../../../shared/ui/status-badge/status-badge.component';
import type { AppStatusTone } from '../../../../shared/ui/status-badge/status-badge.component';
import { AppTabsComponent } from '../../../../shared/ui/tabs/tabs.component';
import type { AppTabOption } from '../../../../shared/ui/tabs/tabs.component';
import { TenantCurrencyPipe } from '../../../../shared/pipes/tenant-currency.pipe';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { getApiErrorMessage } from '../../../../core/http/http-error.util';

type OwnerTab = 'properties' | 'statements' | 'contracts';

@Component({
  selector: 'app-owner-detail-panel',
  standalone: true,
  providers: [provideTranslocoScope({ scope: 'propietarios', alias: 'rentalOwners' })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FormsModule,
    LucideAngularModule,
    TranslocoModule,
    AppButtonComponent,
    AppSelectComponent,
    AppStatusBadgeComponent,
    AppTabsComponent,
    TenantCurrencyPipe,
  ],
  templateUrl: './owner-detail-panel.component.html',
  styleUrl: './owner-detail-panel.component.scss',
})
export class OwnerDetailPanelComponent {
  private rentalOwnersService = inject(RentalOwnersService);
  private propertyService = inject(PropertyService);
  private slugService = inject(SlugService);
  private transloco = inject(TranslocoService);
  private toast = inject(ToastService);

  readonly XIcon = X;
  readonly KeyRoundIcon = KeyRound;
  readonly CopyIcon = Copy;
  readonly CheckIcon = Check;
  readonly PlusIcon = Plus;
  readonly Trash2Icon = Trash2;
  readonly Building2Icon = Building2;
  readonly MailIcon = Mail;
  readonly PhoneIcon = Phone;
  readonly SendIcon = Send;
  readonly PencilIcon = Pencil;
  readonly BanIcon = Ban;
  readonly LinkIcon = LinkIcon;

  readonly owner = input.required<RentalOwnerSummary>();

  readonly panelClosed = output<void>();
  readonly accountChanged = output<void>();
  readonly editRequested = output<RentalOwnerSummary>();
  readonly deactivateRequested = output<RentalOwnerSummary>();

  // Acceso al portal (invitación)
  readonly inviting = signal(false);
  readonly invite = signal<RentalOwnerInvite | null>(null);
  readonly copied = signal(false);

  readonly hasAccount = computed(() => this.owner().has_account);

  // Pestañas del panel
  readonly activeTab = signal<OwnerTab>('properties');
  readonly tabs = computed<AppTabOption<OwnerTab>[]>(() => [
    { value: 'properties', label: this.transloco.translate('rentalOwners.panel.tabs.properties') },
    { value: 'statements', label: this.transloco.translate('rentalOwners.panel.tabs.statements') },
    { value: 'contracts', label: this.transloco.translate('rentalOwners.panel.tabs.contracts') },
  ]);

  // Liquidaciones y contratos (carga perezosa por pestaña)
  readonly statements = signal<OwnerStatement[]>([]);
  readonly loadingStatements = signal(false);
  readonly statementsLoaded = signal(false);
  readonly contracts = signal<OwnerContract[]>([]);
  readonly loadingContracts = signal(false);
  readonly contractsLoaded = signal(false);

  // Propiedades asignadas
  readonly assignedProperties = signal<OwnerAssignedProperty[]>([]);
  readonly loadingProperties = signal(false);
  // El select usa valores string (el genérico cae a string en plantilla); se castea al asignar.
  readonly selectedPropertyId = signal<string | null>(null);
  readonly assigning = signal(false);
  readonly removingId = signal<number | null>(null);

  // Propiedades disponibles para asignar (DISPONIBLE), excluyendo las ya asignadas
  readonly availableOptions = signal<AppSelectOption<string>[]>([]);

  private get slug(): string {
    return this.slugService.getSlug()!;
  }

  // Último propietario cargado, para distinguir "cambió de dueño" de "se recargó el mismo".
  private loadedOwnerId: number | null = null;

  constructor() {
    effect(() => {
      const current = this.owner();
      // Solo limpiar el enlace/selección al cambiar realmente de propietario;
      // una recarga del mismo (tras invitar) no debe borrar lo que se muestra.
      if (current.id !== this.loadedOwnerId) {
        this.loadedOwnerId = current.id;
        this.invite.set(null);
        this.selectedPropertyId.set(null);
        this.activeTab.set('properties');
        this.statements.set([]);
        this.statementsLoaded.set(false);
        this.contracts.set([]);
        this.contractsLoaded.set(false);
        this.loadProperties(current.id);
      }
    });
  }

  setTab(tab: OwnerTab): void {
    this.activeTab.set(tab);
    if (tab === 'statements' && !this.statementsLoaded()) {
      this.loadStatements(this.owner().id);
    } else if (tab === 'contracts' && !this.contractsLoaded()) {
      this.loadContracts(this.owner().id);
    }
  }

  private loadStatements(ownerId: number): void {
    this.loadingStatements.set(true);
    this.rentalOwnersService
      .getStatements(this.slug, ownerId)
      .pipe(
        catchError((err: { error?: { message?: string } }) => {
          this.loadingStatements.set(false);
          this.toast.error(
            getApiErrorMessage(err, this.transloco.translate('rentalOwners.panel.loadError')),
          );
          return EMPTY;
        }),
      )
      .subscribe((rows) => {
        this.statements.set(rows);
        this.statementsLoaded.set(true);
        this.loadingStatements.set(false);
      });
  }

  private loadContracts(ownerId: number): void {
    this.loadingContracts.set(true);
    this.rentalOwnersService
      .getContracts(this.slug, ownerId)
      .pipe(
        catchError((err: { error?: { message?: string } }) => {
          this.loadingContracts.set(false);
          this.toast.error(
            getApiErrorMessage(err, this.transloco.translate('rentalOwners.panel.loadError')),
          );
          return EMPTY;
        }),
      )
      .subscribe((rows) => {
        this.contracts.set(rows);
        this.contractsLoaded.set(true);
        this.loadingContracts.set(false);
      });
  }

  protected statementPeriod(statement: OwnerStatement): string {
    return `${String(statement.period_month).padStart(2, '0')}/${statement.period_year}`;
  }

  protected statementDeductions(statement: OwnerStatement): number {
    return Number(statement.maintenance_deduction) + Number(statement.management_commission);
  }

  protected contractTone(status: string): AppStatusTone {
    const tones: Record<string, AppStatusTone> = {
      ACTIVO: 'success',
      FIRMADO: 'success',
      POR_VENCER: 'warning',
      PENDIENTE: 'warning',
      BORRADOR: 'neutral',
      VENCIDO: 'danger',
      CANCELADO: 'danger',
      FINALIZADO: 'neutral',
      RENOVADO: 'info',
    };
    return tones[status] ?? 'neutral';
  }

  private loadProperties(ownerId: number): void {
    this.loadingProperties.set(true);
    this.rentalOwnersService
      .getProperties(this.slug, ownerId)
      .pipe(
        catchError((err: { error?: { message?: string } }) => {
          this.loadingProperties.set(false);
          this.toast.error(
            getApiErrorMessage(err, this.transloco.translate('rentalOwners.panel.loadError')),
          );
          return EMPTY;
        }),
      )
      .subscribe((props) => {
        this.assignedProperties.set(props);
        this.loadingProperties.set(false);
        this.loadAvailableOptions();
      });
  }

  private loadAvailableOptions(): void {
    this.propertyService
      .getAdminProperties({ limit: 100 })
      .pipe(catchError(() => EMPTY))
      .subscribe((properties) => {
        const assignedIds = new Set(this.assignedProperties().map((p) => p.id));
        this.availableOptions.set(
          properties
            .filter((p) => !assignedIds.has(p.id))
            .map((p) => ({ value: String(p.id), label: p.title })),
        );
      });
  }

  sendInvite(): void {
    this.inviting.set(true);
    this.rentalOwnersService
      .invite(this.slug, this.owner().id)
      .pipe(
        catchError((err: { error?: { message?: string } }) => {
          this.inviting.set(false);
          this.toast.error(
            getApiErrorMessage(err, this.transloco.translate('rentalOwners.panel.inviteError')),
          );
          return EMPTY;
        }),
      )
      .subscribe((invite) => {
        this.inviting.set(false);
        this.invite.set(invite);
        // Si se creó la cuenta ahora, refrescar la lista para reflejar has_account.
        if (invite.created) {
          this.accountChanged.emit();
        }
        this.toast.success(this.transloco.translate('rentalOwners.panel.inviteSent'));
      });
  }

  copyInviteLink(): void {
    const invite = this.invite();
    if (!invite) return;
    void navigator.clipboard.writeText(invite.inviteUrl).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  assignProperty(): void {
    const selected = this.selectedPropertyId();
    if (selected === null) return;
    const propertyId = Number(selected);

    this.assigning.set(true);
    this.rentalOwnersService
      .assignProperty(this.slug, this.owner().id, { property_id: propertyId })
      .pipe(
        catchError((err: { error?: { message?: string } }) => {
          this.assigning.set(false);
          this.toast.error(
            getApiErrorMessage(err, this.transloco.translate('rentalOwners.panel.assignError')),
          );
          return EMPTY;
        }),
      )
      .subscribe(() => {
        this.assigning.set(false);
        this.selectedPropertyId.set(null);
        this.toast.success(this.transloco.translate('rentalOwners.panel.assigned'));
        this.loadProperties(this.owner().id);
      });
  }

  removeProperty(property: OwnerAssignedProperty): void {
    this.removingId.set(property.id);
    this.rentalOwnersService
      .removeProperty(this.slug, this.owner().id, property.id)
      .pipe(
        catchError((err: { error?: { message?: string } }) => {
          this.removingId.set(null);
          this.toast.error(
            getApiErrorMessage(err, this.transloco.translate('rentalOwners.panel.removeError')),
          );
          return EMPTY;
        }),
      )
      .subscribe(() => {
        this.removingId.set(null);
        this.toast.success(this.transloco.translate('rentalOwners.panel.removed'));
        this.loadProperties(this.owner().id);
      });
  }

  readonly hasAvailable = computed(() => this.availableOptions().length > 0);

  close(): void {
    this.panelClosed.emit();
  }
}
