import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { CheckCircle2, Clock, Edit, Eye, FileText } from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';
import {
  Contract,
  ContractStatus,
  TenantContractService,
} from '../../../core/services/tenant/tenant-contract.service';
import { SlugService } from '../../../core/services/slug.service';
import { FormatService } from '../../../core/services/format.service';
import { TenantDatePipe } from '../../../shared/pipes/tenant-date.pipe';
import { TenantCurrencyPipe } from '../../../shared/pipes/tenant-currency.pipe';
import {
  AppButtonComponent,
  AppEmptyStateComponent,
  AppLoadingStateComponent,
  AppSelectComponent,
  AppSelectOption,
  AppStatusBadgeComponent,
  AppStatusTone,
} from '../../../shared/ui';

type ContractStatusFilter = ContractStatus | 'ALL';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tenant-contract-list',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    TranslocoModule,
    TenantDatePipe,
    TenantCurrencyPipe,
    AppButtonComponent,
    AppEmptyStateComponent,
    AppLoadingStateComponent,
    AppSelectComponent,
    AppStatusBadgeComponent,
  ],
  template: `
    <section class="contracts-list">
      <header class="contracts-list__header">
        <div class="contracts-list__title">
          <lucide-icon [img]="FileText" [size]="24"></lucide-icon>
          <h2>{{ 'tenantContracts.title' | transloco }}</h2>
        </div>

        <app-select
          class="contracts-list__filter"
          [(ngModel)]="selectedStatus"
          [label]="'tenantContracts.filterLabel' | transloco"
          [options]="statusOptions()"
        />
      </header>

      @if (contractService.isLoading()) {
        <div class="state-box">
          <app-loading-state [label]="'tenantContracts.loading' | transloco" />
        </div>
      } @else if (filteredContracts().length === 0) {
        <app-empty-state
          [title]="'tenantContracts.noContractsTitle' | transloco"
          [description]="emptyDescription()"
        >
          <lucide-icon icon [img]="FileText" [size]="28"></lucide-icon>
          @if (selectedStatus === 'ALL') {
            <app-button actions appearance="outline" (clicked)="loadContracts()">
              <lucide-icon [img]="Clock" [size]="16"></lucide-icon>
              {{ 'tenantContracts.reload' | transloco }}
            </app-button>
          }
        </app-empty-state>
      } @else {
        <div class="contracts-grid">
          @for (contract of filteredContracts(); track contract.id) {
            <article
              class="contract-card"
              [class.contract-card--pending]="contract.status === ContractStatus.BORRADOR"
            >
              <header class="contract-card__header">
                <app-status-badge
                  [label]="'tenantContracts.status.' + contract.status | transloco"
                  [tone]="statusTone(contract.status)"
                />
              </header>

              <div class="contract-card__body">
                <h3>
                  {{
                    contract.property?.title || ('tenantContracts.propertyNotSpecified' | transloco)
                  }}
                </h3>

                <dl class="contract-meta">
                  <div>
                    <dt>
                      <lucide-icon [img]="Clock" [size]="14"></lucide-icon>
                      {{ 'tenantContracts.startDate' | transloco }}
                    </dt>
                    <dd>{{ contract.start_date | tenantDate }}</dd>
                  </div>
                  <div>
                    <dt>
                      <lucide-icon [img]="Clock" [size]="14"></lucide-icon>
                      {{ 'tenantContracts.endDate' | transloco }}
                    </dt>
                    <dd>{{ contract.end_date | tenantDate }}</dd>
                  </div>
                </dl>

                <div class="rent-box">
                  <span>{{ 'tenantContracts.monthlyRent' | transloco }}</span>
                  <strong>
                    {{ contract.monthly_rent | tenantCurrency }}
                    @if (contract.currency) {
                      {{ contract.currency }}
                    }
                  </strong>
                </div>

                @if (contract.status === ContractStatus.ACTIVO && contract.signed_at) {
                  <div class="inline-alert inline-alert--success">
                    <lucide-icon [img]="CheckCircle2" [size]="16"></lucide-icon>
                    <span>
                      {{
                        'tenantContracts.signedOn'
                          | transloco: { date: formatDate(contract.signed_at) }
                      }}
                    </span>
                  </div>
                }
              </div>

              <footer class="contract-card__actions">
                <app-button appearance="outline" size="s" (clicked)="viewContract(contract.id)">
                  <lucide-icon [img]="Eye" [size]="16"></lucide-icon>
                  {{ 'tenantContracts.viewDetail' | transloco }}
                </app-button>

                @if (contract.status === ContractStatus.BORRADOR) {
                  <app-button appearance="primary" size="s" (clicked)="signContract(contract.id)">
                    <lucide-icon [img]="Edit" [size]="16"></lucide-icon>
                    {{ 'tenantContracts.signNow' | transloco }}
                  </app-button>
                }
              </footer>
            </article>
          }
        </div>
      }
    </section>
  `,
  styles: `
    .contracts-list {
      display: grid;
      gap: var(--app-space-6);
    }

    .contracts-list__header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: var(--app-space-4);
    }

    .contracts-list__title {
      display: flex;
      align-items: center;
      gap: var(--app-space-3);
      color: var(--app-color-text);
    }

    .contracts-list__title h2 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 780;
    }

    .contracts-list__filter {
      inline-size: min(100%, 260px);
    }

    .state-box {
      display: grid;
      min-block-size: 18rem;
      place-items: center;
    }

    .contracts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
      gap: var(--app-space-4);
    }

    .contract-card {
      display: grid;
      grid-template-rows: auto minmax(0, 1fr) auto;
      gap: var(--app-space-4);
      border-radius: var(--app-radius-lg);
      background: var(--app-color-surface);
      box-shadow:
        0 1px 3px rgb(23 32 42 / 6%),
        0 10px 28px rgb(23 32 42 / 8%);
      padding: var(--app-space-4);
      transition:
        box-shadow 180ms ease,
        transform 180ms ease;
    }

    .contract-card:hover {
      box-shadow:
        0 2px 6px rgb(23 32 42 / 8%),
        0 16px 40px rgb(23 32 42 / 12%);
      transform: translateY(-2px);
    }

    .contract-card--pending {
      background: var(--app-color-surface);
    }

    .contract-card__header,
    .contract-card__actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--app-space-3);
    }

    .contract-card__header {
      justify-content: flex-end;
    }

    .contract-card__body h3 {
      margin: 0;
      color: var(--app-color-text);
      font-size: 1.05rem;
      font-weight: 780;
      line-height: 1.3;
    }

    .contract-meta {
      display: grid;
      gap: var(--app-space-2);
      margin: var(--app-space-4) 0 0;
    }

    .contract-meta div {
      display: flex;
      justify-content: space-between;
      gap: var(--app-space-3);
      border-bottom: 1px solid var(--app-color-border);
      padding-block-end: var(--app-space-2);
    }

    .contract-meta dt,
    .contract-meta dd {
      margin: 0;
      font-size: 0.82rem;
    }

    .contract-meta dt {
      display: inline-flex;
      align-items: center;
      gap: var(--app-space-1);
      color: var(--app-color-text-muted);
      font-weight: 650;
    }

    .contract-meta dd {
      color: var(--app-color-text);
      font-weight: 720;
      text-align: end;
    }

    .rent-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--app-space-3);
      margin-block-start: var(--app-space-4);
      border-radius: var(--app-radius-md);
      background: var(--app-color-surface-muted);
      padding: var(--app-space-3);
    }

    .rent-box span {
      color: var(--app-color-text-muted);
      font-size: 0.82rem;
      font-weight: 650;
    }

    .rent-box strong {
      color: var(--app-color-text);
      font-size: 1rem;
      font-weight: 820;
    }

    .inline-alert {
      display: flex;
      align-items: center;
      gap: var(--app-space-2);
      margin-block-start: var(--app-space-3);
      border-radius: var(--app-radius-md);
      padding: var(--app-space-2) var(--app-space-3);
      font-size: 0.82rem;
      font-weight: 700;
    }

    .inline-alert--success {
      background: var(--tui-status-positive-pale);
      color: var(--tui-status-positive);
    }

    .contract-card__actions {
      flex-wrap: wrap;
      justify-content: flex-start;
      border-top: 1px solid var(--app-color-border);
      padding-block-start: var(--app-space-3);
    }

    @media (max-width: 720px) {
      .contracts-list__header {
        align-items: stretch;
        flex-direction: column;
      }

      .contracts-list__filter {
        inline-size: 100%;
      }
    }
  `,
})
export class TenantContractListComponent {
  readonly FileText = FileText;
  readonly Eye = Eye;
  readonly Edit = Edit;
  readonly CheckCircle2 = CheckCircle2;
  readonly Clock = Clock;
  readonly ContractStatus = ContractStatus;

