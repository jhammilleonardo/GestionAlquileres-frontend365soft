import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, FileText, Search, RefreshCw, X } from 'lucide-angular';
import { AdminContractService } from '../../core/services/admin-contract.service';
import { SlugService } from '../../core/services/slug.service';
import { Contract, ContractStatus, ContractStatusLabels, ContractFilters } from '../../core/models/contract.model';

@Component({
  selector: 'app-contratos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    LucideAngularModule
  ],
  template: `
    <div class="contracts-container">
      <!-- Header -->
      <div class="page-header">
        <h1>Contratos</h1>
        <button mat-raised-button color="primary" class="create-button" (click)="createContract()">
          <lucide-icon [img]="Plus" [size]="18"></lucide-icon>
          Nuevo Contrato
        </button>
      </div>

      @if (isLoading() && contracts().length === 0) {
        <div class="loading-container">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Cargando contratos...</p>
        </div>
      } @else {
        <!-- Dashboard de Métricas -->
        @if (dashboard()) {
          <div class="dashboard-grid">
            <mat-card class="metric-card total">
              <div class="metric-icon">
                <mat-icon>description</mat-icon>
              </div>
              <div class="metric-content">
                <div class="metric-value">{{ dashboard()!.total_contracts }}</div>
                <div class="metric-label">Total Contratos</div>
              </div>
            </mat-card>

            <mat-card class="metric-card active">
              <div class="metric-icon">
                <mat-icon>check_circle</mat-icon>
              </div>
              <div class="metric-content">
                <div class="metric-value">{{ dashboard()!.active_contracts }}</div>
                <div class="metric-label">Activos</div>
              </div>
            </mat-card>

            <mat-card class="metric-card draft">
              <div class="metric-icon">
                <mat-icon>edit</mat-icon>
              </div>
              <div class="metric-content">
                <div class="metric-value">{{ dashboard()!.draft_contracts }}</div>
                <div class="metric-label">Borradores</div>
              </div>
            </mat-card>

            <mat-card class="metric-card revenue">
              <div class="metric-icon">
                <mat-icon>payments</mat-icon>
              </div>
              <div class="metric-content">
                <div class="metric-value">\${{ formatRevenue(dashboard()!.monthly_revenue) }}</div>
                <div class="metric-label">Ingresos Mensuales</div>
              </div>
            </mat-card>

            <mat-card class="metric-card avg">
              <div class="metric-icon">
                <mat-icon>trending_up</mat-icon>
              </div>
              <div class="metric-content">
                <div class="metric-value">\${{ dashboard()!.avg_rent }}</div>
                <div class="metric-label">Alquiler Promedio</div>
              </div>
            </mat-card>

            @if (dashboard()!.contracts_expiring_soon > 0) {
              <mat-card class="metric-card warning">
                <div class="metric-icon">
                  <mat-icon>warning</mat-icon>
                </div>
                <div class="metric-content">
                  <div class="metric-value">{{ dashboard()!.contracts_expiring_soon }}</div>
                  <div class="metric-label">Por Vencer (30 días)</div>
                </div>
              </mat-card>
            }
          </div>
        }

        <!-- Filtros -->
        <mat-card class="filters-card">
          <div class="filters-header">
            <h3>Filtros</h3>
            @if (hasActiveFilters()) {
              <button mat-button class="clear-filters" (click)="clearFilters()">
                <lucide-icon [img]="X" [size]="16"></lucide-icon>
                Limpiar
              </button>
            }
          </div>

          <div class="filters-grid">
            <mat-form-field appearance="outline">
              <mat-label>Estado</mat-label>
              <mat-select (selectionChange)="onFilterChange()" [(ngModel)]="filters.status">
                <mat-option value="">Todos los estados</mat-option>
                <mat-option [value]="ContractStatus.BORRADOR">Borrador</mat-option>
                <mat-option [value]="ContractStatus.ACTIVO">Activo</mat-option>
                <mat-option [value]="ContractStatus.FINALIZADO">Finalizado</mat-option>
              </mat-select>
            </mat-form-field>

            <div class="search-box">
              <mat-icon>search</mat-icon>
              <input
                type="text"
                placeholder="Buscar por inquilino o propiedad..."
                (input)="onSearchChange($event)"
                [value]="searchTerm">
            </div>
          </div>
        </mat-card>

        <!-- Lista de Contratos -->
        <mat-card class="contracts-card">
          <div class="contracts-header">
            <h3>
              Lista de Contratos
              <span class="count">({{ filteredContracts().length }})</span>
            </h3>
            <button mat-icon-button (click)="loadContracts()">
              <mat-icon>refresh</mat-icon>
            </button>
          </div>

          @if (isLoading() && contracts().length === 0) {
            <div class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
            </div>
          } @else if (filteredContracts().length === 0) {
            <div class="empty-state">
              <mat-icon>description</mat-icon>
              <p>No se encontraron contratos</p>
              <button mat-raised-button color="primary" (click)="createContract()">
                <lucide-icon [img]="Plus" [size]="18"></lucide-icon>
                Crear Primer Contrato
              </button>
            </div>
          } @else {
            <div class="contracts-table">
              <!-- Header -->
              <div class="table-header">
                <div class="cell contract-number">N° Contrato</div>
                <div class="cell tenant">Inquilino</div>
                <div class="cell property">Propiedad</div>
                <div class="cell dates">Fechas</div>
                <div class="cell rent">Alquiler</div>
                <div class="cell status">Estado</div>
                <div class="cell actions">Acciones</div>
              </div>

              <!-- Body -->
              @for (contract of filteredContracts(); track contract.id) {
                <div class="table-row">
                  <div class="cell contract-number">
                    <span class="contract-badge">{{ contract.contract_number }}</span>
                  </div>
                  <div class="cell tenant">
                    <div class="tenant-info">
                      <span class="name">{{ contract.tenant?.name || contract.tenant_name || 'N/A' }}</span>
                      <span class="email">{{ contract.tenant?.email || contract.tenant_email || '' }}</span>
                    </div>
                  </div>
                  <div class="cell property">
                    <span class="property-title">{{ contract.property?.title || contract.property_title || 'N/A' }}</span>
                  </div>
                  <div class="cell dates">
                    <div class="date-range">
                      <span>{{ formatDate(contract.start_date) }}</span>
                      <mat-icon class="arrow-icon">arrow_forward</mat-icon>
                      <span>{{ formatDate(contract.end_date) }}</span>
                    </div>
                  </div>
                  <div class="cell rent">
                    <span class="rent-amount">Bs {{ formatRent(contract.monthly_rent) }}</span>
                  </div>
                  <div class="cell status">
                    <span class="status-badge" [class]="getStatusClass(contract.status)">
                      {{ ContractStatusLabels[contract.status] }}
                    </span>
                  </div>
                  <div class="cell actions">
                    <button mat-icon-button [routerLink]="buildContractDetailUrl(contract.id)" matTooltip="Ver detalle">
                      <mat-icon>visibility</mat-icon>
                    </button>
                    @if (contract.status === ContractStatus.BORRADOR) {
                      <button mat-icon-button [routerLink]="buildContractEditUrl(contract.id)" matTooltip="Editar">
                        <mat-icon>edit</mat-icon>
                      </button>
                    }
                    <button mat-icon-button (click)="downloadPDF(contract.id)" matTooltip="Ver PDF">
                      <mat-icon>download</mat-icon>
                    </button>
                    @if (contract.status === ContractStatus.ACTIVO) {
                      <button mat-icon-button (click)="renewContract(contract.id)" matTooltip="Renovar">
                        <mat-icon>autorenew</mat-icon>
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .contracts-container {
      max-width: 1400px;
      width: 100%;
      margin: 0 auto;
      padding: 24px;
      box-sizing: border-box;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      gap: 16px;
      flex-wrap: wrap;
    }

    .page-header h1 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 600;
    }

    .create-button {
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px;
      gap: 16px;
    }

    /* Dashboard Metrics */
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .metric-card {
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      min-width: 0;
      overflow: hidden;
    }

    .metric-card.total { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    .metric-card.active { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; }
    .metric-card.draft { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; }
    .metric-card.revenue { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; }
    .metric-card.avg { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; }
    .metric-card.warning { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; }

    .metric-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(255,255,255,0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .metric-icon mat-icon {
      color: white;
      font-size: 28px;
    }

    .metric-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .metric-value {
      font-size: 28px;
      font-weight: 700;
      line-height: 1;
      word-break: break-all;
    }

    .metric-label {
      font-size: 13px;
      opacity: 0.95;
      font-weight: 500;
      white-space: nowrap;
    }

    /* Filters Card */
    .filters-card {
      padding: 20px;
      margin-bottom: 24px;
    }

    .filters-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      gap: 8px;
    }

    .filters-header h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .clear-filters {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
    }

    .filters-grid {
      display: grid;
      grid-template-columns: minmax(180px, 1fr) 1fr;
      gap: 16px;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 16px;
      background: var(--mat-sys-surface-container-low);
      border-radius: 8px;
      min-width: 0;
    }

    .search-box mat-icon {
      color: var(--mat-sys-on-surface-variant);
      flex-shrink: 0;
    }

    .search-box input {
      border: none;
      background: transparent;
      flex: 1;
      min-width: 0;
      padding: 12px 0;
      font-size: 14px;
      outline: none;
    }

    /* Contracts Card */
    .contracts-card {
      padding: 20px;
      overflow: hidden;
    }

    .contracts-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      gap: 8px;
    }

    .contracts-header h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .contracts-header .count {
      color: var(--mat-sys-on-surface-variant);
      font-weight: 400;
      font-size: 1rem;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      gap: 16px;
    }

    .empty-state mat-icon {
      font-size: 64px;
      color: var(--mat-sys-outline);
      opacity: 0.5;
    }

    .empty-state p {
      margin: 0;
      color: var(--mat-sys-on-surface-variant);
      font-size: 1.1rem;
    }

    /* Contracts Table */
    .contracts-table {
      display: flex;
      flex-direction: column;
      overflow-x: auto;
      overflow-y: visible;
    }

    .table-header,
    .table-row {
      display: grid;
      grid-template-columns: 90px minmax(160px, 1fr) minmax(130px, 1.2fr) 120px 100px minmax(90px, 1fr) 120px;
      gap: 12px;
      padding: 12px;
      align-items: center;
      min-width: max-content;
    }

    .table-header {
      background: var(--mat-sys-surface-container-low);
      border-radius: 8px 8px 0 0;
      font-weight: 600;
      font-size: 13px;
      color: var(--mat-sys-on-surface-variant);
    }

    .table-row {
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      transition: background 0.2s;
    }

    .table-row:hover {
      background: var(--mat-sys-surface-container-low);
    }

    .table-row:last-child {
      border-bottom: none;
    }

    .cell {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }

    .contract-badge {
      font-family: monospace;
      font-size: 12px;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 600;
    }

    .tenant-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .tenant-info .name {
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .tenant-info .email {
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant);
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .property-title {
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .date-range {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
    }

    .arrow-icon {
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
      flex-shrink: 0;
    }

    .rent-amount {
      font-weight: 600;
      display: block;
    }

    .currency {
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant);
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      display: inline-block;
      white-space: nowrap;
    }

    .status-badge.status-borrador {
      background: #fff3cd;
      color: #856404;
    }

    .status-badge.status-activo {
      background: #d1fae5;
      color: #065f46;
    }

    .status-badge.status-finalizado {
      background: #e5e7eb;
      color: #374151;
    }

    .cell.actions {
      display: flex;
      gap: 4px;
      justify-content: flex-end;
    }

    /* Tablet */
    @media (max-width: 1200px) {
      .table-header,
      .table-row {
        grid-template-columns: 80px minmax(140px, 1fr) minmax(120px, 1.2fr) 110px 90px minmax(80px, 1fr) 110px;
        gap: 10px;
        padding: 10px;
      }
    }

    @media (max-width: 1024px) {
      .contracts-container {
        padding: 16px;
      }

      .dashboard-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .filters-grid {
        grid-template-columns: 1fr;
      }

      .table-header,
      .table-row {
        grid-template-columns: 80px 1fr 100px 80px;
        gap: 8px;
        padding: 12px;
      }

      .table-header {
        display: none;
      }

      .table-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding: 12px 8px;
      }

      .cell {
        flex: 0 0 45%;
        min-width: 0;
        padding: 4px 0;
      }

      .cell.actions {
        justify-content: center;
      }
    }

    @media (max-width: 768px) {
      .contracts-container {
        padding: 12px;
      }

      .page-header {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }

      .page-header h1 {
        font-size: 1.5rem;
      }

      .create-button {
        width: 100%;
        justify-content: center;
      }

      .dashboard-grid {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .metric-card {
        padding: 16px;
      }

      .metric-value {
        font-size: 24px;
      }

      .metric-label {
        font-size: 12px;
      }

      .filters-grid {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .contracts-header h3 {
        font-size: 1rem;
      }

      .table-header,
      .table-row {
        padding: 10px 8px;
      }

      .cell.actions {
        justify-content: center;
      }
    }
  `]
})
export class ContratosComponent implements OnInit {
  readonly Plus = Plus;
  readonly FileText = FileText;
  readonly Search = Search;
  readonly RefreshCw = RefreshCw;
  readonly X = X;
  readonly ContractStatus = ContractStatus;
  readonly ContractStatusLabels = ContractStatusLabels;

