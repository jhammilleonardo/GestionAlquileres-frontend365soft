import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { LucideAngularModule, FileCheck, DollarSign, Calendar, AlertTriangle, Info, Building, Check } from 'lucide-angular';
import { Contract } from '../../../core/services/tenant-contract.service';

export interface ContractSigningDialogData {
  contract: Contract;
}

@Component({
  selector: 'app-contract-signing-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatCheckboxModule,
    FormsModule,
    LucideAngularModule
  ],
  template: `
    <div class="signing-dialog-wrapper">
      <div class="signing-dialog-container">
        <!-- Header -->
        <div class="dialog-header">
        <div class="header-icon">
          <lucide-icon [img]="FileCheck" [size]="32"></lucide-icon>
        </div>
        <h2 class="dialog-title">Confirmación de Firma del Contrato</h2>
        <p class="dialog-subtitle">Por favor, revisa y confirma todos los detalles antes de firmar</p>
      </div>

      <mat-divider></mat-divider>

      <!-- Content -->
      @if (contract()) {
        <div class="dialog-content">
          <!-- Alerta importante -->
          <div class="important-notice">
          <lucide-icon [img]="AlertTriangle" [size]="20"></lucide-icon>
          <span>
            <strong>Importante:</strong> Al firmar este contrato, aceptas todos los términos y condiciones.
            Esta acción es <strong>irreversible</strong> y tendrá validez legal.
          </span>
        </div>

        <!-- Resumen del contrato -->
        <div class="contract-summary">
          <h3 class="section-title">
            <lucide-icon [img]="Info" [size]="18"></lucide-icon>
            Información del Contrato
          </h3>

          <div class="summary-grid">
            <div class="summary-item">
              <span class="label">Número de contrato:</span>
              <span class="value contract-number">{{ c.contract_number }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Propiedad:</span>
              <span class="value">
                @if (c.property && c.property.title) {
                  {{ c.property.title }}
                } @else {
                  <em style="color: #94a3b8;">No especificada</em>
                }
              </span>
            </div>
            <div class="summary-item">
              <span class="label">Fecha de inicio:</span>
              <span class="value">{{ formatDate(c.start_date) }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Fecha de finalización:</span>
              <span class="value">{{ formatDate(c.end_date) }}</span>
            </div>
          </div>
        </div>

        <!-- Información de pago -->
        <div class="payment-info">
          <h3 class="section-title">
            <lucide-icon [img]="DollarSign" [size]="18"></lucide-icon>
            Información de Pago
          </h3>

          <div class="payment-highlight">
            <div class="rent-amount">
              <span class="rent-label">Alquiler mensual:</span>
              <span class="rent-value">
                {{ formatRent(c.monthly_rent) }}
                @if (c.currency) {
                  {{ c.currency }}
                }
              </span>
            </div>

            @if (c.deposit_amount) {
              <div class="deposit-amount">
                <span class="deposit-label">Depósito:</span>
                <span class="deposit-value">
                  {{ formatRent(+c.deposit_amount) }}
                  @if (c.currency) {
                    {{ c.currency }}
                  }
                </span>
              </div>
            }
          </div>

          <div class="payment-details">
            @if (c.payment_day) {
              <div class="detail-row">
                <lucide-icon [img]="Calendar" [size]="16"></lucide-icon>
                <span class="detail-text">
                  Día de pago: <strong>Día {{ c.payment_day }} de cada mes</strong>
                </span>
              </div>
            }

            <div class="detail-row">
              <lucide-icon [img]="Calendar" [size]="16"></lucide-icon>
              <span class="detail-text">
                Próximo pago: <strong>{{ calculateNextPaymentDate() }}</strong>
              </span>
            </div>

            @if (c.payment_method) {
              <div class="detail-row">
                <lucide-icon [img]="Info" [size]="16"></lucide-icon>
                <span class="detail-text">
                  Método de pago: <strong>{{ c.payment_method }}</strong>
                </span>
              </div>
            }
          </div>

          <!-- Datos bancarios -->
          @if (c.bank_name || c.bank_account_number) {
            <div class="bank-details">
              <h4 class="bank-title">
                <lucide-icon [img]="Building" [size]="16"></lucide-icon>
                Datos para Transferencia Bancaria
              </h4>
              <div class="bank-info-grid">
                @if (c.bank_name) {
                  <div class="bank-item">
                    <span class="bank-label">Banco:</span>
                    <span class="bank-value">{{ c.bank_name }}</span>
                  </div>
                }
                @if (c.bank_account_holder) {
                  <div class="bank-item">
                    <span class="bank-label">Titular:</span>
                    <span class="bank-value">{{ c.bank_account_holder }}</span>
                  </div>
                }
                @if (c.bank_account_type && c.bank_account_number) {
                  <div class="bank-item">
                    <span class="bank-label">Cuenta:</span>
                    <span class="bank-value">
                      {{ c.bank_account_type }} - {{ c.bank_account_number }}
                    </span>
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <!-- Términos importantes -->
        @if (c.included_services && c.included_services.length > 0) {
          <div class="terms-section">
            <h3 class="section-title">
              <lucide-icon [img]="Check" [size]="18"></lucide-icon>
              Servicios Incluidos
            </h3>
            <div class="services-list">
              @for (service of c.included_services; track $index) {
                <div class="service-item">
                  <span class="service-bullet">✓</span>
                  <span class="service-name">{{ service }}</span>
                </div>
              }
            </div>
          </div>
        }

        <!-- Aceptación de términos -->
        <div class="terms-acceptance">
          <mat-checkbox
            [(ngModel)]="acceptedTerms"
            [disabled]="isSigning"
            class="terms-checkbox">
            Entiendo y acepto que al firmar este contrato:
          </mat-checkbox>

          <ul class="terms-list">
            <li>Me comprometo a pagar el alquiler mensual de <strong>{{ formatRent(c.monthly_rent) }} {{ c.currency || '' }}</strong> puntualmente.</li>
            <li>Acepto que <strong>no se podrán realizar modificaciones</strong> al contrato después de la firma.</li>
            <li>Reconozco que este contrato tiene validez legal y es vinculante.</li>
            <li>Me comprometo a cumplir con todas las responsabilidades establecidas en el contrato.</li>
            @if (c.late_fee_percentage) {
              <li>Entiendo que los pagos tardíos tendrán una penalidad del <strong>{{ c.late_fee_percentage }}%</strong>.</li>
            }
          </ul>
        </div>
      </div>
      }

      <mat-divider></mat-divider>

      <!-- Actions -->
      <div class="dialog-actions">
        <button
          mat-button
          (click)="onCancel()"
          [disabled]="isSigning"
          class="cancel-btn">
          Cancelar
        </button>
        <button
          mat-raised-button
          color="primary"
          (click)="onConfirm()"
          [disabled]="!acceptedTerms || isSigning"
          class="confirm-btn">
          @if (isSigning) {
            <mat-spinner diameter="20" class="spinner"></mat-spinner>
            <span>Firmando...</span>
          } @else {
            <lucide-icon [img]="FileCheck" [size]="18"></lucide-icon>
            <span>Firmar Contrato</span>
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .signing-dialog-wrapper {
      max-height: 85vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .signing-dialog-container {
      padding: 24px;
      max-width: 650px;
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    /* Scrollbar personalizado */
    .signing-dialog-wrapper::-webkit-scrollbar,
    .signing-dialog-container::-webkit-scrollbar {
      width: 8px;
    }

    .signing-dialog-wrapper::-webkit-scrollbar-track,
    .signing-dialog-container::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 10px;
    }

    .signing-dialog-wrapper::-webkit-scrollbar-thumb,
    .signing-dialog-container::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 10px;
    }

    .signing-dialog-wrapper::-webkit-scrollbar-thumb:hover,
    .signing-dialog-container::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }

    .dialog-header {
      text-align: center;
      padding-bottom: 16px;
    }

    .header-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      margin-bottom: 16px;
    }

    .dialog-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 8px 0;
    }

    .dialog-subtitle {
      font-size: 0.95rem;
      color: #64748b;
      margin: 0;
    }

    mat-divider {
      margin: 0 0 24px 0;
    }

    .dialog-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
      overflow-y: auto;
      padding-right: 8px;
    }

    /* Scrollbar personalizado */
    .dialog-content::-webkit-scrollbar {
      width: 8px;
    }

    .dialog-content::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 10px;
    }

    .dialog-content::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 10px;
    }

    .dialog-content::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }

    .important-notice {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 14px 16px;
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      border-radius: 8px;
      font-size: 0.9rem;
      color: #92400e;
      line-height: 1.5;
    }

    .important-notice lucide-icon {
      flex-shrink: 0;
      margin-top: 2px;
    }

    .contract-summary,
    .payment-info,
    .terms-section {
      background: #f8fafc;
      border-radius: 12px;
      padding: 16px;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 14px 0;
    }

    .section-title lucide-icon {
      color: var(--mat-sys-primary);
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .summary-item .label {
      font-size: 0.8rem;
      color: #64748b;
      font-weight: 500;
    }

    .summary-item .value {
      font-size: 0.95rem;
      color: #1e293b;
      font-weight: 500;
    }

    .summary-item .value.contract-number {
      font-family: monospace;
      color: var(--mat-sys-primary);
      font-weight: 600;
    }

    .payment-highlight {
      background: white;
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 14px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .rent-amount {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .rent-label {
      font-size: 0.95rem;
      color: #64748b;
    }

    .rent-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--mat-sys-primary);
    }

    .deposit-amount {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 12px;
      border-top: 1px dashed #e2e8f0;
    }

    .deposit-label {
      font-size: 0.85rem;
      color: #64748b;
    }

    .deposit-value {
      font-size: 1.1rem;
      font-weight: 600;
      color: #1e293b;
    }

    .payment-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 14px;
    }

    .detail-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
      color: #475569;
    }

    .detail-row lucide-icon {
      color: var(--mat-sys-primary);
      flex-shrink: 0;
    }

    .detail-row strong {
      color: #1e293b;
    }

    .bank-details {
      background: #ede9fe;
      border-radius: 8px;
      padding: 12px;
      border: 1px solid #ddd6fe;
    }

    .bank-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #5b21b6;
      margin: 0 0 10px 0;
    }

    .bank-title lucide-icon {
      color: #7c3aed;
    }

    .bank-info-grid {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .bank-item {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
    }

    .bank-label {
      color: #7c3aed;
      font-weight: 500;
    }

    .bank-value {
      color: #1e293b;
      font-weight: 500;
    }

    .services-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .service-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .service-bullet {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      background: #d1fae5;
      color: #047857;
      border-radius: 50%;
      font-size: 12px;
      font-weight: 700;
    }

    .service-name {
      font-size: 0.9rem;
      color: #1e293b;
    }

    .terms-acceptance {
      background: #fff;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px;
    }

    .terms-checkbox {
      margin: 0 0 12px 0;
    }

    .terms-checkbox ::ng-deep .mdc-checkbox__background {
      border-color: var(--mat-sys-primary);
    }

    .terms-list {
      margin: 0;
      padding-left: 28px;
      list-style: none;
    }

    .terms-list li {
      font-size: 0.85rem;
      color: #475569;
      line-height: 1.6;
      margin-bottom: 8px;
      position: relative;
    }

    .terms-list li::before {
      content: '•';
      position: absolute;
      left: -18px;
      color: var(--mat-sys-primary);
      font-weight: 700;
    }

    .terms-list li:last-child {
      margin-bottom: 0;
    }

    .terms-list strong {
      color: #1e293b;
      font-weight: 600;
    }

    mat-divider:last-of-type {
      margin: 24px 0 0 0;
    }

    .dialog-actions {
      display: flex;
      gap: 12px;
      padding-top: 20px;
    }

    .cancel-btn {
      flex: 1;
      padding: 12px 24px;
      font-size: 0.95rem;
      font-weight: 500;
    }

    .confirm-btn {
      flex: 2;
      padding: 12px 24px;
      font-size: 0.95rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .confirm-btn:disabled {
      opacity: 0.6;
    }

    .confirm-btn .spinner {
      display: inline-block;
      margin: 0;
    }

    @media (max-width: 600px) {
      .signing-dialog-container {
        padding: 16px;
      }

      .dialog-title {
        font-size: 1.25rem;
      }

      .summary-grid {
        grid-template-columns: 1fr;
      }

      .rent-value {
        font-size: 1.5rem;
      }

      .dialog-actions {
        flex-direction: column;
      }

      .cancel-btn,
      .confirm-btn {
        width: 100%;
      }
    }
  `]
})
export class ContractSigningDialogComponent {
  readonly FileCheck = FileCheck;
  readonly DollarSign = DollarSign;
  readonly Calendar = Calendar;
  readonly AlertTriangle = AlertTriangle;
  readonly Info = Info;
  readonly Building = Building;
  readonly Check = Check;

