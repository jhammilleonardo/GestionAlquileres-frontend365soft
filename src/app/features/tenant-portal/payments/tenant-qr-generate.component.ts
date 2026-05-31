import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Clock,
  Download,
  Info,
  LucideAngularModule,
  QrCode,
  RefreshCw,
  XCircle,
} from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';

import { TenantQrPaymentService } from '../../../core/services/tenant/tenant-qr-payment.service';
import { SlugService } from '../../../core/services/slug.service';
import { TenantContractService } from '../../../core/services/tenant/tenant-contract.service';
import {
  Currency,
  CurrencyLabels,
  CurrencySymbols,
  PaymentType,
  PaymentTypeLabels,
  QrPayment,
  QrPaymentStatus,
} from '../../../core/models/payment.model';
import { TenantDatePipe } from '../../../shared/pipes/tenant-date.pipe';
import { AppButtonComponent } from '../../../shared/ui/button/button.component';
import { AppSelectComponent, AppSelectOption } from '../../../shared/ui/select/select.component';
import { AppTextFieldComponent } from '../../../shared/ui/text-field/text-field.component';

@Component({
  selector: 'app-tenant-qr-generate',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    LucideAngularModule,
    TranslocoModule,
    TenantDatePipe,
    AppButtonComponent,
    AppSelectComponent,
    AppTextFieldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="qr-container">
      <!-- Header -->
      <div class="page-header">
        <button type="button" class="back-btn" (click)="goBack()" aria-label="Volver">
          <lucide-icon [img]="ArrowLeft" [size]="24" />
        </button>
        <div>
          <h1>{{ 'public.tenantQrGenerate.qrPayTitle' | transloco }}</h1>
          <p>{{ 'public.tenantQrGenerate.qrPaySubtitle' | transloco }}</p>
        </div>
      </div>

      @if (qrService.error()) {
        <div class="alert alert-error" role="alert">
          <lucide-icon [img]="AlertCircle" [size]="18" />
          <span>{{ qrService.error() }}</span>
        </div>
      }

      <!-- PASO 1: Formulario -->
      @if (!qrService.activeQr()) {
        <div class="form-card">
          <div class="card-header">
            <lucide-icon [img]="QrCode" [size]="24" class="icon-primary" />
            <h2>{{ 'public.tenantQrGenerate.paymentDataTitle' | transloco }}</h2>
          </div>
          <hr class="divider" />

          <div class="info-banner">
            <lucide-icon [img]="Info" [size]="16" />
            <span>
              {{ 'public.tenantQrGenerate.qrCompatibilityInfoBefore' | transloco }}
              <strong>MC4 / SIP Bolivia</strong>.
              {{ 'public.tenantQrGenerate.qrCompatibilityInfoAfter' | transloco }}
            </span>
          </div>

          <form [formGroup]="form" (ngSubmit)="onGenerate()" class="qr-form">
            <div class="form-row">
              <div class="field-group">
                <app-text-field
                  formControlName="amount"
                  [label]="'public.tenantQrGenerate.amountFieldLabel' | transloco"
                  type="number"
                  placeholder="0.00"
                />
                @if (form.get('amount')?.invalid && form.get('amount')?.touched) {
                  <span class="field-error">{{
                    'public.tenantQrGenerate.invalidAmountError' | transloco
                  }}</span>
                }
              </div>

              <app-select
                formControlName="currency"
                [label]="'public.tenantQrGenerate.currencyFieldLabel' | transloco"
                [options]="currencyOptions"
              />
            </div>

            <app-select
              formControlName="payment_type"
              [label]="'public.tenantQrGenerate.paymentTypeLabel' | transloco"
              [options]="paymentTypeOptions"
            />

            <app-text-field
              formControlName="notes"
              [label]="'public.tenantQrGenerate.notesFieldLabel' | transloco"
              [placeholder]="'public.tenantQrGenerate.notesPlaceholder' | transloco"
            />

            <div class="form-actions">
              <app-button
                type="submit"
                [disabled]="form.invalid || qrService.isLoading()"
                [loading]="qrService.isLoading()"
              >
                <lucide-icon [img]="QrCode" [size]="20" />
                {{
                  qrService.isLoading()
                    ? ('public.tenantQrGenerate.generatingQr' | transloco)
                    : ('public.tenantQrGenerate.generateQr' | transloco)
                }}
              </app-button>
              <app-button type="button" appearance="secondary" (clicked)="goBack()">
                {{ 'public.tenantQrGenerate.cancel' | transloco }}
              </app-button>
            </div>
          </form>
        </div>
      }

      <!-- PASO 2: QR generado -->
      @if (qrService.activeQr(); as qr) {
        @if (qr.status === QrStatus.PAGADO) {
          <div class="result-card success">
            <lucide-icon [img]="CheckCircle2" [size]="56" class="result-icon" />
            <h2>{{ 'public.tenantQrGenerate.paymentConfirmedTitle' | transloco }}</h2>
            <p>
              {{ 'public.tenantQrGenerate.paymentProcessedDescBefore' | transloco }}
              <strong>{{ currencySymbol(qr.currency) }}{{ qr.amount | number: '1.2-2' }}</strong>
              {{ 'public.tenantQrGenerate.paymentProcessedDescAfter' | transloco }}
            </p>
            @if (qr.transaction_id) {
              <span class="tx-id">TXN: {{ qr.transaction_id }}</span>
            }
            <div class="result-actions">
              <app-button (clicked)="goBack()">
                {{ 'public.tenantQrGenerate.backToPayments' | transloco }}
              </app-button>
              <app-button appearance="secondary" (clicked)="resetQr()">
                {{ 'public.tenantQrGenerate.generateAnotherQr' | transloco }}
              </app-button>
            </div>
          </div>
        }

        @if (qr.status === QrStatus.EXPIRADO) {
          <div class="result-card expired">
            <lucide-icon [img]="Clock" [size]="56" class="result-icon" />
            <h2>{{ 'public.tenantQrGenerate.qrExpiredTitle' | transloco }}</h2>
            <p>{{ 'public.tenantQrGenerate.qrExpiredDesc' | transloco }}</p>
            <app-button (clicked)="resetQr()">
              {{ 'public.tenantQrGenerate.generateNewQr' | transloco }}
            </app-button>
          </div>
        }

        @if (qr.status === QrStatus.CANCELADO) {
          <div class="result-card cancelled">
            <lucide-icon [img]="XCircle" [size]="56" class="result-icon" />
            <h2>{{ 'public.tenantQrGenerate.qrCancelledTitle' | transloco }}</h2>
            <p>{{ 'public.tenantQrGenerate.qrCancelledDesc' | transloco }}</p>
            <app-button (clicked)="resetQr()">
              {{ 'public.tenantQrGenerate.generateNewQr' | transloco }}
            </app-button>
          </div>
        }

        @if (qr.status === QrStatus.PENDIENTE) {
          <div class="qr-display-card">
            <div class="qr-display-header">
              <div class="qr-amount">
                <span class="qr-amount-label">{{
                  'public.tenantQrGenerate.totalToPayLabel' | transloco
                }}</span>
                <span class="qr-amount-value">
                  {{ currencySymbol(qr.currency) }}{{ qr.amount | number: '1.2-2' }}
                  <small>{{ qr.currency }}</small>
                </span>
              </div>
              <div class="qr-status-chip pending">
                <lucide-icon [img]="Clock" [size]="14" />
                <span>{{ 'public.tenantQrGenerate.waitingForPayment' | transloco }}</span>
              </div>
            </div>

            <hr class="divider" />

            <div class="qr-image-wrapper">
              @if (qrSafeUrl()) {
                <img [src]="qrSafeUrl()!" alt="Código QR de pago" class="qr-image" />
              } @else {
                <div class="qr-placeholder">
                  <lucide-icon [img]="QrCode" [size]="80" />
                  <span>{{ 'public.tenantQrGenerate.qrNotAvailable' | transloco }}</span>
                </div>
              }
            </div>

            <div class="qr-steps">
              <div class="step">
                <span class="step-no">1</span>{{ 'public.tenantQrGenerate.step1' | transloco }}
              </div>
              <div class="step">
                <span class="step-no">2</span>
                <span>
                  {{ 'public.tenantQrGenerate.step2Before' | transloco }}
                  <strong>{{ 'public.tenantQrGenerate.step2Action' | transloco }}</strong>
                  {{ 'public.tenantQrGenerate.step2After' | transloco }}
                </span>
              </div>
              <div class="step">
                <span class="step-no">3</span>{{ 'public.tenantQrGenerate.step3' | transloco }}
              </div>
              <div class="step">
                <span class="step-no">4</span>{{ 'public.tenantQrGenerate.step4' | transloco }}
              </div>
            </div>

            @if (qr.expires_at) {
              <div class="expires-row">
                <lucide-icon [img]="Clock" [size]="14" />
                <span>
                  {{ 'public.tenantQrGenerate.expiresAtLabel' | transloco }}
                  {{ qr.expires_at | tenantDate: true }}
                </span>
                <span class="poll-label">
                  {{
                    'public.tenantQrGenerate.pollingStatusLabel'
                      | transloco: { seconds: pollIntervalSec }
                  }}
                </span>
              </div>
            }

            <hr class="divider" />

            <div class="qr-actions">
              <app-button
                appearance="secondary"
                (clicked)="manualVerify(qr)"
                [disabled]="polling()"
                [loading]="polling()"
              >
                <lucide-icon [img]="RefreshCw" [size]="16" />
                {{ 'public.tenantQrGenerate.verifyNow' | transloco }}
              </app-button>
              @if (qrSafeUrl()) {
                <app-button appearance="secondary" (clicked)="downloadQr(qr)">
                  <lucide-icon [img]="Download" [size]="16" />
                  {{ 'public.tenantQrGenerate.downloadQr' | transloco }}
                </app-button>
              }
              <app-button
                appearance="outline"
                (clicked)="onCancel(qr)"
                [disabled]="cancelling()"
                [loading]="cancelling()"
              >
                <lucide-icon [img]="XCircle" [size]="16" />
                {{ 'public.tenantQrGenerate.cancelQr' | transloco }}
              </app-button>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: `
    .qr-container {
      max-width: 560px;
      margin: 0 auto;
      padding: var(--app-space-6);
    }

    .page-header {
      display: flex;
      align-items: center;
      gap: var(--app-space-4);
      margin-bottom: var(--app-space-6);
    }
    .page-header h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--app-color-text);
      margin: 0 0 4px;
    }
    .page-header p {
      color: var(--app-color-text-muted);
      margin: 0;
      font-size: 0.875rem;
    }
    .back-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--app-color-surface);
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-md);
      color: var(--app-color-text);
      cursor: pointer;
      padding: var(--app-space-2);
    }
    .back-btn:hover {
      background: var(--app-color-surface-hover);
    }

    .alert {
      display: flex;
      align-items: center;
      gap: var(--app-space-2);
      padding: var(--app-space-3) var(--app-space-4);
      border-radius: var(--app-radius-md);
      margin-bottom: var(--app-space-4);
      font-size: 0.875rem;
    }
    .alert-error {
      background: #fee2e2;
      color: #dc2626;
    }

    .form-card {
      background: var(--app-color-surface);
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-lg);
      padding: var(--app-space-6);
    }
    .card-header {
      display: flex;
      align-items: center;
      gap: var(--app-space-3);
      margin-bottom: var(--app-space-4);
    }
    .card-header h2 {
      font-size: 1rem;
      font-weight: 700;
      color: var(--app-color-text);
      margin: 0;
    }
    .icon-primary {
      color: var(--app-color-primary);
    }

    .divider {
      border: none;
      border-top: 1px solid var(--app-color-border);
      margin: var(--app-space-4) 0;
    }

    .info-banner {
      display: flex;
      align-items: flex-start;
      gap: var(--app-space-2);
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: var(--app-radius-md);
      padding: var(--app-space-3) var(--app-space-4);
      font-size: 0.85rem;
      color: #1e40af;
      line-height: 1.5;
    }

    .qr-form {
      display: grid;
      gap: var(--app-space-4);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--app-space-4);
    }
    .field-group {
      display: grid;
      gap: var(--app-space-1);
    }
    .field-error {
      color: #dc2626;
      font-size: 0.8rem;
    }

    .form-actions {
      display: flex;
      gap: var(--app-space-3);
      justify-content: flex-end;
      padding-top: var(--app-space-4);
      border-top: 1px solid var(--app-color-border);
    }

    .qr-display-card {
      background: var(--app-color-surface);
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-lg);
      overflow: hidden;
    }
    .qr-display-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--app-space-4) var(--app-space-6);
    }
    .qr-amount-label {
      font-size: 0.75rem;
      color: var(--app-color-text-muted);
      font-weight: 600;
      text-transform: uppercase;
      display: block;
    }
    .qr-amount-value {
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--app-color-text);
    }
    .qr-amount-value small {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--app-color-text-muted);
      margin-left: 4px;
    }
    .qr-status-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .qr-status-chip.pending {
      background: #fef3c7;
      color: #92400e;
    }

    .qr-image-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: var(--app-space-6) 0 var(--app-space-4);
      background: var(--app-color-bg);
    }
    .qr-image {
      width: 300px;
      height: 300px;
      border-radius: var(--app-radius-lg);
      border: 3px solid var(--app-color-border);
      display: block;
    }
    .qr-placeholder {
      width: 300px;
      height: 300px;
      border-radius: var(--app-radius-lg);
      border: 3px dashed var(--app-color-border);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--app-space-2);
      color: var(--app-color-text-muted);
    }

    .qr-steps {
      display: flex;
      flex-direction: column;
      gap: var(--app-space-2);
      padding: var(--app-space-4) var(--app-space-6);
    }
    .step {
      display: flex;
      align-items: center;
      gap: var(--app-space-3);
      font-size: 0.875rem;
      color: var(--app-color-text-secondary);
    }
    .step-no {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--app-color-primary);
      color: #fff;
      font-size: 0.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .expires-row {
      display: flex;
      align-items: center;
      gap: var(--app-space-2);
      padding: var(--app-space-2) var(--app-space-6) var(--app-space-4);
      font-size: 0.8rem;
      color: var(--app-color-text-muted);
    }
    .poll-label {
      margin-left: auto;
      font-size: 0.75rem;
    }

    .qr-actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--app-space-3);
      padding: var(--app-space-4) var(--app-space-6);
      justify-content: center;
    }

    .result-card {
      background: var(--app-color-surface);
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-lg);
      padding: var(--app-space-8) var(--app-space-6);
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--app-space-3);
    }
    .result-card h2 {
      font-size: 1.4rem;
      font-weight: 700;
      margin: 0;
    }
    .result-card p {
      color: var(--app-color-text-muted);
      margin: 0;
    }
    .result-card.success .result-icon {
      color: #10b981;
    }
    .result-card.expired .result-icon {
      color: var(--app-color-text-muted);
    }
    .result-card.cancelled .result-icon {
      color: #ef4444;
    }

    .tx-id {
      font-family: monospace;
      font-size: 0.82rem;
      background: var(--app-color-bg);
      padding: 3px 10px;
      border-radius: var(--app-radius-sm);
      color: var(--app-color-text-secondary);
    }
    .result-actions {
      display: flex;
      gap: var(--app-space-3);
      flex-wrap: wrap;
      justify-content: center;
    }

    @media (max-width: 600px) {
      .qr-container {
        padding: var(--app-space-4);
      }
      .form-row {
        grid-template-columns: 1fr;
      }
      .qr-display-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--app-space-3);
      }
      .form-actions,
      .qr-actions,
      .result-actions {
        flex-direction: column;
      }
    }
  `,
})
export class TenantQrGenerateComponent {
  readonly ArrowLeft = ArrowLeft;
  readonly QrCode = QrCode;
  readonly CheckCircle2 = CheckCircle2;
  readonly AlertCircle = AlertCircle;
  readonly RefreshCw = RefreshCw;
  readonly XCircle = XCircle;
  readonly Clock = Clock;
  readonly Banknote = Banknote;
  readonly Info = Info;
  readonly Download = Download;

  readonly qrService = inject(TenantQrPaymentService);
  private readonly fb = inject(FormBuilder);
  private readonly slugService = inject(SlugService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);
  readonly contractService = inject(TenantContractService);

  readonly QrStatus = QrPaymentStatus;

  readonly polling = signal(false);
  readonly cancelling = signal(false);
  readonly pollIntervalSec = 5;
  private pollTimer?: ReturnType<typeof setInterval>;

  readonly currencyOptions: AppSelectOption[] = Object.keys(Currency).map((k) => {
    const val = Currency[k as keyof typeof Currency];
    return {
      value: val,
      label: `${CurrencySymbols[val]} — ${CurrencyLabels[val]}`,
    };
  });

  readonly paymentTypeOptions: AppSelectOption[] = Object.keys(PaymentType).map((k) => {
    const val = PaymentType[k as keyof typeof PaymentType];
    return { value: val, label: PaymentTypeLabels[val] };
  });

  readonly form = this.fb.group({
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    currency: [Currency.BOB, Validators.required],
    payment_type: [PaymentType.RENT, Validators.required],
    notes: [''],
  });

  readonly qrSafeUrl = computed<SafeUrl | null>(() => {
    const qr = this.qrService.activeQr();
    if (!qr?.qr_image) return null;
    if (qr.qr_image.startsWith('http')) {
      return this.sanitizer.bypassSecurityTrustUrl(qr.qr_image);
    }
    const src = qr.qr_image.startsWith('data:')
      ? qr.qr_image
      : `data:image/png;base64,${qr.qr_image}`;
    return this.sanitizer.bypassSecurityTrustUrl(src);
  });

  constructor() {
    this.qrService.clearError();
    this.qrService.clearActiveQr();
    this.destroyRef.onDestroy(() => this.stopPolling());
    this.prefillFromContract();
  }

  private prefillFromContract(): void {
    if (!this.contractService.currentContract()) {
      this.contractService.loadCurrentContract();
    }
    const tryPrefill = (): void => {
      const c = this.contractService.currentContract();
      if (c) {
        const amount =
          typeof c.monthly_rent === 'number'
            ? c.monthly_rent
            : parseFloat(c.monthly_rent as unknown as string) || null;
        const currency = this.normalizeCurrency(c.currency) ?? Currency.BOB;
        this.form.patchValue({ amount, currency });
      } else if (this.contractService.isLoading()) {
        setTimeout(tryPrefill, 300);
      }
    };
    setTimeout(tryPrefill, 150);
  }

  private normalizeCurrency(value?: string): Currency | null {
    if (!value) return null;
    const u = value.toUpperCase();
    return Object.values(Currency).includes(u as Currency) ? (u as Currency) : null;
  }

  currencySymbol(code: string): string {
    return CurrencySymbols[code as Currency] ?? code;
  }

  onGenerate(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const val = this.form.value;
    this.qrService
      .generateQr({
        amount: val.amount!,
        currency: val.currency ?? Currency.BOB,
        payment_type: val.payment_type ?? PaymentType.RENT,
        notes: val.notes || undefined,
      })
      .subscribe({ next: () => this.startPolling() });
  }

  manualVerify(qr: QrPayment): void {
    this.doVerify(qr);
  }

  onCancel(qr: QrPayment): void {
    this.cancelling.set(true);
    this.stopPolling();
    this.qrService.cancelQr(qr.id).subscribe({
      next: () => this.resetQr(),
      error: () => this.cancelling.set(false),
    });
  }

  downloadQr(qr: QrPayment): void {
    const raw = qr.qr_image;
    if (!raw) return;
    const href =
      raw.startsWith('http') || raw.startsWith('data:') ? raw : `data:image/png;base64,${raw}`;
    const a = document.createElement('a');
    a.href = href;
    a.download = `QR-pago-${qr.id}.png`;
    a.click();
  }

  resetQr(): void {
    this.stopPolling();
    this.qrService.clearActiveQr();
    this.qrService.clearError();
    this.form.reset({ currency: Currency.BOB, payment_type: PaymentType.RENT });
  }

  goBack(): void {
    this.slugService.navigateTo(['portal', 'pagos']);
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollTimer = setInterval(() => {
      const qr = this.qrService.activeQr();
      if (!qr || this.qrService.isTerminalStatus(qr.status)) {
        this.stopPolling();
        return;
      }
      this.doVerify(qr);
    }, this.pollIntervalSec * 1000);
  }

  private stopPolling(): void {
    if (this.pollTimer !== undefined) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }
    this.polling.set(false);
  }

  private doVerify(qr: QrPayment): void {
    this.polling.set(true);
    this.qrService.verifyQr({ qr_id: qr.id }).subscribe({
      next: (updated) => {
        this.polling.set(false);
        if (this.qrService.isTerminalStatus(updated.status)) this.stopPolling();
      },
      error: () => this.polling.set(false),
    });
  }
}