  protected readonly contractService = inject(TenantContractService);
  private readonly router = inject(Router);
  private readonly slugService = inject(SlugService);
  private readonly translocoService = inject(TranslocoService);
  private readonly formatService = inject(FormatService);

  protected selectedStatus: ContractStatusFilter = 'ALL';

  // translate() no es reactivo. events$ emite 'langChanged' DESPUÉS de cargar
  // las traducciones del nuevo idioma (langChanges$ emite antes de la carga y
  // dejaría las opciones en el idioma anterior). Por eso dependemos de events$.
  private readonly translationEvents = toSignal(this.translocoService.events$);

  protected readonly statusOptions = computed<readonly AppSelectOption<ContractStatusFilter>[]>(
    () => {
      this.translationEvents();
      return [
        {
          label: this.translocoService.translate('tenantContracts.allStates'),
          value: 'ALL',
        },
        {
          label: this.translocoService.translate('tenantContracts.status.BORRADOR'),
          value: ContractStatus.BORRADOR,
        },
        {
          label: this.translocoService.translate('tenantContracts.status.ACTIVO'),
          value: ContractStatus.ACTIVO,
        },
        {
          label: this.translocoService.translate('tenantContracts.status.FINALIZADO'),
          value: ContractStatus.FINALIZADO,
        },
      ];
    },
  );