  private router = inject(Router);
  private contractService: AdminContractService = inject(AdminContractService);
  private slugService: SlugService = inject(SlugService);

  // Signals
  isLoading = this.contractService.isLoading;
  contracts = this.contractService.contracts;
  dashboard = this.contractService.dashboard;

  // Filtros
  filters: ContractFilters = {};
  searchTerm = '';

  ngOnInit(): void {
    this.loadContracts();
    this.loadDashboard();
  }

  loadContracts(): void {
    this.contractService.loadContracts(this.filters);
  }

  loadDashboard(): void {
    this.contractService.loadDashboard();
  }

  onFilterChange(): void {
    this.loadContracts();
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
  }

  hasActiveFilters(): boolean {
    return Boolean(this.filters.status || this.searchTerm);
  }

  clearFilters(): void {
    this.filters = {};
    this.searchTerm = '';
    this.loadContracts();
  }

  filteredContracts(): Contract[] {
    let filtered = this.contracts();

    // Filtrar por término de búsqueda
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter((c: Contract) =>
        c.tenant?.name?.toLowerCase().includes(term) ||
        c.tenant?.email?.toLowerCase().includes(term) ||
        c.property?.title?.toLowerCase().includes(term) ||
        c.contract_number?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }

  createContract(): void {
    const createUrl = this.slugService.buildUrl('/contratos/nuevo');
    this.router.navigateByUrl(createUrl);
  }

  buildContractDetailUrl(id: number): string {
    return this.slugService.buildUrl(`/contratos/${id}`);
  }

  buildContractEditUrl(id: number): string {
    return this.slugService.buildUrl(`/contratos/${id}/editar`);
  }

  downloadPDF(id: number): void {
    this.contractService.downloadPDF(id);
  }

  renewContract(id: number): void {
    if (!confirm('¿Deseas renovar este contrato? Se creará un nuevo contrato basado en el actual.')) {
      return;
    }

    this.contractService.renewContract(id).subscribe({
      next: (response: any) => {
        alert('Contrato renovado exitosamente');
        const newContractUrl = this.slugService.buildUrl(`/contratos/${response.id}`);
        this.router.navigateByUrl(newContractUrl);
      },
      error: () => {
        alert('Error al renovar el contrato');
      }
    });
  }

  formatRevenue(amount: number): string {
    return amount.toLocaleString();
  }

  formatRent(rent: number | string): string {
    const rentNumber = typeof rent === 'string' ? parseFloat(rent) : rent;
    return rentNumber.toLocaleString('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) return 'N/A';

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getStatusClass(status: ContractStatus): string {
    return `status-${status.toLowerCase()}`;
  }
}

