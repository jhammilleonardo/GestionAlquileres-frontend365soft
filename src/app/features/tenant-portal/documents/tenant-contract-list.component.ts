import { Component, inject, OnInit, computed } from '@angular/core';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  LucideAngularModule,
  FileText,
  Eye,
  Edit,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-angular';
import {
  TenantContractService,
  ContractStatus,
  ContractStatusLabels,
} from '../../../core/services/tenant/tenant-contract.service';
import { SlugService } from '../../../core/services/slug.service';
import { FormatService } from '../../../core/services/format.service';
import { TenantDatePipe } from '../../../shared/pipes/tenant-date.pipe';
import { TenantCurrencyPipe } from '../../../shared/pipes/tenant-currency.pipe';

@Component({
  selector: 'app-tenant-contract-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    LucideAngularModule,
    TranslocoModule,
    TenantDatePipe,
    TenantCurrencyPipe,
  ],
  template: `
    <div class="contracts-list-container">
      <!-- Header con filtros -->
      <div class="list-header">
        <div class="header-title">
          <lucide-icon [img]="FileText" [size]="24"></lucide-icon>
          <h2>{{ 'tenantContracts.title' | transloco }}</h2>
        </div>
        <div class="filter-section">
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>{{ 'tenantContracts.filterLabel' | transloco }}</mat-label>
            <mat-select (selectionChange)="onFilterChange($event)" [(value)]="selectedStatus">
              <mat-option [value]="null">{{ 'tenantContracts.allStates' | transloco }}</mat-option>
              <mat-option [value]="ContractStatus.BORRADOR">{{
                'tenantContracts.status.BORRADOR' | transloco
              }}</mat-option>
              <mat-option [value]="ContractStatus.ACTIVO">{{
                'tenantContracts.status.ACTIVO' | transloco
              }}</mat-option>
              <mat-option [value]="ContractStatus.FINALIZADO">{{
                'tenantContracts.status.FINALIZADO' | transloco
              }}</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </div>

      <!-- Loading -->
      @if (contractService.isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="50"></mat-spinner>
          <p>{{ 'tenantContracts.loading' | transloco }}</p>
        </div>
      }

      <!-- Empty State -->
      @else if (filteredContracts().length === 0) {
        <div class="empty-state">
          <lucide-icon [img]="FileText" [size]="64"></lucide-icon>
          <h2>{{ 'tenantContracts.noContractsTitle' | transloco }}</h2>
          <p>
            @if (selectedStatus) {
              {{ 'tenantContracts.noContractsWithStatus' | transloco }}
            } @else {
              {{ 'tenantContracts.noContractsDesc' | transloco }}
            }
          </p>
          @if (!selectedStatus) {
            <button mat-stroked-button (click)="loadContracts()">
              <lucide-icon [img]="Clock" [size]="16"></lucide-icon>
              {{ 'tenantContracts.reload' | transloco }}
            </button>
          }
        </div>
      }

      <!-- Contracts List -->
      @else {
        <div class="contracts-grid">
          @for (contract of filteredContracts(); track contract.id) {
            <mat-card
              class="contract-card"
              [class.pending-signature]="contract.status === ContractStatus.BORRADOR"
            >
              <div class="contract-header">
                <div class="contract-number">
                  <span class="number">{{ contract.contract_number }}</span>
                </div>
                <div class="contract-status">
                  <span class="status-badge" [class]="'status-' + contract.status.toLowerCase()">
                    {{ 'tenantContracts.status.' + contract.status | transloco }}
                  </span>
                </div>
              </div>

              <div class="contract-body">
                <h3 class="property-title">
                  {{
                    contract.property?.title || ('tenantContracts.propertyNotSpecified' | transloco)
                  }}
                </h3>

                <div class="contract-dates">
                  <div class="date-item">
                    <lucide-icon [img]="Clock" [size]="14"></lucide-icon>
                    <span
                      >{{ 'tenantContracts.startDate' | transloco }}:
                      {{ contract.start_date | tenantDate }}</span
                    >
                  </div>
                  <div class="date-item">
                    <lucide-icon [img]="Clock" [size]="14"></lucide-icon>
                    <span
                      >{{ 'tenantContracts.endDate' | transloco }}:
                      {{ contract.end_date | tenantDate }}</span
                    >
                  </div>
                </div>

                <div class="contract-rent">
                  <span class="rent-label">{{ 'tenantContracts.monthlyRent' | transloco }}:</span>
                  <span class="rent-amount">
                    {{ contract.monthly_rent | tenantCurrency }}
                    @if (contract.currency) {
                      {{ contract.currency }}
                    }
                  </span>
                </div>

                <!-- Firma Pendiente Alert -->
                @if (contract.status === ContractStatus.BORRADOR) {
                  <div class="pending-alert">
                    <lucide-icon [img]="AlertTriangle" [size]="16"></lucide-icon>
                    <span>{{ 'tenantContracts.pendingSignatureAlert' | transloco }}</span>
                  </div>
                }

                <!-- Firmado Info -->
                @if (contract.status === ContractStatus.ACTIVO && contract.signed_at) {
                  <div class="signed-info">
                    <lucide-icon [img]="CheckCircle2" [size]="16"></lucide-icon>
                    <span>{{
                      'tenantContracts.signedOn'
                        | transloco: { date: formatDate(contract.signed_at) }
                    }}</span>
                  </div>
                }
              </div>

              <div class="contract-actions">
                <button
                  mat-stroked-button
                  (click)="viewContract(contract.id)"
                  class="action-btn view-btn"
                >
                  <lucide-icon [img]="Eye" [size]="16"></lucide-icon>
                  {{ 'tenantContracts.viewDetail' | transloco }}
                </button>

                @if (contract.status === ContractStatus.BORRADOR) {
                  <button
                    mat-raised-button
                    color="primary"
                    (click)="signContract(contract.id)"
                    class="action-btn sign-btn"
                  >
                    <lucide-icon [img]="Edit" [size]="16"></lucide-icon>
                    {{ 'tenantContracts.signNow' | transloco }}
                  </button>
                }
              </div>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .contracts-list-container {
        padding: 24px 0;
      }

      .list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        flex-wrap: wrap;
        gap: 16px;
      }

      .header-title {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .header-title h2 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0;
      }

      .filter-section {
        display: flex;
        gap: 12px;
      }

      .filter-field {
        width: 250px;
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        gap: 16px;
        color: #64748b;
      }

      .empty-state {
        text-align: center;
        padding: 60px 20px;
        color: #64748b;
      }

      .empty-state lucide-icon {
        opacity: 0.5;
        margin-bottom: 16px;
      }

      .empty-state h2 {
        color: #1e293b;
        margin: 0 0 8px;
        font-size: 1.25rem;
      }

      .empty-state p {
        margin: 0 0 20px;
      }

      .contracts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
        gap: 20px;
      }

      .contract-card {
        display: flex;
        flex-direction: column;
        transition: all 0.3s ease;
        border: 2px solid transparent;
      }

      .contract-card:hover {
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }

      .contract-card.pending-signature {
        border-color: #f59e0b;
        background: linear-gradient(to bottom, #fffbeb, white);
      }

      .contract-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .contract-number .number {
        font-family: monospace;
        font-size: 13px;
        font-weight: 600;
        color: var(--mat-sys-primary);
        background: var(--mat-sys-primary-container);
        padding: 4px 10px;
        border-radius: 6px;
      }

      .status-badge {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
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

      .contract-body {
        flex: 1;
        margin-bottom: 16px;
      }

      .property-title {
        font-size: 1.1rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 12px;
        line-height: 1.4;
      }

      .contract-dates {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 12px;
      }

      .date-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: #64748b;
      }

      .contract-rent {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 12px;
        background: #f8fafc;
        border-radius: 8px;
        margin-bottom: 12px;
      }

      .rent-label {
        font-size: 13px;
        color: #64748b;
      }

      .rent-amount {
        font-size: 16px;
        font-weight: 700;
        color: var(--mat-sys-primary);
      }

      .pending-alert {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        background: #fef3c7;
        color: #b45309;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        margin-bottom: 12px;
      }

      .signed-info {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        background: #d1fae5;
        color: #047857;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        margin-bottom: 12px;
      }

      .contract-actions {
        display: flex;
        gap: 8px;
        padding-top: 16px;
        border-top: 1px solid #e2e8f0;
      }

      .action-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        font-size: 13px;
      }

      @media (max-width: 768px) {
        .contracts-grid {
          grid-template-columns: 1fr;
        }

        .list-header {
          flex-direction: column;
          align-items: stretch;
        }

        .filter-section {
          width: 100%;
        }

        .filter-field {
          width: 100%;
        }

        .contract-actions {
          flex-direction: column;
        }

        .action-btn {
          width: 100%;
        }
      }

      @media (max-width: 480px) {
        .contracts-list-container {
          padding: 16px 0;
        }

        .header-title h2 {
          font-size: 1.1rem;
        }

        .property-title {
          font-size: 1rem;
        }
      }
    `,
  ],
})
export class TenantContractListComponent implements OnInit {
  readonly FileText = FileText;
  readonly Eye = Eye;
  readonly Edit = Edit;
  readonly CheckCircle2 = CheckCircle2;
  readonly AlertTriangle = AlertTriangle;
  readonly Clock = Clock;
  readonly ContractStatus = ContractStatus;
  readonly ContractStatusLabels = ContractStatusLabels;