  private dialogRef: MatDialogRef<ContractSigningDialogComponent> = inject(MatDialogRef<ContractSigningDialogComponent>);
  private data = inject<ContractSigningDialogData>(MAT_DIALOG_DATA);

  contract = signal<Contract | null>(null);
  acceptedTerms = false;
  isSigning = false;

  // Getter para obtener el contrato de forma segura (lanza error si es null)
  get c(): Contract {
    const contract = this.contract();
    if (!contract) {
      throw new Error('Contract is required but not available');
    }
    return contract;
  }

  ngOnInit(): void {
    // El contrato se pasa a través del MAT_DIALOG_DATA
    if (this.data?.contract) {
      this.contract.set(this.data.contract);
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    const contract = this.contract();
    if (!this.acceptedTerms || !contract) {
      return;
    }

    this.isSigning = true;
    this.dialogRef.close(true);
  }

  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  formatRent(rent: number): string {
    return rent.toLocaleString('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  calculateNextPaymentDate(): string {
    const contract = this.contract();
    if (!contract || !contract.payment_day) {
      return 'No especificado';
    }

    const today = new Date();
    const currentDay = today.getDate();
    let nextMonth = today.getMonth();
    let nextYear = today.getFullYear();

    // Si el día de pago ya pasó este mes, el próximo pago es el mes siguiente
    if (currentDay > contract.payment_day) {
      nextMonth++;
      if (nextMonth > 11) {
        nextMonth = 0;
        nextYear++;
      }
    }

    const nextPaymentDate = new Date(nextYear, nextMonth, contract.payment_day);

    return nextPaymentDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }
}
