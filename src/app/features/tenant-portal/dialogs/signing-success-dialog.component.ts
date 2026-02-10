import { Component, inject } from '@angular/core';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { LucideAngularModule, CheckCircle, FileText } from 'lucide-angular';
import { Contract } from '../../../core/services/tenant-contract.service';

export interface SigningSuccessDialogData {
  contract: Contract;
}

@Component({
  selector: 'app-signing-success-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    LucideAngularModule
  ],
  template: `
    <div class="success-dialog-container">
      <div class="success-icon">
        <lucide-icon [img]="CheckCircle" [size]="64"></lucide-icon>
      </div>
      <h2 class="success-title">¡Contrato Firmado Exitosamente!</h2>
      <p class="success-message">
        Tu firma digital ha sido registrada correctamente. El contrato ahora tiene validez legal.
      </p>

      <div class="contract-info">
        <div class="info-row">
          <lucide-icon [img]="FileText" [size]="18"></lucide-icon>
          <span class="info-label">Número de contrato:</span>
          <span class="info-value">{{ data.contract.contract_number }}</span>
        </div>
      </div>

      <div class="success-details">
        <p class="detail-item">
          <strong>Fecha de firma:</strong> {{ signingDate }}
        </p>
        <p class="detail-item">
          Tu firma ha sido almacenada de forma segura para fines de verificación.
        </p>
      </div>

      <div class="dialog-actions">
        <button
          mat-raised-button
          color="primary"
          (click)="onClose()"
          class="close-btn">
          Entendido
        </button>
      </div>
    </div>
  `,
  styles: [`
    .success-dialog-container {
      padding: 32px 24px;
      text-align: center;
    }

    .success-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      margin-bottom: 20px;
      animation: scaleIn 0.3s ease-out;
    }

    @keyframes scaleIn {
      from {
        transform: scale(0);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }

    .success-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 12px 0;
    }

    .success-message {
      font-size: 1rem;
      color: #64748b;
      margin: 0 0 24px 0;
      line-height: 1.6;
    }

    .contract-info {
      background: #f8fafc;
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 20px;
      text-align: left;
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.95rem;
    }

    .info-row lucide-icon {
      color: var(--mat-sys-primary);
    }

    .info-label {
      color: #64748b;
      font-weight: 500;
    }

    .info-value {
      color: #1e293b;
      font-weight: 600;
      font-family: monospace;
    }

    .success-details {
      background: #ecfdf5;
      border-left: 4px solid #10b981;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
      text-align: left;
    }

    .detail-item {
      margin: 0 0 8px 0;
      font-size: 0.9rem;
      color: #065f46;
      line-height: 1.5;
    }

    .detail-item:last-child {
      margin-bottom: 0;
    }

    .detail-item strong {
      color: #047857;
      font-weight: 600;
    }

    .dialog-actions {
      display: flex;
      justify-content: center;
    }

    .close-btn {
      min-width: 150px;
      padding: 12px 32px;
      font-size: 1rem;
      font-weight: 600;
    }

    @media (max-width: 600px) {
      .success-dialog-container {
        padding: 24px 16px;
      }

      .success-title {
        font-size: 1.25rem;
      }

      .success-message {
        font-size: 0.95rem;
      }
    }
  `]
})
export class SigningSuccessDialogComponent {
  readonly CheckCircle = CheckCircle;
  readonly FileText = FileText;

  private dialogRef: MatDialogRef<SigningSuccessDialogComponent> = inject(MatDialogRef<SigningSuccessDialogComponent>);
  readonly data = inject<SigningSuccessDialogData>(MAT_DIALOG_DATA);

  signingDate = this.formatDate(new Date());

  onClose(): void {
    this.dialogRef.close(true);
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
