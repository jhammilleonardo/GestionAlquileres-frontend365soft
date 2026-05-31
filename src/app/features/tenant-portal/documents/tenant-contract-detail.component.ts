import { Component, DestroyRef, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  DollarSign,
  Download,
  FileCheck,
  FileText,
  Home,
  Info,
  X,
} from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';
import {
  Contract,
  ContractStatus,
  TenantContractService,
} from '../../../core/services/tenant/tenant-contract.service';
import { TenantAuthService } from '../../../core/services/tenant/tenant-auth.service';
import { SlugService } from '../../../core/services/slug.service';
import { FormatService } from '../../../core/services/format.service';
import { TenantDatePipe } from '../../../shared/pipes/tenant-date.pipe';
import { TenantCurrencyPipe } from '../../../shared/pipes/tenant-currency.pipe';
import {
  AppButtonComponent,
  AppEmptyStateComponent,
  AppLoadingStateComponent,
  AppStatusBadgeComponent,
  AppStatusTone,
  ToastService,
} from '../../../shared/ui';
import { ContractSigningDialogComponent } from '../dialogs/contract-signing-dialog.component';
import { SigningSuccessDialogComponent } from '../dialogs/signing-success-dialog.component';

import { getApiErrorMessage } from '../../../core/http/http-error.util';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tenant-contract-detail',
  standalone: true,
  imports: [
    LucideAngularModule,
    TranslocoModule,
    TenantDatePipe,
    TenantCurrencyPipe,
    AppButtonComponent,
    AppEmptyStateComponent,
    AppLoadingStateComponent,
    AppStatusBadgeComponent,
    ContractSigningDialogComponent,
    SigningSuccessDialogComponent,
  ],
  template: `
    <section class="contract-detail">
      <header class="detail-header">
        <app-button appearance="outline" size="s" (clicked)="goBack()">
          <lucide-icon [img]="ArrowLeft" [size]="18"></lucide-icon>
          {{ 'tenantContracts.details.back' | transloco }}
        </app-button>

        @if (contract(); as c) {
          <div class="detail-header__identity">
            <h1>{{ c.contract_number }}</h1>
            <app-status-badge
              [label]="'tenantContracts.status.' + c.status | transloco"
              [tone]="statusTone(c.status)"
            />
          </div>
        }
      </header>

      @if (isLoading()) {
        <div class="state-box">
          <app-loading-state [label]="'tenantContracts.details.loading' | transloco" />
        </div>
      } @else if (error()) {
        <app-empty-state
          [title]="'tenantContracts.details.error' | transloco"
          [description]="error()"
        >
          <lucide-icon icon [img]="X" [size]="28"></lucide-icon>
          <app-button actions appearance="primary" (clicked)="goBack()">
            {{ 'tenantContracts.details.back' | transloco }}
          </app-button>
        </app-empty-state>
      } @else if (contract(); as c) {
        <div class="contract-content">
          @if (c.status === ContractStatus.BORRADOR) {
            <section class="banner banner--warning">
              <lucide-icon [img]="AlertTriangle" [size]="28"></lucide-icon>
              <div>
                <h2>{{ 'tenantContracts.details.pendingAlertTitle' | transloco }}</h2>
                <p>
                  {{ 'tenantContracts.details.pendingAlertDescBefore' | transloco }}
                  <strong>{{
                    'tenantContracts.details.pendingAlertDescButton' | transloco
                  }}</strong>
                  {{ 'tenantContracts.details.pendingAlertDescAfter' | transloco }}
                </p>
              </div>
              <app-button appearance="primary" [loading]="isSigning()" (clicked)="signContract()">
                <lucide-icon [img]="FileCheck" [size]="18"></lucide-icon>
                {{ 'tenantContracts.details.signButton' | transloco }}
              </app-button>
            </section>
          }

          @if (c.status === ContractStatus.ACTIVO && c.signed_at) {
            <section class="banner banner--success">
              <lucide-icon [img]="CheckCircle2" [size]="28"></lucide-icon>
              <div>
                <h2>{{ 'tenantContracts.details.signedTitle' | transloco }}</h2>
                <p>
                  {{
                    'tenantContracts.details.signedDesc'
                      | transloco: { date: formatDate(c.signed_at) }
                  }}
                </p>
              </div>
            </section>
          }

          <div class="detail-grid">
            <article class="info-card">
              <header>
                <lucide-icon [img]="Home" [size]="22"></lucide-icon>
                <h2>{{ 'tenantContracts.details.propertyTitle' | transloco }}</h2>
              </header>
              <div class="info-card__body">
                <h3>
                  {{ c.property?.title || ('tenantContracts.propertyNotSpecified' | transloco) }}
                </h3>
                @if (c.property?.address) {
                  <p>{{ c.property?.address }}</p>
                }
              </div>
            </article>

            <article class="info-card">
              <header>
                <lucide-icon [img]="Calendar" [size]="22"></lucide-icon>
                <h2>{{ 'tenantContracts.details.validityTitle' | transloco }}</h2>
              </header>
              <dl class="info-list">
                <div>
                  <dt>{{ 'tenantContracts.details.startLabel' | transloco }}</dt>
                  <dd>{{ c.start_date | tenantDate }}</dd>
                </div>
                <div>
                  <dt>{{ 'tenantContracts.details.endLabel' | transloco }}</dt>
                  <dd>{{ c.end_date | tenantDate }}</dd>
                </div>
                @if (c.key_delivery_date) {
                  <div>
                    <dt>{{ 'tenantContracts.details.keyDeliveryLabel' | transloco }}</dt>
                    <dd>{{ c.key_delivery_date | tenantDate }}</dd>
                  </div>
                }
                @if (c.signed_at) {
                  <div>
                    <dt>{{ 'tenantContracts.details.signDateLabel' | transloco }}</dt>
                    <dd>{{ c.signed_at | tenantDate }}</dd>
                  </div>
                }
              </dl>
            </article>

            <article class="info-card info-card--wide">
              <header>
                <lucide-icon [img]="DollarSign" [size]="22"></lucide-icon>
                <h2>{{ 'tenantContracts.details.economicTitle' | transloco }}</h2>
              </header>

              <dl class="terms-grid">
                <div>
                  <dt>{{ 'tenantContracts.details.rentLabel' | transloco }}</dt>
                  <dd class="amount">
                    {{ c.monthly_rent | tenantCurrency }}
                    @if (c.currency) {
                      {{ c.currency }}
                    }
                  </dd>
                </div>
                @if (c.deposit_amount) {
                  <div>
                    <dt>{{ 'tenantContracts.details.depositLabel' | transloco }}</dt>
                    <dd>
                      {{ c.deposit_amount | tenantCurrency }}
                      @if (c.currency) {
                        {{ c.currency }}
                      }
                    </dd>
                  </div>
                }
                @if (c.payment_day) {
                  <div>
                    <dt>{{ 'tenantContracts.details.paymentDayLabel' | transloco }}</dt>
                    <dd>
                      {{
                        'tenantContracts.details.paymentDayValue'
                          | transloco: { day: c.payment_day }
                      }}
                    </dd>
                  </div>
                }
                @if (c.payment_method) {
                  <div>
                    <dt>{{ 'tenantContracts.details.methodLabel' | transloco }}</dt>
                    <dd>{{ c.payment_method }}</dd>
                  </div>
                }
              </dl>

              @if (c.bank_name || c.bank_account_number) {
                <div class="bank-section">
                  <h3>{{ 'tenantContracts.details.bankTitle' | transloco }}</h3>
                  <dl class="info-list">
                    @if (c.bank_name) {
                      <div>
                        <dt>{{ 'tenantContracts.details.bankLabel' | transloco }}</dt>
                        <dd>{{ c.bank_name }}</dd>
                      </div>
                    }
                    @if (c.bank_account_holder) {
                      <div>
                        <dt>{{ 'tenantContracts.details.holderLabel' | transloco }}</dt>
                        <dd>{{ c.bank_account_holder }}</dd>
                      </div>
                    }
                    @if (c.bank_account_type && c.bank_account_number) {
                      <div>
                        <dt>{{ 'tenantContracts.details.accountLabel' | transloco }}</dt>
                        <dd>{{ c.bank_account_type }} - {{ c.bank_account_number }}</dd>
                      </div>
                    }
                  </dl>
                </div>
              }
            </article>

            @if (c.included_services && c.included_services.length > 0) {
              <article class="info-card">
                <header>
                  <lucide-icon [img]="Info" [size]="22"></lucide-icon>
                  <h2>{{ 'tenantContracts.details.servicesTitle' | transloco }}</h2>
                </header>
                <ul class="check-list">
                  @for (service of c.included_services; track service) {
                    <li>{{ service }}</li>
                  }
                </ul>
              </article>
            }

            @if (c.tenant_responsibilities) {
              <article class="info-card">
                <header>
                  <lucide-icon [img]="FileText" [size]="22"></lucide-icon>
                  <h2>{{ 'tenantContracts.details.responsibilitiesTitle' | transloco }}</h2>
                </header>
                <p class="long-text">{{ c.tenant_responsibilities }}</p>
              </article>
            }

            @if (c.prohibitions) {
              <article class="info-card info-card--danger">
                <header>
                  <lucide-icon [img]="AlertTriangle" [size]="22"></lucide-icon>
                  <h2>{{ 'tenantContracts.details.prohibitionsTitle' | transloco }}</h2>
                </header>
                <p class="long-text">{{ c.prohibitions }}</p>
              </article>
            }

            @if (c.renewal_terms || c.termination_terms || c.jurisdiction) {
              <article class="info-card info-card--wide">
                <header>
                  <lucide-icon [img]="Info" [size]="22"></lucide-icon>
                  <h2>{{ 'tenantContracts.details.additionalTitle' | transloco }}</h2>
                </header>
                <div class="additional-grid">
                  @if (c.renewal_terms) {
                    <section>
                      <h3>{{ 'tenantContracts.details.renewalLabel' | transloco }}</h3>
                      <p>{{ c.renewal_terms }}</p>
                    </section>
                  }
                  @if (c.termination_terms) {
                    <section>
                      <h3>{{ 'tenantContracts.details.terminationLabel' | transloco }}</h3>
                      <p>{{ c.termination_terms }}</p>
                    </section>
                  }
                  @if (c.jurisdiction) {
                    <section>
                      <h3>{{ 'tenantContracts.details.jurisdictionLabel' | transloco }}</h3>
                      <p>{{ c.jurisdiction }}</p>
                    </section>
                  }
                </div>
              </article>
            }
          </div>

          <footer class="detail-actions">
            <app-button appearance="outline" (clicked)="viewPDF()">
              <lucide-icon [img]="FileText" [size]="18"></lucide-icon>
              {{ 'tenantContracts.details.viewPdf' | transloco }}
            </app-button>
            <app-button appearance="outline" (clicked)="downloadPDF()">
              <lucide-icon [img]="Download" [size]="18"></lucide-icon>
              {{ 'tenantContracts.details.downloadPdf' | transloco }}
            </app-button>
            @if (c.status === ContractStatus.BORRADOR) {
              <app-button appearance="primary" [loading]="isSigning()" (clicked)="signContract()">
                <lucide-icon [img]="FileCheck" [size]="18"></lucide-icon>
                {{ 'tenantContracts.details.signButton' | transloco }}
              </app-button>
            }
          </footer>
        </div>
      }
    </section>

    <app-contract-signing-dialog
      [open]="isSigningDialogOpen()"
      [contract]="contract()"
      [isSigning]="isSigning()"
      (cancelled)="closeSigningDialog()"
      (confirmed)="confirmSigning()"
    />

    <app-signing-success-dialog
      [open]="isSuccessDialogOpen()"
      [contract]="signedContract()"
      (closed)="closeSuccessDialog()"
    />
  `,
  styles: `
    .contract-detail {
      max-inline-size: 1120px;
      margin-inline: auto;
    }

    .detail-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--app-space-4);
      margin-block-end: var(--app-space-6);
    }

    .detail-header__identity {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: flex-end;
      gap: var(--app-space-3);
      min-inline-size: 0;
    }

    .detail-header h1 {
      margin: 0;
      color: var(--app-color-text);
      font-size: clamp(1.25rem, 2vw, 1.75rem);
      font-weight: 820;
      line-height: 1.15;
      overflow-wrap: anywhere;
    }

    .state-box {
      display: grid;
      min-block-size: 20rem;
      place-items: center;
    }

    .contract-content {
      display: grid;
      gap: var(--app-space-5);
    }

    .banner {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      gap: var(--app-space-4);
      border-radius: var(--app-radius-lg);
      padding: var(--app-space-4);
    }

    .banner h2,
    .banner p {
      margin: 0;
    }

    .banner h2 {
      font-size: 1rem;
      font-weight: 800;
    }

    .banner p {
      margin-block-start: 0.25rem;
      line-height: 1.5;
    }

    .banner--warning {
      background: var(--tui-status-warning-pale);
      color: var(--tui-status-warning);
    }

    .banner--success {
      background: var(--tui-status-positive-pale);
      color: var(--tui-status-positive);
      grid-template-columns: auto minmax(0, 1fr);
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--app-space-4);
    }

    .info-card {
      display: grid;
      gap: var(--app-space-4);
      align-content: start;
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-lg);
      background: var(--app-color-surface);
      box-shadow: var(--app-shadow-sm);
      padding: var(--app-space-4);
    }

    .info-card--wide {
      grid-column: 1 / -1;
    }

    .info-card--danger {
      border-color: var(--tui-status-negative);
      background: var(--tui-status-negative-pale);
    }

    .info-card header {
      display: flex;
      align-items: center;
      gap: var(--app-space-2);
      color: var(--app-color-text);
    }

    .info-card h2,
    .info-card h3,
    .info-card p,
    .info-list,
    .terms-grid,
    .additional-grid p {
      margin: 0;
    }

    .info-card h2 {
      font-size: 1rem;
      font-weight: 800;
    }

    .info-card__body h3 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 820;
    }

    .info-card__body p,
    .long-text,
    .additional-grid p {
      color: var(--app-color-text-muted);
      line-height: 1.6;
    }

    .info-list,
    .terms-grid {
      display: grid;
      gap: var(--app-space-2);
    }

    .terms-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .info-list div,
    .terms-grid div {
      display: flex;
      justify-content: space-between;
      gap: var(--app-space-3);
      border-bottom: 1px solid var(--app-color-border);
      padding-block-end: var(--app-space-2);
    }

    .info-list dt,
    .terms-grid dt {
      color: var(--app-color-text-muted);
      font-size: 0.82rem;
      font-weight: 700;
    }

    .info-list dd,
    .terms-grid dd {
      margin: 0;
      color: var(--app-color-text);
      font-weight: 780;
      text-align: end;
    }

    .terms-grid .amount {
      color: var(--app-color-primary);
      font-size: 1.1rem;
    }

    .bank-section {
      display: grid;
      gap: var(--app-space-3);
      border-top: 1px solid var(--app-color-border);
      padding-block-start: var(--app-space-4);
    }

    .check-list {
      display: grid;
      gap: var(--app-space-2);
      margin: 0;
      padding-inline-start: 1.2rem;
      color: var(--app-color-text);
      font-weight: 650;
    }

    .additional-grid {
      display: grid;
      gap: var(--app-space-4);
    }

    .additional-grid h3 {
      margin: 0 0 var(--app-space-1);
      font-size: 0.9rem;
      font-weight: 780;
    }

    .detail-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: var(--app-space-2);
      border-top: 1px solid var(--app-color-border);
      padding-block-start: var(--app-space-5);
    }

    @media (max-width: 820px) {
      .detail-header,
      .banner {
        align-items: stretch;
        grid-template-columns: 1fr;
      }

      .detail-header {
        flex-direction: column;
      }

      .detail-header__identity,
      .detail-actions {
        justify-content: flex-start;
      }

      .detail-grid,
      .terms-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class TenantContractDetailComponent {
  protected readonly ArrowLeft = ArrowLeft;
  protected readonly Download = Download;
  protected readonly Edit = FileCheck;
  protected readonly CheckCircle2 = CheckCircle2;
  protected readonly AlertTriangle = AlertTriangle;
  protected readonly Home = Home;
  protected readonly Calendar = Calendar;
  protected readonly DollarSign = DollarSign;
  protected readonly FileCheck = FileCheck;
  protected readonly Info = Info;
  protected readonly FileText = FileText;
  protected readonly X = X;
  protected readonly ContractStatus = ContractStatus;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly contractService = inject(TenantContractService);
  private readonly authService = inject(TenantAuthService);
  private readonly slugService = inject(SlugService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translocoService = inject(TranslocoService);
  private readonly formatService = inject(FormatService);
  private readonly toast = inject(ToastService);

  protected readonly contract = signal<Contract | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly isSigning = signal(false);
  protected readonly isSigningDialogOpen = signal(false);
  protected readonly isSuccessDialogOpen = signal(false);
  protected readonly signedContract = signal<Contract | null>(null);

  constructor() {
    const contractId = this.route.snapshot.paramMap.get('id');
    if (!contractId) {
      this.error.set(this.translocoService.translate('tenantContracts.details.missingId'));
      this.isLoading.set(false);
      return;
    }

    this.loadContract(Number(contractId));
  }

  protected loadContract(id: number): void {
    this.contractService
      .getContract(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (contract) => {
          this.contract.set(contract);
          this.isLoading.set(false);
        },
        error: () => {
          this.error.set(this.translocoService.translate('tenantContracts.details.loadError'));
          this.isLoading.set(false);
        },
      });
  }

  protected goBack(): void {
    const url = this.slugService.buildUrl('/portal/documentos');
    void this.router.navigateByUrl(url);
  }

  protected signContract(): void {
    if (!this.contract() || this.isSigning()) return;
    this.isSigningDialogOpen.set(true);
  }

  protected closeSigningDialog(): void {
    if (this.isSigning()) return;
    this.isSigningDialogOpen.set(false);
  }

  protected confirmSigning(): void {
    const contract = this.contract();
    if (!contract || this.isSigning()) return;

    this.isSigningDialogOpen.set(false);
    this.performSigning(contract.id);
  }

  private performSigning(contractId: Contract['id']): void {
    this.isSigning.set(true);

    this.contractService
      .signContract(contractId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isSigning.set(false);
          this.contract.set(response);
          this.signedContract.set(response);
          this.isSuccessDialogOpen.set(true);
        },
        error: (err: { error?: { message?: string } }) => {
          this.isSigning.set(false);
          this.toast.error(
            getApiErrorMessage(
              err,
              this.translocoService.translate('tenantContracts.details.signError'),
            ),
          );
        },
      });
  }

  protected closeSuccessDialog(): void {
    this.isSuccessDialogOpen.set(false);
    this.authService
      .refreshUserData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.slugService.navigateTo(['portal', 'dashboard']);
      });
  }

  protected downloadPDF(): void {
    this.openContractPdf();
  }

  protected viewPDF(): void {
    this.openContractPdf();
  }

  private openContractPdf(): void {
    const contract = this.contract();
    if (!contract) return;

    this.contractService
      .downloadContractPDF(contract.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank', 'noopener,noreferrer');
        },
        error: () => {
          this.toast.error(this.translocoService.translate('tenantContracts.details.pdfError'));
        },
      });
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