  protected readonly filteredContracts = computed(() => {
    const contracts = [...this.contractService.contracts()];
    const filtered =
      this.selectedStatus === 'ALL'
        ? contracts
        : contracts.filter((contract) => contract.status === this.selectedStatus);

    return filtered.sort((a, b) => {
      if (a.status === ContractStatus.BORRADOR && b.status !== ContractStatus.BORRADOR) {
        return -1;
      }
      if (a.status !== ContractStatus.BORRADOR && b.status === ContractStatus.BORRADOR) {
        return 1;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  });

  constructor() {
    this.loadContracts();
  }

  protected loadContracts(): void {
    this.contractService.loadContracts();
  }

  protected emptyDescription(): string {
    return this.selectedStatus === 'ALL'
      ? this.translocoService.translate('tenantContracts.noContractsDesc')
      : this.translocoService.translate('tenantContracts.noContractsWithStatus');
  }

  protected viewContract(contractId: Contract['id']): void {
    const url = this.slugService.buildUrl(`/portal/documentos/contratos/${contractId}`);
    void this.router.navigateByUrl(url);
  }

  protected signContract(contractId: Contract['id']): void {
    this.viewContract(contractId);
  }

  protected statusTone(status: ContractStatus): AppStatusTone {
    if (status === ContractStatus.ACTIVO || status === ContractStatus.FIRMADO) return 'success';
    if (status === ContractStatus.BORRADOR || status === ContractStatus.PENDIENTE) return 'warning';
    if (status === ContractStatus.VENCIDO || status === ContractStatus.CANCELADO) return 'danger';
    if (status === ContractStatus.POR_VENCER) return 'info';
    return 'neutral';
  }

  protected formatDate(date: Date | string): string {
    return this.formatService.formatDate(date);
  }
}