  private router = inject(Router);
  contractService = inject(TenantContractService);
  private slugService = inject(SlugService);
  private translocoService = inject(TranslocoService);
  private formatService = inject(FormatService);

  selectedStatus: ContractStatus | null = null;

  contracts = this.contractService.contracts;
  isLoading = this.contractService.isLoading;

  filteredContracts = computed(() => {
    let contracts = this.contracts();

    if (this.selectedStatus) {
      contracts = contracts.filter((c) => c.status === this.selectedStatus);
    }

    // Ordenar: primero los borradores (pendientes de firma), luego por fecha
    return contracts.sort((a, b) => {
      if (a.status === ContractStatus.BORRADOR && b.status !== ContractStatus.BORRADOR) {
        return -1;
      }
      if (a.status !== ContractStatus.BORRADOR && b.status === ContractStatus.BORRADOR) {
        return 1;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  });

  ngOnInit(): void {
    this.loadContracts();
  }

  loadContracts(): void {
    if (this.selectedStatus) {
      this.contractService.loadContracts(this.selectedStatus);
    } else {
      this.contractService.loadContracts();
    }
  }

  onFilterChange(event: any): void {
    this.selectedStatus = event.value;
    this.loadContracts();
  }

  viewContract(contractId: number): void {
    const url = this.slugService.buildUrl(`/portal/documentos/contratos/${contractId}`);
    this.router.navigateByUrl(url);
  }

  signContract(contractId: number): void {
    const url = this.slugService.buildUrl(`/portal/documentos/contratos/${contractId}`);
    this.router.navigateByUrl(url);
    // El componente de detalle manejará la firma
  }

  getStatusLabel(status: ContractStatus): string {
    return this.translocoService.translate('tenantContracts.status.' + status);
  }

  formatDate(date: Date | string): string {
    return this.formatService.formatDate(date);
  }
}
