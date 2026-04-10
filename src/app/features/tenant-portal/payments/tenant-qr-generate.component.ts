import { Component, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import {
  LucideAngularModule,
  ArrowLeft,
  QrCode,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  XCircle,
  Clock,
  Banknote,
  Info,
  Download,
} from 'lucide-angular';

import { TenantQrPaymentService } from '../../../core/services/tenant/tenant-qr-payment.service';
import { SlugService } from '../../../core/services/slug.service';
import { TenantContractService } from '../../../core/services/tenant/tenant-contract.service';
import {
  QrPayment,
  QrPaymentStatus,
  PaymentType,
  PaymentTypeLabels,
  Currency,
  CurrencyLabels,
  CurrencySymbols,
} from '../../../core/models/payment.model';

@Component({
  selector: 'app-tenant-qr-generate',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    LucideAngularModule,
  ],
  template: `
    <div class="qr-container">
      <!-- Header -->
      <div class="page-header">
        <button mat-icon-button (click)="goBack()" class="back-btn">
          <lucide-icon [img]="ArrowLeft" [size]="24"></lucide-icon>
        </button>
        <div>
          <h1>Pagar con QR</h1>
          <p>Genera un código QR y escanealo con tu app bancaria</p>
        </div>
      </div>

      <!-- Error global -->
      @if (qrService.error()) {
        <div class="alert alert-error">
          <lucide-icon [img]="AlertCircle" [size]="18"></lucide-icon>
          <span>{{ qrService.error() }}</span>
        </div>
      }

      <!-- ═══════════════════════════════════════════════════════════ -->
      <!-- PASO 1 — Formulario (sin QR activo)                        -->
      <!-- ═══════════════════════════════════════════════════════════ -->
      @if (!qrService.activeQr()) {
        <mat-card class="form-card">
          <div class="card-header">
            <lucide-icon [img]="QrCode" [size]="24" class="icon-primary"></lucide-icon>
            <h2>Datos del Pago</h2>
          </div>
          <mat-divider></mat-divider>

          <!-- Info sobre MC4/SIP -->
          <div class="info-banner">
            <lucide-icon [img]="Info" [size]="16"></lucide-icon>
            <span>
              El código QR es compatible con <strong>MC4 / SIP Bolivia</strong>. Puedes escanerlo
              desde cualquier app bancaria que soporte QR de pago interbancario.
            </span>
          </div>

          <form [formGroup]="form" (ngSubmit)="onGenerate()" class="qr-form">
            <!-- Monto + Moneda -->
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Monto *</mat-label>
                <span matTextPrefix>Bs&nbsp;</span>
                <input
                  matInput
                  type="number"
                  formControlName="amount"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                />
                @if (form.get('amount')?.invalid && form.get('amount')?.touched) {
                  <mat-error>Ingresa un monto válido</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Moneda</mat-label>
                <mat-select formControlName="currency">
                  @for (c of currencies; track c.value) {
                    <mat-option [value]="c.value"> {{ c.symbol }} — {{ c.label }} </mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>

            <!-- Tipo de pago -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Tipo de Pago *</mat-label>
              <mat-select formControlName="payment_type">
                @for (t of paymentTypes; track t.value) {
                  <mat-option [value]="t.value">{{ t.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <!-- Nota opcional -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nota (opcional)</mat-label>
              <input
                matInput
                formControlName="notes"
                maxlength="200"
                placeholder="Ej. Pago de enero 2026"
              />
            </mat-form-field>

            <div class="form-actions">
              <button
                type="submit"
                mat-raised-button
                color="primary"
                [disabled]="form.invalid || qrService.isLoading()"
              >
                @if (qrService.isLoading()) {
                  <mat-spinner diameter="20"></mat-spinner>
                  Generando...
                } @else {
                  <lucide-icon [img]="QrCode" [size]="20"></lucide-icon>
                  Generar QR
                }
              </button>
              <button type="button" mat-stroked-button (click)="goBack()">Cancelar</button>
            </div>
          </form>
        </mat-card>
      }

      <!-- ═══════════════════════════════════════════════════════════ -->
      <!-- PASO 2 — QR generado: mostrar imagen + polling             -->
      <!-- ═══════════════════════════════════════════════════════════ -->
      @if (qrService.activeQr(); as qr) {
        <!-- ── PAGADO ── -->
        @if (qr.status === QrStatus.PAGADO) {
          <mat-card class="result-card success">
            <lucide-icon [img]="CheckCircle2" [size]="56" class="result-icon"></lucide-icon>
            <h2>¡Pago Confirmado!</h2>
            <p>
              Tu pago por
              <strong>{{ currencySymbol(qr.currency) }}{{ qr.amount | number: '1.2-2' }}</strong>
              fue procesado exitosamente.
            </p>
            @if (qr.transaction_id) {
              <span class="tx-id">TXN: {{ qr.transaction_id }}</span>
            }
            <div class="result-actions">
              <button mat-raised-button color="primary" (click)="goBack()">Volver a Pagos</button>
              <button mat-stroked-button (click)="resetQr()">Generar Otro QR</button>
            </div>
          </mat-card>
        }

        <!-- ── EXPIRADO ── -->
        @if (qr.status === QrStatus.EXPIRADO) {
          <mat-card class="result-card expired">
            <lucide-icon [img]="Clock" [size]="56" class="result-icon"></lucide-icon>
            <h2>QR Expirado</h2>
            <p>El código QR venció sin recibir pago. Genera uno nuevo.</p>
            <button mat-raised-button color="primary" (click)="resetQr()">Generar Nuevo QR</button>
          </mat-card>
        }

        <!-- ── CANCELADO ── -->
        @if (qr.status === QrStatus.CANCELADO) {
          <mat-card class="result-card cancelled">
            <lucide-icon [img]="XCircle" [size]="56" class="result-icon"></lucide-icon>
            <h2>QR Cancelado</h2>
            <p>Este código QR fue cancelado.</p>
            <button mat-raised-button color="primary" (click)="resetQr()">Generar Nuevo QR</button>
          </mat-card>
        }

        <!-- ── PENDIENTE / PROCESANDO ── -->
        @if (qr.status === QrStatus.PENDIENTE) {
          <mat-card class="qr-display-card">
            <div class="qr-display-header">
              <div class="qr-amount">
                <span class="qr-amount-label">Total a pagar</span>
                <span class="qr-amount-value">
                  {{ currencySymbol(qr.currency) }}{{ qr.amount | number: '1.2-2' }}
                  <small>{{ qr.currency }}</small>
                </span>
              </div>
              <div class="qr-status-chip pending">
                <lucide-icon [img]="Clock" [size]="14"></lucide-icon>
                <span>Esperando pago...</span>
              </div>
            </div>

            <mat-divider></mat-divider>

            <!-- Imagen QR -->
            <div class="qr-image-wrapper">
              @if (qrSafeUrl()) {
                <img [src]="qrSafeUrl()!" alt="Código QR de pago" class="qr-image" />
              } @else {
                <div class="qr-placeholder">
                  <lucide-icon [img]="QrCode" [size]="80"></lucide-icon>
                  <span>QR no disponible</span>
                </div>
              }
            </div>

            <!-- Instrucciones -->
            <div class="qr-steps">
              <div class="step">
                <span class="step-no">1</span>Abre tu app bancaria o billetera digital
              </div>
              <div class="step">
                <span class="step-no">2</span>Selecciona la opción <strong>Pagar con QR</strong>
              </div>
              <div class="step">
                <span class="step-no">3</span>Escanea el código y confirma el pago
              </div>
              <div class="step">
                <span class="step-no">4</span>Esta pantalla se actualizará automáticamente
              </div>
            </div>

            <!-- Vence -->
            @if (qr.expires_at) {
              <div class="expires-row">
                <lucide-icon [img]="Clock" [size]="14"></lucide-icon>
                <span>Vence: {{ formatDate(qr.expires_at) }}</span>
                <span class="poll-label"> Verificando cada {{ pollIntervalSec }}s </span>
              </div>
            }

            <mat-divider></mat-divider>

            <div class="qr-actions">
              <button mat-stroked-button (click)="manualVerify(qr)" [disabled]="polling()">
                @if (polling()) {
                  <mat-spinner diameter="16"></mat-spinner>
                } @else {
                  <lucide-icon [img]="RefreshCw" [size]="16"></lucide-icon>
                }
                Verificar ahora
              </button>
              @if (qrSafeUrl()) {
                <button mat-stroked-button (click)="downloadQr(qr)">
                  <lucide-icon [img]="Download" [size]="16"></lucide-icon>
                  Descargar QR
                </button>
              }
              <button
                mat-stroked-button
                color="warn"
                (click)="onCancel(qr)"
                [disabled]="cancelling()"
              >
                @if (cancelling()) {
                  <mat-spinner diameter="16"></mat-spinner>
                } @else {
                  <lucide-icon [img]="XCircle" [size]="16"></lucide-icon>
                }
                Cancelar QR
              </button>
            </div>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [
    `
      .qr-container {
        max-width: 560px;
        margin: 0 auto;
      }

      /* Header */
      .page-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
      }
      .page-header h1 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0 0 4px;
      }
      .page-header p {
        color: #64748b;
        margin: 0;
        font-size: 0.88rem;
      }

      /* Alerts */
      .alert {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 18px;
        border-radius: 8px;
        margin-bottom: 20px;
        font-size: 0.9rem;
      }
      .alert-error {
        background: #fee2e2;
        color: #dc2626;
      }

      /* Form card */
      .form-card {
        padding: 28px;
      }
      .card-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }
      .card-header h2 {
        font-size: 1rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0;
      }
      .icon-primary {
        color: var(--mat-sys-primary, #1976d2);
      }

      .info-banner {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        border-radius: 8px;
        padding: 12px 16px;
        margin: 16px 0 20px;
        font-size: 0.85rem;
        color: #1e40af;
        line-height: 1.5;
      }
      .info-banner lucide-icon {
        margin-top: 2px;
        flex-shrink: 0;
        color: #3b82f6;
      }

      .qr-form {
        margin-top: 20px;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 16px;
      }
      .form-row mat-form-field {
        width: 100%;
      }
      .full-width {
        width: 100%;
        display: block;
        margin-bottom: 16px;
      }
      .form-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        padding-top: 16px;
        border-top: 1px solid #e2e8f0;
      }
      .form-actions button {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      /* QR Display */
      .qr-display-card {
        padding: 0;
        overflow: hidden;
      }
      .qr-display-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
      }
      .qr-amount-label {
        font-size: 0.75rem;
        color: #94a3b8;
        font-weight: 600;
        text-transform: uppercase;
        display: block;
      }
      .qr-amount-value {
        font-size: 1.6rem;
        font-weight: 800;
        color: #1e293b;
      }
      .qr-amount-value small {
        font-size: 0.85rem;
        font-weight: 500;
        color: #64748b;
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

      /* QR Image */
      .qr-image-wrapper {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 28px 0 20px;
        background: #f8fafc;
      }
      .qr-image {
        width: 320px;
        height: 320px;
        border-radius: 12px;
        border: 3px solid #e2e8f0;
        display: block;
      }
      .qr-placeholder {
        width: 320px;
        height: 320px;
        border-radius: 12px;
        border: 3px dashed #cbd5e1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        color: #94a3b8;
      }
      /* Steps */
      .qr-steps {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 20px 24px 16px;
      }
      .step {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 0.88rem;
        color: #475569;
      }
      .step-no {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: var(--mat-sys-primary, #1976d2);
        color: white;
        font-size: 0.75rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      /* Expires row */
      .expires-row {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 24px 16px;
        font-size: 0.8rem;
        color: #64748b;
      }
      .poll-label {
        margin-left: auto;
        color: #94a3b8;
        font-size: 0.75rem;
      }

      /* QR Actions */
      .qr-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        padding: 16px 24px;
        justify-content: center;
      }
      .qr-actions button {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      /* Result cards */
      .result-card {
        padding: 48px 32px;
        text-align: center;
      }
      .result-card h2 {
        margin: 12px 0 8px;
        font-size: 1.4rem;
        font-weight: 700;
      }
      .result-card p {
        color: #64748b;
        margin: 0 0 20px;
      }
      .result-card.success .result-icon {
        color: #10b981;
      }
      .result-card.expired .result-icon {
        color: #64748b;
      }
      .result-card.cancelled .result-icon {
        color: #ef4444;
      }

      .tx-id {
        display: inline-block;
        font-family: monospace;
        font-size: 0.82rem;
        background: #f1f5f9;
        padding: 3px 10px;
        border-radius: 6px;
        margin-bottom: 20px;
        color: #475569;
      }

      .result-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
        flex-wrap: wrap;
      }

      /* Responsive */
      @media (max-width: 600px) {
        .form-row {
          grid-template-columns: 1fr;
        }
        .qr-display-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
        }
        .form-actions {
          flex-direction: column-reverse;
        }
        .form-actions button {
          width: 100%;
          justify-content: center;
        }
        .qr-actions {
          flex-direction: column;
        }
        .qr-actions button {
          width: 100%;
          justify-content: center;
        }
        .result-actions {
          flex-direction: column;
        }
        .result-actions button {
          width: 100%;
        }
      }
    `,
  ],
})
export class TenantQrGenerateComponent implements OnInit, OnDestroy {
  // ── Icons ─────────────────────────────────────────────────────────
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
  // ── Services ──────────────────────────────────────────────────────
  qrService = inject(TenantQrPaymentService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private slugService = inject(SlugService);
  private sanitizer = inject(DomSanitizer);
  contractService = inject(TenantContractService);

  // ── Enums exposed to template ─────────────────────────────────────
  QrStatus = QrPaymentStatus;

  // ── State ─────────────────────────────────────────────────────────
  polling = signal(false);
  cancelling = signal(false);

  readonly pollIntervalSec = 5;
  private pollTimer?: ReturnType<typeof setInterval>;

  // ── Form data ─────────────────────────────────────────────────────
  paymentTypes = Object.keys(PaymentType).map((k) => ({
    value: PaymentType[k as keyof typeof PaymentType],
    label: PaymentTypeLabels[PaymentType[k as keyof typeof PaymentType]],
  }));

  currencies = Object.keys(Currency).map((k) => ({
    value: Currency[k as keyof typeof Currency],
    label: CurrencyLabels[Currency[k as keyof typeof Currency]],
    symbol: CurrencySymbols[Currency[k as keyof typeof Currency]],
  }));

  form = this.fb.group({
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    currency: [Currency.BOB, Validators.required],
    payment_type: [PaymentType.RENT, Validators.required],
    notes: [''],
  });

  // ── SafeUrl for QR image ──────────────────────────────────────────
  qrSafeUrl = computed<SafeUrl | null>(() => {
    const qr = this.qrService.activeQr();
    if (!qr?.qr_image) return null;
    // Si ya es una URL completa (http/https), úsala directo
    if (qr.qr_image.startsWith('http')) {
      return this.sanitizer.bypassSecurityTrustUrl(qr.qr_image);
    }
    // Si es base64
    const src = qr.qr_image.startsWith('data:')
      ? qr.qr_image
      : `data:image/png;base64,${qr.qr_image}`;
    return this.sanitizer.bypassSecurityTrustUrl(src);
  });

  // ── Lifecycle ─────────────────────────────────────────────────────
  ngOnInit(): void {
    this.qrService.clearError();
    this.qrService.clearActiveQr();

    // Pre-rellenar monto del contrato
    if (!this.contractService.currentContract()) {
      this.contractService.loadCurrentContract();
    }
    const tryPrefill = () => {
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

  ngOnDestroy(): void {
    this.stopPolling();
  }

  // ── Helpers ───────────────────────────────────────────────────────
  private normalizeCurrency(value?: string): Currency | null {
    if (!value) return null;
    const u = value.toUpperCase();
    return Object.values(Currency).includes(u as Currency) ? (u as Currency) : null;
  }

  currencySymbol(code: string): string {
    return CurrencySymbols[code as Currency] ?? code;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('es-BO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // ── Actions ───────────────────────────────────────────────────────
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
      .subscribe({
        next: () => this.startPolling(),
        error: () => {}, // el servicio ya setea el error signal
      });
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
    this.form.reset({
      currency: Currency.BOB,
      payment_type: PaymentType.RENT,
    });
  }

  goBack(): void {
    this.slugService.navigateTo(['portal', 'pagos']);
  }

  // ── Polling ───────────────────────────────────────────────────────
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
        if (this.qrService.isTerminalStatus(updated.status)) {
          this.stopPolling();
        }
      },
      error: () => this.polling.set(false),
    });
  }
}
