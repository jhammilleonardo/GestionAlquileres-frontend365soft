import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import {
  AlertTriangle,
  Building,
  Calendar,
  Check,
  DollarSign,
  FileCheck,
  Info,
} from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';
import { Contract } from '../../../core/services/tenant/tenant-contract.service';
import { TenantDatePipe } from '../../../shared/pipes/tenant-date.pipe';
import { TenantCurrencyPipe } from '../../../shared/pipes/tenant-currency.pipe';
import {
  AppButtonComponent,
  AppCheckboxComponent,
  AppDialogComponent,
  AppLoadingStateComponent,
} from '../../../shared/ui';
import { SignaturePadComponent, SignatureResult } from './signature-pad.component';

@Component({
  selector: 'app-contract-signing-dialog',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    TranslocoModule,
    TenantDatePipe,
    TenantCurrencyPipe,
    AppButtonComponent,
    AppCheckboxComponent,
    AppDialogComponent,
    AppLoadingStateComponent,
    SignaturePadComponent,
  ],
  template: `
    <app-dialog
      [open]="open()"
      [title]="'public.contractSigning.title' | transloco"
      [closeOnBackdrop]="false"
      (closed)="cancel()"
    >
      @if (contract(); as c) {
        <div class="signing-flow">
          <section class="notice">
            <lucide-icon [img]="AlertTriangle" [size]="20"></lucide-icon>
            <p>
              <strong>{{ 'public.contractSigning.importantNoticeLabel' | transloco }}:</strong>
              {{ 'public.contractSigning.importantNoticeBody' | transloco }}
              <strong>{{ 'public.contractSigning.importantNoticeEmphasis' | transloco }}</strong>
              {{ 'public.contractSigning.importantNoticeEnd' | transloco }}
            </p>
          </section>

          <section class="summary-section">
            <h3>
              <lucide-icon [img]="Info" [size]="18"></lucide-icon>
              {{ 'public.contractSigning.contractInfo' | transloco }}
            </h3>

            <dl class="summary-grid">
              <div>
                <dt>{{ 'public.contractSigning.property' | transloco }}</dt>
                <dd>
                  {{
                    c.property?.title || ('public.contractSigning.propertyNotSpecified' | transloco)
                  }}
                </dd>
              </div>
              <div>
                <dt>{{ 'public.contractSigning.startDate' | transloco }}</dt>
                <dd>{{ c.start_date | tenantDate }}</dd>
              </div>
              <div>
                <dt>{{ 'public.contractSigning.endDate' | transloco }}</dt>
                <dd>{{ c.end_date | tenantDate }}</dd>
              </div>
            </dl>
          </section>

          <section class="summary-section payment-section">
            <h3>
              <lucide-icon [img]="DollarSign" [size]="18"></lucide-icon>
              {{ 'public.contractSigning.paymentInfo' | transloco }}
            </h3>

            <div class="amount-grid">
              <div>
                <span>{{ 'public.contractSigning.monthlyRent' | transloco }}</span>
                <strong>
                  {{ c.monthly_rent | tenantCurrency }}
                  @if (c.currency) {
                    {{ c.currency }}
                  }
                </strong>
              </div>

              @if (c.deposit_amount) {
                <div>
                  <span>{{ 'public.contractSigning.deposit' | transloco }}</span>
                  <strong>
                    {{ c.deposit_amount | tenantCurrency }}
                    @if (c.currency) {
                      {{ c.currency }}
                    }
                  </strong>
                </div>
              }
            </div>

            <div class="detail-list">
              @if (c.payment_day) {
                <p>
                  <lucide-icon [img]="Calendar" [size]="16"></lucide-icon>
                  {{ 'public.contractSigning.paymentDayLabel' | transloco }}
                  <strong>{{
                    'public.contractSigning.paymentDayValue' | transloco: { day: c.payment_day }
                  }}</strong>
                </p>
              }

              @if (c.payment_method) {
                <p>
                  <lucide-icon [img]="Info" [size]="16"></lucide-icon>
                  {{ 'public.contractSigning.paymentMethodLabel' | transloco }}
                  <strong>{{ c.payment_method }}</strong>
                </p>
              }
            </div>

            @if (c.bank_name || c.bank_account_number) {
              <div class="bank-box">
                <h4>
                  <lucide-icon [img]="Building" [size]="16"></lucide-icon>
                  {{ 'public.contractSigning.bankDetailsTitle' | transloco }}
                </h4>
                @if (c.bank_name) {
                  <p>
                    <span>{{ 'public.contractSigning.bank' | transloco }}</span
                    ><strong>{{ c.bank_name }}</strong>
                  </p>
                }
                @if (c.bank_account_holder) {
                  <p>
                    <span>{{ 'public.contractSigning.accountHolder' | transloco }}</span
                    ><strong>{{ c.bank_account_holder }}</strong>
                  </p>
                }
                @if (c.bank_account_type && c.bank_account_number) {
                  <p>
                    <span>{{ 'public.contractSigning.account' | transloco }}</span
                    ><strong>{{ c.bank_account_type }} - {{ c.bank_account_number }}</strong>
                  </p>
                }
              </div>
            }
          </section>

          @if (c.included_services && c.included_services.length > 0) {
            <section class="summary-section">
              <h3>
                <lucide-icon [img]="Check" [size]="18"></lucide-icon>
                {{ 'public.contractSigning.includedServices' | transloco }}
              </h3>
              <ul class="services-list">
                @for (service of c.included_services; track service) {
                  <li>{{ service }}</li>
                }
              </ul>
            </section>
          }

          <section class="acceptance-box">
            <app-checkbox [(ngModel)]="acceptedTerms">
              {{ 'public.contractSigning.termsAccept1' | transloco }}
            </app-checkbox>

            <ul>
              <li>
                {{ 'public.contractSigning.termsAccept2Before' | transloco }}
                <strong>{{ c.monthly_rent | tenantCurrency }} {{ c.currency || '' }}</strong>
                {{ 'public.contractSigning.termsAccept2After' | transloco }}
              </li>
              <li>
                {{ 'public.contractSigning.termsAccept3Before' | transloco }}
                <strong>{{ 'public.contractSigning.termsAccept3Emphasis' | transloco }}</strong>
                {{ 'public.contractSigning.termsAccept3After' | transloco }}
              </li>
              <li>{{ 'public.contractSigning.termsAccept4' | transloco }}</li>
              <li>{{ 'public.contractSigning.termsAccept5' | transloco }}</li>
              @if (c.late_fee_percentage) {
                <li>
                  {{ 'public.contractSigning.termsAccept6Prefix' | transloco }}
                  <strong>{{ c.late_fee_percentage }}%</strong>.
                </li>
              }
            </ul>

            <div class="signature-confirmation">
              <p class="signature-phrase-label">
                {{ 'public.contractSigning.signaturePhraseLabel' | transloco }}
              </p>
              <p>{{ 'public.contractSigning.signatureConsent' | transloco }}</p>
              <app-signature-pad (signatureChange)="onSignatureChange($event)" />
            </div>
          </section>
        </div>
      }

      <div dialog-actions>
        <app-button appearance="outline" [disabled]="isSigning()" (clicked)="cancel()">
          {{ 'public.contractSigning.cancel' | transloco }}
        </app-button>
        <app-button
          appearance="primary"
          [disabled]="!canSign()"
          [loading]="isSigning()"
          (clicked)="confirm()"
        >
          @if (isSigning()) {
            <app-loading-state [label]="'public.contractSigning.signing' | transloco" />
          } @else {
            <lucide-icon [img]="FileCheck" [size]="18"></lucide-icon>
            {{ 'public.contractSigning.signContract' | transloco }}
          }
        </app-button>
      </div>
    </app-dialog>
  `,
  styles: `
    :host {
      --app-dialog-width: 760px;
    }

    .signing-flow {
      display: grid;
      gap: var(--app-space-4);
    }

    .notice,
    .acceptance-box {
      display: grid;
      gap: var(--app-space-3);
      border-radius: var(--app-radius-lg);
      padding: var(--app-space-4);
    }

    .notice {
      grid-template-columns: auto minmax(0, 1fr);
      gap: var(--app-space-4);
      border: 1px solid #ffca00;
      background: #ffca00;
      color: #4a3200;
      padding: var(--app-space-4) var(--app-space-6);
    }

    .notice p,
    .acceptance-box ul {
      margin: 0;
    }

    .summary-section {
      display: grid;
      gap: var(--app-space-3);
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-lg);
      padding: var(--app-space-4);
    }

    .summary-section h3 {
      display: flex;
      align-items: center;
      gap: var(--app-space-2);
      margin: 0;
      color: var(--app-color-text);
      font-size: 1rem;
      font-weight: 780;
    }

    .summary-grid,
    .amount-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--app-space-3);
    }

    dl,
    dd {
      margin: 0;
    }

    dt,
    .amount-grid span,
    .bank-box span {
      color: var(--app-color-text-muted);
      font-size: 0.8rem;
      font-weight: 700;
    }

    dd,
    .amount-grid strong,
    .bank-box strong {
      display: block;
      margin-block-start: 0.25rem;
      color: var(--app-color-text);
      font-weight: 780;
    }

    .mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    .amount-grid > div {
      border-radius: var(--app-radius-md);
      background: var(--app-color-surface-muted);
      padding: var(--app-space-3);
    }

    .amount-grid strong {
      font-size: 1.15rem;
    }

    .detail-list {
      display: grid;
      gap: var(--app-space-2);
    }

    .detail-list p,
    .bank-box p {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--app-space-3);
      margin: 0;
    }

    .detail-list p {
      justify-content: flex-start;
      color: var(--app-color-text-muted);
    }

    .bank-box {
      display: grid;
      gap: var(--app-space-2);
      border-radius: var(--app-radius-md);
      background: var(--app-color-surface-muted);
      padding: var(--app-space-3);
    }

    .bank-box h4 {
      display: flex;
      align-items: center;
      gap: var(--app-space-2);
      margin: 0;
      color: var(--app-color-text);
      font-size: 0.9rem;
    }

    .services-list,
    .acceptance-box ul {
      display: grid;
      gap: var(--app-space-2);
      padding-inline-start: 1.2rem;
    }

    .acceptance-box {
      background: var(--app-color-surface-muted);
      color: var(--app-color-text-muted);
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .signature-confirmation {
      display: grid;
      gap: var(--app-space-2);
      border-top: 1px solid var(--app-color-border);
      padding-block-start: var(--app-space-3);
    }

    .signature-confirmation label {
      color: var(--app-color-text);
      font-weight: 800;
    }

    .signature-confirmation p {
      margin: 0;
      color: var(--app-color-text-muted);
    }

    .signature-confirmation strong {
      color: var(--app-color-text);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-weight: 850;
    }

    .signature-confirmation input {
      inline-size: 100%;
      min-block-size: 2.75rem;
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-md);
      background: var(--app-color-surface);
      color: var(--app-color-text);
      font: inherit;
      font-weight: 700;
      padding: 0 var(--app-space-3);
      outline: none;
      transition:
        border-color 150ms ease,
        box-shadow 150ms ease;
    }

    .signature-confirmation input:focus {
      border-color: var(--app-color-primary);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--app-color-primary) 18%, transparent);
    }

    .signature-confirmation small {
      color: var(--app-color-danger);
      font-weight: 700;
    }

    [dialog-actions] {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: var(--app-space-2);
    }

    @media (max-width: 640px) {
      .summary-grid,
      .amount-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContractSigningDialogComponent {
  readonly open = input(false);
  readonly contract = input<Contract | null>(null);
  readonly isSigning = input(false);

  readonly cancelled = output<void>();
  readonly confirmed = output<SignatureResult>();

  protected readonly FileCheck = FileCheck;
  protected readonly DollarSign = DollarSign;
  protected readonly Calendar = Calendar;
  protected readonly AlertTriangle = AlertTriangle;
  protected readonly Info = Info;
  protected readonly Building = Building;
  protected readonly Check = Check;

  protected acceptedTerms = false;
  protected readonly signature = signal<SignatureResult | null>(null);

  protected onSignatureChange(result: SignatureResult | null): void {
    this.signature.set(result);
  }

  protected cancel(): void {
    this.resetConfirmation();
    this.cancelled.emit();
  }

  protected confirm(): void {
    const signature = this.signature();
    if (!this.canSign() || !signature) return;

    this.confirmed.emit(signature);
    this.resetConfirmation();
  }

  protected canSign(): boolean {
    return this.acceptedTerms && this.signature() !== null && !this.isSigning();
  }

  private resetConfirmation(): void {
    this.acceptedTerms = false;
    this.signature.set(null);
  }
}
