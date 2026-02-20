import { Component, inject, OnInit, DestroyRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { LucideAngularModule, FileText, Download, ArrowLeft, Edit, CheckCircle2, AlertTriangle, Home, Calendar, DollarSign, FileCheck, Info, X } from 'lucide-angular';
import { TenantContractService, Contract, ContractStatus, ContractStatusLabels } from '../../../core/services/tenant-contract.service';
import { SlugService } from '../../../core/services/slug.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ContractSigningDialogComponent } from '../dialogs/contract-signing-dialog.component';
import { SigningSuccessDialogComponent } from '../dialogs/signing-success-dialog.component';

@Component({
  selector: 'app-tenant-contract-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatDialogModule,
    LucideAngularModule
  ],
  template: `
    <div class="contract-detail-container">
      <!-- Header -->
      <div class="detail-header">
        <button mat-stroked-button (click)="goBack()" class="back-btn">
          <lucide-icon [img]="ArrowLeft" [size]="18"></lucide-icon>
          Volver
        </button>
        <div class="header-info">
          @if (contract(); as c) {
            <h1>{{ c.contract_number }}</h1>
            <span class="status-badge" [class]="'status-' + c.status.toLowerCase()">
              {{ ContractStatusLabels[c.status] }}
            </span>
          }
        </div>
      </div>

      <!-- Loading -->
      @if (isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Cargando contrato...</p>
        </div>
      }

      <!-- Error -->
      @else if (error()) {
        <mat-card class="error-card">
          <div class="error-content">
            <lucide-icon [img]="X" [size]="48"></lucide-icon>
            <h2>Error</h2>
            <p>{{ error() }}</p>
            <button mat-raised-button color="primary" (click)="goBack()">Volver</button>
          </div>
        </mat-card>
      }

      <!-- Contract Detail -->
      @else if (contract(); as c) {
        <div class="contract-content">
          <!-- Alerta de firma pendiente -->
          @if (c.status === ContractStatus.BORRADOR) {
            <mat-card class="pending-signature-alert">
              <div class="alert-content">
                <lucide-icon [img]="AlertTriangle" [size]="32"></lucide-icon>
                <div class="alert-text">
                  <h3>Contrato pendiente de tu firma</h3>
                  <p>Revisa los términos y condiciones en esta página. Cuando estés listo, haz clic en <strong>"Firmar Contrato"</strong> para aceptarlos y activar el contrato.</p>
                </div>
              </div>
              <div class="alert-action">
                <button
                  mat-raised-button
                  color="primary"
                  (click)="signContract()"
                  [disabled]="isSigning()"
                  class="sign-btn-top">
                  <lucide-icon [img]="FileCheck" [size]="18"></lucide-icon>
                  {{ isSigning() ? 'Firmando...' : 'Firmar Contrato' }}
                </button>
              </div>
            </mat-card>
          }

          <!-- Confirmación de firma -->
          @if (c.status === ContractStatus.ACTIVO && c.signed_at) {
            <mat-card class="signed-confirmation">
              <div class="confirmation-content">
                <lucide-icon [img]="CheckCircle2" [size]="32"></lucide-icon>
                <div class="confirmation-text">
                  <h3>Contrato firmado</h3>
                  <p>Firmado digitalmente el {{ formatDate(c.signed_at) }}</p>
                </div>
              </div>
            </mat-card>
          }

          <!-- Información de la Propiedad -->
          <mat-card class="info-card">
            <div class="card-header">
              <lucide-icon [img]="Home" [size]="24"></lucide-icon>
              <h3>Propiedad</h3>
            </div>
            <div class="card-content">
              <h2 class="property-title">
                {{ c.property?.title || 'Propiedad no especificada' }}
              </h2>
              @if (c.property && c.property.address) {
                <p class="property-address">
                  {{ c.property.address }}
                </p>
              }
            </div>
          </mat-card>

          <!-- Fechas del Contrato -->
          <mat-card class="info-card">
            <div class="card-header">
              <lucide-icon [img]="Calendar" [size]="24"></lucide-icon>
              <h3>Vigencia del Contrato</h3>
            </div>
            <div class="card-content">
              <div class="dates-grid">
                <div class="date-item">
                  <span class="label">Fecha de inicio:</span>
                  <span class="value">{{ formatDate(c.start_date) }}</span>
                </div>
                <div class="date-item">
                  <span class="label">Fecha de finalización:</span>
                  <span class="value">{{ formatDate(c.end_date) }}</span>
                </div>
                @if (c.key_delivery_date) {
                  <div class="date-item">
                    <span class="label">Entrega de llaves:</span>
                    <span class="value">{{ formatDate(c.key_delivery_date) }}</span>
                  </div>
                }
                @if (c.signed_at) {
                  <div class="date-item signed">
                    <span class="label">Fecha de firma:</span>
                    <span class="value">{{ formatDate(c.signed_at) }}</span>
                  </div>
                }
              </div>
            </div>
          </mat-card>

          <!-- Condiciones Económicas -->
          <mat-card class="info-card">
            <div class="card-header">
              <lucide-icon [img]="DollarSign" [size]="24"></lucide-icon>
              <h3>Condiciones Económicas</h3>
            </div>
            <div class="card-content">
              <div class="economic-terms">
                <div class="term-item">
                  <span class="label">Alquiler mensual:</span>
                  <span class="value amount">
                    {{ formatRent(c.monthly_rent) }}
                    @if (c.currency) {
                      {{ c.currency }}
                    }
                  </span>
                </div>
                @if (c.deposit_amount) {
                  <div class="term-item">
                    <span class="label">Depósito:</span>
                    <span class="value">
                      {{ formatRent(+c.deposit_amount) }}
                      @if (c.currency) {
                        {{ c.currency }}
                      }
                    </span>
                  </div>
                }
                @if (c.payment_day) {
                  <div class="term-item">
                    <span class="label">Día de pago:</span>
                    <span class="value">Día {{ c.payment_day }} de cada mes</span>
                  </div>
                }
                @if (c.payment_method) {
                  <div class="term-item">
                    <span class="label">Método de pago:</span>
                    <span class="value">{{ c.payment_method }}</span>
                  </div>
                }
              </div>

              <!-- Datos bancarios -->
              @if (c.bank_name || c.bank_account_number) {
                <mat-divider class="my-4"></mat-divider>
                <div class="bank-info">
                  <h4>Datos para Transferencia</h4>
                  @if (c.bank_name) {
                    <p><strong>Banco:</strong> {{ c.bank_name }}</p>
                  }
                  @if (c.bank_account_holder) {
                    <p><strong>Titular:</strong> {{ c.bank_account_holder }}</p>
                  }
                  @if (c.bank_account_type && c.bank_account_number) {
                    <p><strong>Cuenta:</strong> {{ c.bank_account_type }} - {{ c.bank_account_number }}</p>
                  }
                </div>
              }
            </div>
          </mat-card>

          <!-- Servicios Incluidos -->
          @if (c.included_services && c.included_services.length > 0) {
            <mat-card class="info-card">
              <div class="card-header">
                <lucide-icon [img]="Info" [size]="24"></lucide-icon>
                <h3>Servicios Incluidos</h3>
              </div>
              <div class="card-content">
                <div class="services-list">
                  @for (service of c.included_services; track $index) {
                    <div class="service-item">
                      <span class="service-icon">✓</span>
                      <span class="service-name">{{ service }}</span>
                    </div>
                  }
                </div>
              </div>
            </mat-card>
          }

          <!-- Responsabilidades -->
          @if (c.tenant_responsibilities) {
            <mat-card class="info-card">
              <div class="card-header">
                <lucide-icon [img]="FileText" [size]="24"></lucide-icon>
                <h3>Mis Responsabilidades</h3>
              </div>
              <div class="card-content">
                <p class="terms-text">{{ c.tenant_responsibilities }}</p>
              </div>
            </mat-card>
          }

          <!-- Prohibiciones -->
          @if (c.prohibitions) {
            <mat-card class="info-card prohibitions">
              <div class="card-header">
                <lucide-icon [img]="AlertTriangle" [size]="24"></lucide-icon>
                <h3>Prohibiciones</h3>
              </div>
              <div class="card-content">
                <p class="terms-text">{{ c.prohibitions }}</p>
              </div>
            </mat-card>
          }

          <!-- Información adicional -->
          @if (c.renewal_terms || c.termination_terms || c.jurisdiction) {
            <mat-card class="info-card">
              <div class="card-header">
                <lucide-icon [img]="Info" [size]="24"></lucide-icon>
                <h3>Términos Adicionales</h3>
              </div>
              <div class="card-content">
                @if (c.renewal_terms) {
                  <div class="additional-term">
                    <h4>Renovación</h4>
                    <p>{{ c.renewal_terms }}</p>
                  </div>
                }
                @if (c.termination_terms) {
                  <div class="additional-term">
                    <h4>Terminación</h4>
                    <p>{{ c.termination_terms }}</p>
                  </div>
                }
                @if (c.jurisdiction) {
                  <div class="additional-term">
                    <h4>Jurisdicción</h4>
                    <p>{{ c.jurisdiction }}</p>
                  </div>
                }
              </div>
            </mat-card>
          }

          <!-- Actions Footer -->
          <div class="actions-footer">
            <button
              mat-stroked-button
              (click)="viewPDF()"
              class="action-btn download-btn">
              <lucide-icon [img]="Download" [size]="18"></lucide-icon>
              Ver PDF
            </button>

            @if (c.status === ContractStatus.BORRADOR) {
              <button
                mat-raised-button
                color="primary"
                (click)="signContract()"
                [disabled]="isSigning()"
                class="action-btn sign-btn">
                <lucide-icon [img]="FileCheck" [size]="18"></lucide-icon>
                @if (isSigning()) {
                  Firmando...
                } @else {
                  Firmar Contrato
                }
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .contract-detail-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 24px 0;
    }

    .detail-header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .back-btn {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .header-info {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .header-info h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }

    .status-badge {
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      display: inline-block;
    }

    .status-badge.status-borrador {
      background: #fef3c7;
      color: #b45309;
    }

    .status-badge.status-activo {
      background: #d1fae5;
      color: #047857;
    }

    .status-badge.status-finalizado {
      background: #e5e7eb;
      color: #374151;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      gap: 16px;
      color: #64748b;
    }

    .error-card {
      margin: 40px 0;
    }

    .error-content {
      text-align: center;
      padding: 40px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .error-content lucide-icon {
      color: #dc2626;
    }

    .error-content h2 {
      margin: 0;
      color: #1e293b;
    }

    .contract-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .pending-signature-alert {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-left: 4px solid #f59e0b;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
    }

    .alert-action {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid rgba(245, 158, 11, 0.3);
    }

    .sign-btn-top {
      width: 100%;
      padding: 12px 24px;
      font-size: 15px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .alert-content,
    .confirmation-content {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .alert-content lucide-icon {
      color: #f59e0b;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .alert-content h3,
    .confirmation-content h3 {
      margin: 0 0 8px;
      font-size: 1.1rem;
      font-weight: 600;
      color: #1e293b;
    }

    .alert-content p,
    .confirmation-content p {
      margin: 0;
      color: #64748b;
      line-height: 1.5;
    }

    .signed-confirmation {
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      border-left: 4px solid #10b981;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
    }

    .confirmation-content lucide-icon {
      color: #10b981;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .info-card {
      padding: 24px;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid #e2e8f0;
    }

    .card-header lucide-icon {
      color: var(--mat-sys-primary);
    }

    .card-header h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .card-content {
      color: #475569;
    }

    .property-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 8px;
    }

    .property-address {
      margin: 0;
      color: #64748b;
      line-height: 1.5;
    }

    .dates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .date-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 12px;
      background: #f8fafc;
      border-radius: 8px;
    }

    .date-item.signed {
      background: #d1fae5;
    }

    .date-item .label {
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }

    .date-item .value {
      font-size: 15px;
      color: #1e293b;
      font-weight: 600;
    }

    .economic-terms {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .term-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: #f8fafc;
      border-radius: 8px;
    }

    .term-item .label {
      font-size: 14px;
      color: #64748b;
    }

    .term-item .value {
      font-size: 16px;
      color: #1e293b;
      font-weight: 600;
    }

    .term-item .value.amount {
      font-size: 18px;
      color: var(--mat-sys-primary);
    }

    .bank-info {
      margin-top: 16px;
      padding: 16px;
      background: #f8fafc;
      border-radius: 8px;
    }

    .bank-info h4 {
      margin: 0 0 12px;
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
    }

    .bank-info p {
      margin: 0 0 8px;
      font-size: 14px;
      color: #475569;
    }

    .bank-info p:last-child {
      margin-bottom: 0;
    }

    .services-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .service-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      background: #f8fafc;
      border-radius: 6px;
    }

    .service-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      background: #d1fae5;
      color: #047857;
      border-radius: 50%;
      font-weight: 700;
      font-size: 14px;
    }

    .service-name {
      font-size: 14px;
      color: #1e293b;
    }

    .terms-text {
      margin: 0;
      line-height: 1.7;
      color: #475569;
    }

    .info-card.prohibitions {
      border-left: 4px solid #f59e0b;
      background: #fffbeb;
    }

    .additional-term {
      margin-bottom: 16px;
    }

    .additional-term:last-child {
      margin-bottom: 0;
    }

    .additional-term h4 {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 8px;
    }

    .additional-term p {
      margin: 0;
      line-height: 1.6;
      color: #475569;
    }

    .actions-footer {
      display: flex;
      gap: 12px;
      margin-top: 24px;
      padding: 20px;
      background: var(--mat-sys-surface);
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .action-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px 24px;
      font-size: 15px;
      font-weight: 600;
    }

    .sign-btn {
      min-width: 200px;
    }

    @media (max-width: 768px) {
      .contract-detail-container {
        padding: 16px 0;
      }

      .detail-header {
        flex-direction: column;
        align-items: stretch;
      }

      .header-info {
        flex-direction: column;
        align-items: flex-start;
      }

      .dates-grid {
        grid-template-columns: 1fr;
      }

      .actions-footer {
        flex-direction: column;
      }

      .action-btn {
        width: 100%;
      }
    }

    @media (max-width: 480px) {
      .info-card {
        padding: 20px;
      }

      .property-title {
        font-size: 1.25rem;
      }

      .card-header h3 {
        font-size: 1.1rem;
      }
    }

    .my-4 {
      margin: 16px 0;
    }
  `]
})
export class TenantContractDetailComponent implements OnInit {
  readonly ArrowLeft = ArrowLeft;
  readonly Download = Download;
  readonly Edit = Edit;
  readonly CheckCircle2 = CheckCircle2;
  readonly AlertTriangle = AlertTriangle;
  readonly Home = Home;
  readonly Calendar = Calendar;
  readonly DollarSign = DollarSign;
  readonly FileCheck = FileCheck;
  readonly Info = Info;
  readonly FileText = FileText;
  readonly X = X;
  readonly ContractStatus = ContractStatus;
  readonly ContractStatusLabels = ContractStatusLabels;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private contractService = inject(TenantContractService);
  private slugService = inject(SlugService);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);

  contract = signal<Contract | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  isSigning = signal(false);

  ngOnInit(): void {
    const contractId = this.route.snapshot.paramMap.get('id');
    if (contractId) {
      this.loadContract(parseInt(contractId));
    } else {
      this.error.set('ID de contrato no proporcionado');
      this.isLoading.set(false);
    }
  }

  loadContract(id: number): void {
    this.contractService.getContract(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (contract) => {
          this.contract.set(contract);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading contract:', err);
          this.error.set('No se pudo cargar el contrato. Es posible que no tengas permiso para verlo.');
          this.isLoading.set(false);
        }
      });
  }

  goBack(): void {
    const url = this.slugService.buildUrl('/portal/documentos');
    this.router.navigateByUrl(url);
  }

  signContract(): void {
    const contract = this.contract();
    if (!contract || this.isSigning()) return;

    // Abrir el diálogo de confirmación de firma
    const dialogRef = this.dialog.open(ContractSigningDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      data: { contract },
      disableClose: true,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed && contract) {
        this.performSigning(contract.id);
      }
    });
  }

  private performSigning(contractId: number): void {
    this.isSigning.set(true);

    this.contractService.signContract(contractId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isSigning.set(false);
          this.contract.set(response);

          // Mostrar diálogo de éxito
          this.dialog.open(SigningSuccessDialogComponent, {
            width: '450px',
            maxWidth: '90vw',
            data: { contract: response }
          });
        },
        error: (err) => {
          this.isSigning.set(false);
          console.error('Error signing contract:', err);
          alert(err.error?.message || 'Error al firmar el contrato. Por favor, intenta nuevamente.');
        }
      });
  }

  downloadPDF(): void {
    const contract = this.contract();
    if (!contract) return;

    this.contractService.downloadContractPDF(contract.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          // Crear URL del blob y abrir en nueva pestaña para visualización
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
          // Nota: No revocamos la URL de inmediato porque el navegador necesita tiempo para cargar el PDF
          // Se limpiará automáticamente cuando se cierre la pestaña
        },
        error: (err) => {
          console.error('Error viewing PDF:', err);
          alert('Error al visualizar el PDF. Por favor, intenta nuevamente.');
        }
      });
  }

  viewPDF(): void {
    const contract = this.contract();
    if (!contract) return;

    this.contractService.downloadContractPDF(contract.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          // Crear URL del blob y abrir en nueva pestaña para visualización
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
          // Nota: No revocamos la URL de inmediato porque el navegador necesita tiempo para cargar el PDF
          // Se limpiará automáticamente cuando se cierre la pestaña
        },
        error: (err) => {
          console.error('Error viewing PDF:', err);
          alert('Error al visualizar el PDF. Por favor, intenta nuevamente.');
        }
      });
  }

  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatRent(rent: number): string {
    return rent.toLocaleString('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}
