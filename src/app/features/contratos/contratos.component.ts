import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import {
  LucideAngularModule,
  Plus,
  FileText,
  Search,
  RefreshCw,
  X,
  CheckCircle2,
  Pencil,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Eye,
  Download,
  RotateCcw,
  Home,
  Calendar,
  ArrowRight,
  User,
} from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { AdminContractService } from '../../core/services/admin/admin-contract.service';
import { SlugService } from '../../core/services/slug.service';
import { TenantDatePipe } from '../../shared/pipes/tenant-date.pipe';
import { TenantCurrencyPipe } from '../../shared/pipes/tenant-currency.pipe';
import { Contract, ContractStatus, ContractFilters } from '../../core/models/contract.model';

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
    MatTooltipModule,
    MatDividerModule,
    MatChipsModule,
    LucideAngularModule,
    TranslocoModule,
    TenantDatePipe,
    TenantCurrencyPipe,
  ],
  providers: [provideTranslocoScope({ scope: 'contratos', alias: 'contracts' })],
  template: `
    <div class="contracts-container">
      <!-- ── Page Header ── -->
      <div class="page-header">
        <div class="page-title-wrap">
          <div class="page-title-icon">
            <lucide-icon [img]="FileText" [size]="20"></lucide-icon>
          </div>
          <div>
            <h1>{{ 'contracts.title' | transloco }}</h1>
            <p class="page-subtitle">{{ 'contracts.subtitle' | transloco }}</p>
          </div>
        </div>
        <button mat-raised-button color="primary" class="create-button" (click)="createContract()">
          <lucide-icon [img]="Plus" [size]="17"></lucide-icon>
          {{ 'contracts.new' | transloco }}
        </button>
      </div>

      @if (isLoading() && contracts().length === 0) {
        <div class="loading-container">
          <mat-spinner diameter="44"></mat-spinner>
          <p>{{ 'contracts.loading' | transloco }}</p>
        </div>
      } @else {
        <!-- ── Métricas ── -->
        @if (dashboard()) {
          <div class="dashboard-grid">
            <mat-card class="metric-card total" appearance="outlined">
              <mat-card-content class="metric-content">
                <div class="metric-icon-wrap">
                  <lucide-icon [img]="FileText" [size]="20"></lucide-icon>
                </div>
                <div class="metric-body">
                  <span class="metric-value">{{ dashboard()!.total_contracts }}</span>
                  <span class="metric-label">{{ 'contracts.totalContracts' | transloco }}</span>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="metric-card active" appearance="outlined">
              <mat-card-content class="metric-content">
                <div class="metric-icon-wrap">
                  <lucide-icon [img]="CheckCircle2" [size]="20"></lucide-icon>
                </div>
                <div class="metric-body">
                  <span class="metric-value">{{ dashboard()!.active_contracts }}</span>
                  <span class="metric-label">{{ 'contracts.activeContracts' | transloco }}</span>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="metric-card draft" appearance="outlined">
              <mat-card-content class="metric-content">
                <div class="metric-icon-wrap">
                  <lucide-icon [img]="Pencil" [size]="20"></lucide-icon>
                </div>
                <div class="metric-body">
                  <span class="metric-value">{{ dashboard()!.draft_contracts }}</span>
                  <span class="metric-label">{{ 'contracts.draftContracts' | transloco }}</span>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="metric-card revenue" appearance="outlined">
              <mat-card-content class="metric-content">
                <div class="metric-icon-wrap">
                  <lucide-icon [img]="DollarSign" [size]="20"></lucide-icon>
                </div>
                <div class="metric-body">
                  <span class="metric-value">{{
                    dashboard()!.monthly_revenue | tenantCurrency
                  }}</span>
                  <span class="metric-label">{{ 'contracts.monthlyRevenue' | transloco }}</span>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="metric-card avg" appearance="outlined">
              <mat-card-content class="metric-content">
                <div class="metric-icon-wrap">
                  <lucide-icon [img]="TrendingUp" [size]="20"></lucide-icon>
                </div>
                <div class="metric-body">
                  <span class="metric-value">{{ dashboard()!.avg_rent | tenantCurrency }}</span>
                  <span class="metric-label">{{ 'contracts.avgRent' | transloco }}</span>
                </div>
              </mat-card-content>
            </mat-card>

            @if (dashboard()!.contracts_expiring_soon > 0) {
              <mat-card class="metric-card warning" appearance="outlined">
                <mat-card-content class="metric-content">
                  <div class="metric-icon-wrap">
                    <lucide-icon [img]="AlertTriangle" [size]="20"></lucide-icon>
                  </div>
                  <div class="metric-body">
                    <span class="metric-value">{{ dashboard()!.contracts_expiring_soon }}</span>
                    <span class="metric-label">{{ 'contracts.expiringSoon' | transloco }}</span>
                  </div>
                </mat-card-content>
              </mat-card>
            }
          </div>
        }

        <!-- ── Filtros ── -->
        <mat-card appearance="outlined" class="filters-card">
          <mat-card-content class="filters-content">
            <mat-form-field appearance="outline" class="search-field" subscriptSizing="dynamic">
              <mat-label>{{ 'contracts.search' | transloco }}</mat-label>
              <lucide-icon
                matIconPrefix
                [img]="Search"
                [size]="16"
                class="field-prefix-icon"
              ></lucide-icon>
              <input
                matInput
                type="text"
                [placeholder]="'contracts.searchPlaceholder' | transloco"
                (input)="onSearchChange($event)"
                [value]="searchTerm"
              />
              @if (searchTerm) {
                <button matIconSuffix mat-icon-button (click)="searchTerm = ''">
                  <lucide-icon [img]="X" [size]="14"></lucide-icon>
                </button>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="status-field" subscriptSizing="dynamic">
              <mat-label>{{ 'contracts.statusFilter' | transloco }}</mat-label>
              <mat-select (selectionChange)="onFilterChange()" [(ngModel)]="filters.status">
                <mat-option value="">{{ 'contracts.allStatuses' | transloco }}</mat-option>
                <mat-option [value]="ContractStatus.BORRADOR">{{
                  'contracts.status.BORRADOR' | transloco
                }}</mat-option>
                <mat-option [value]="ContractStatus.ACTIVO">{{
                  'contracts.status.ACTIVO' | transloco
                }}</mat-option>
                <mat-option [value]="ContractStatus.FINALIZADO">{{
                  'contracts.status.FINALIZADO' | transloco
                }}</mat-option>
              </mat-select>
            </mat-form-field>

            @if (hasActiveFilters()) {
              <button mat-stroked-button (click)="clearFilters()" class="clear-btn">
                <lucide-icon [img]="X" [size]="14"></lucide-icon>
                {{ 'contracts.clear' | transloco }}
              </button>
            }

            <span class="filters-spacer"></span>

            <button
              mat-icon-button
              (click)="loadContracts()"
              [matTooltip]="'contracts.refresh' | transloco"
            >
              <lucide-icon [img]="RefreshCw" [size]="16"></lucide-icon>
            </button>
          </mat-card-content>
        </mat-card>

        <!-- ── Tabla de Contratos ── -->
        <mat-card appearance="outlined" class="contracts-card">
          <mat-card-header class="contracts-card-header">
            <div class="ch-title">
              <lucide-icon [img]="FileText" [size]="16"></lucide-icon>
              <span>{{ 'contracts.listTitle' | transloco }}</span>
            </div>
            <mat-chip-set>
              <mat-chip
                >{{ filteredContracts().length }} contrato{{
                  filteredContracts().length !== 1 ? 's' : ''
                }}</mat-chip
              >
            </mat-chip-set>
          </mat-card-header>

          <mat-divider></mat-divider>

          <mat-card-content class="p0">
            @if (isLoading() && contracts().length === 0) {
              <div class="loading-container">
                <mat-spinner diameter="36"></mat-spinner>
              </div>
            } @else if (filteredContracts().length === 0) {
              <div class="empty-state">
                <div class="empty-icon">
                  <lucide-icon [img]="FileText" [size]="30"></lucide-icon>
                </div>
                <p class="empty-title">{{ 'contracts.emptyTitle' | transloco }}</p>
                <span class="empty-sub">{{ 'contracts.emptySub' | transloco }}</span>
                <button
                  mat-raised-button
                  color="primary"
                  (click)="createContract()"
                  class="create-button"
                >
                  <lucide-icon [img]="Plus" [size]="16"></lucide-icon>
                  {{ 'contracts.createFirst' | transloco }}
                </button>
              </div>
            } @else {
              <div class="table-scroll-wrap">
                <div class="contracts-table">
                  <!-- Header -->
                  <div class="table-header">
                    <div class="cell col-contract">{{ 'contracts.colNumber' | transloco }}</div>
                    <div class="cell col-tenant">{{ 'contracts.colTenant' | transloco }}</div>
                    <div class="cell col-property">{{ 'contracts.colProperty' | transloco }}</div>
                    <div class="cell col-dates">{{ 'contracts.colDates' | transloco }}</div>
                    <div class="cell col-rent">{{ 'contracts.colRent' | transloco }}</div>
                    <div class="cell col-status">{{ 'contracts.colStatus' | transloco }}</div>
                    <div class="cell col-actions">{{ 'contracts.colActions' | transloco }}</div>
                  </div>

                  <!-- Rows -->
                  @for (contract of filteredContracts(); track contract.id) {
                    <div class="table-row">
                      <div class="cell col-contract">
                        <span class="contract-num">{{ contract.contract_number }}</span>
                      </div>

                      <div class="cell col-tenant">
                        <div class="tenant-row">
                          <div class="tenant-avatar">
                            {{
                              (contract.tenant?.name || contract.tenant_name || 'I')
                                .charAt(0)
                                .toUpperCase()
                            }}
                          </div>
                          <div class="tenant-info">
                            <span class="tenant-name">{{
                              contract.tenant?.name || contract.tenant_name || 'N/A'
                            }}</span>
                            <span class="tenant-email">{{
                              contract.tenant?.email || contract.tenant_email || ''
                            }}</span>
                          </div>
                        </div>
                      </div>

                      <div class="cell col-property">
                        <div class="property-row">
                          <lucide-icon [img]="Home" [size]="13" class="prop-icon"></lucide-icon>
                          <span class="property-title">{{
                            contract.property?.title || contract.property_title || 'N/A'
                          }}</span>
                        </div>
                      </div>

                      <div class="cell col-dates">
                        <div class="date-stack">
                          <span class="date-from">{{ contract.start_date | tenantDate }}</span>
                          <span class="date-to">{{ contract.end_date | tenantDate }}</span>
                        </div>
                      </div>

                      <div class="cell col-rent">
                        <span class="rent-amount">{{
                          contract.monthly_rent | tenantCurrency
                        }}</span>
                      </div>

                      <div class="cell col-status">
                        <span class="status-pill" [class]="getStatusClass(contract.status)">
                          <span class="status-dot"></span>
                          {{ 'contracts.status.' + contract.status | transloco }}
                        </span>
                      </div>

                      <div class="cell col-actions">
                        <div class="action-group">
                          <button
                            mat-icon-button
                            class="action-btn view-btn"
                            [routerLink]="buildContractDetailUrl(contract.id)"
                            [matTooltip]="'contracts.tooltipView' | transloco"
                          >
                            <lucide-icon [img]="Eye" [size]="15"></lucide-icon>
                          </button>
                          @if (contract.status === ContractStatus.BORRADOR) {
                            <button
                              mat-icon-button
                              class="action-btn edit-btn"
                              [routerLink]="buildContractEditUrl(contract.id)"
                              [matTooltip]="'contracts.tooltipEdit' | transloco"
                            >
                              <lucide-icon [img]="Pencil" [size]="15"></lucide-icon>
                            </button>
                          }
                          <button
                            mat-icon-button
                            class="action-btn download-btn"
                            (click)="downloadPDF(contract.id)"
                            [matTooltip]="'contracts.tooltipDownload' | transloco"
                          >
                            <lucide-icon [img]="Download" [size]="15"></lucide-icon>
                          </button>
                          @if (contract.status === ContractStatus.ACTIVO) {
                            <button
                              mat-icon-button
                              class="action-btn renew-btn"
                              (click)="renewContract(contract.id)"
                              [matTooltip]="'contracts.tooltipRenew' | transloco"
                            >
                              <lucide-icon [img]="RotateCcw" [size]="15"></lucide-icon>
                            </button>
                          }
                        </div>
                      </div>
                    </div>
                  }
                </div>
                <!-- /contracts-table -->
              </div>
              <!-- /table-scroll-wrap -->
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [
    `
      /* ════════════════════════════
       CONTAINER
    ════════════════════════════ */
      .contracts-container {
        max-width: 1400px;
        width: 100%;
        margin: 0 auto;
        padding: 28px 24px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 22px;
      }

      /* ════════════════════════════
       HEADER
    ════════════════════════════ */
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }

      .page-header-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .page-title-wrap {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .page-title-icon {
        width: 46px;
        height: 46px;
        border-radius: 12px;
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      }

      .page-title-wrap h1 {
        margin: 0 0 2px;
        font-size: 1.6rem;
        font-weight: 800;
        color: #1e293b;
        line-height: 1.2;
      }

      .page-subtitle {
        margin: 0;
        font-size: 13px;
        color: #94a3b8;
        font-weight: 400;
      }

      .create-button {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        font-weight: 600;
        border-radius: 10px !important;
        padding: 0 20px !important;
        height: 40px;
      }

      /* ════════════════════════════
       LOADING
    ════════════════════════════ */
      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px;
        gap: 14px;
        color: #94a3b8;
        font-size: 14px;
      }

      /* ════════════════════════════
       DASHBOARD METRICS
    ════════════════════════════ */
      .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 16px;
      }

      .metric-card {
        border-radius: 14px;
        padding: 20px 22px;
        display: flex;
        align-items: center;
        gap: 16px;
        color: white;
        cursor: default;
        transition:
          transform 0.2s,
          box-shadow 0.2s;
        position: relative;
        overflow: hidden;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);

        &::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, transparent 55%);
          pointer-events: none;
        }

        &:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.14);
        }
      }

      .metric-card.total {
        background: linear-gradient(135deg, #28589e, #1e3f72);
      }
      .metric-card.active {
        background: linear-gradient(135deg, #10b981, #059669);
      }
      .metric-card.draft {
        background: linear-gradient(135deg, #64748b, #475569);
      }
      .metric-card.revenue {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
      }
      .metric-card.avg {
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      }
      .metric-card.warning {
        background: linear-gradient(135deg, #f59e0b, #d97706);
      }

      .metric-icon-wrap {
        width: 46px;
        height: 46px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        border: 1px solid rgba(255, 255, 255, 0.22);
        backdrop-filter: blur(4px);
      }

      .metric-body {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .metric-value {
        font-size: 1.75rem;
        font-weight: 800;
        color: white;
        line-height: 1.1;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .metric-label {
        font-size: 12.5px;
        color: rgba(255, 255, 255, 0.85);
        font-weight: 500;
        white-space: nowrap;
      }

      /* ════════════════════════════
       FILTERS CARD
    ════════════════════════════ */
      .filters-card {
        border-radius: 12px !important;

        ::ng-deep .mat-mdc-card-content {
          padding: 0 !important;
        }
      }

      .filters-content {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 18px !important;
        flex-wrap: wrap;
      }

      .search-field {
        flex: 1;
        min-width: 220px;
      }

      .field-prefix-icon {
        color: #94a3b8;
        margin-right: 4px;
      }

      .status-field {
        width: 180px;
        flex-shrink: 0;
      }

      .clear-btn {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 13px;
        font-weight: 500;
        border-radius: 8px !important;
        white-space: nowrap;
        height: 40px;
      }

      .filters-spacer {
        flex: 1;
      }

      /* ════════════════════════════
       CONTRACTS CARD
    ════════════════════════════ */
      .contracts-card {
        border-radius: 12px !important;
        /* sin overflow:hidden para no cortar el scroll horizontal */

        ::ng-deep .mat-mdc-card-content.p0 {
          padding: 0 !important;
        }
      }

      .contracts-card-header {
        display: flex !important;
        align-items: center;
        justify-content: space-between;
        padding: 14px 20px !important;
        background: #f8fafc;
        gap: 12px;

        ::ng-deep .mat-mdc-card-header-text {
          display: none;
        }
      }

      .ch-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.95rem;
        font-weight: 700;
        color: #1e293b;

        lucide-icon {
          color: #3b82f6;
        }
      }

      /* ── Empty State ── */
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 64px 20px;
        gap: 10px;
      }

      .empty-icon {
        width: 64px;
        height: 64px;
        background: #f1f5f9;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #cbd5e1;
        margin-bottom: 4px;
      }

      .empty-title {
        margin: 0;
        font-size: 1rem;
        font-weight: 700;
        color: #64748b;
      }

      .empty-sub {
        font-size: 13px;
        color: #94a3b8;
        margin-bottom: 8px;
      }

      /* ════════════════════════════
       TABLE
    ════════════════════════════ */

      /* Wrapper que habilita scroll horizontal sin cortar nada */
      .table-scroll-wrap {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }

      .contracts-table {
        display: flex;
        flex-direction: column;
        min-width: 780px; /* ancho mínimo antes de hacer scroll */
      }

      .table-header,
      .table-row {
        display: grid;
        /* N°Contrato | Inquilino | Propiedad | Fechas | Alquiler | Estado | Acciones */
        grid-template-columns: 140px minmax(0, 1.4fr) minmax(0, 1.1fr) 90px 120px 110px 120px;
        gap: 12px;
        padding: 0 20px;
        align-items: center;
      }

      .table-header {
        padding-top: 11px;
        padding-bottom: 11px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.7px;
        color: #94a3b8;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
      }

      .table-row {
        padding-top: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid #f1f5f9;
        transition: background 0.15s;

        &:hover {
          background: #f8fafc;
        }
        &:last-child {
          border-bottom: none;
        }
      }

      .cell {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0;
      }

      /* Contract number */
      .contract-num {
        font-family: monospace;
        font-size: 11.5px;
        font-weight: 700;
        background: #eff6ff;
        color: #1d4ed8;
        border: 1px solid #bfdbfe;
        padding: 4px 9px;
        border-radius: 6px;
        white-space: nowrap;
        display: inline-block;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* Tenant */
      .tenant-row {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }

      .tenant-avatar {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: #3b82f6;
        color: white;
        font-size: 13px;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 1px 4px rgba(59, 130, 246, 0.3);
      }

      .tenant-info {
        display: flex;
        flex-direction: column;
        gap: 1px;
        min-width: 0;
      }

      .tenant-name {
        font-size: 13.5px;
        font-weight: 600;
        color: #1e293b;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .tenant-email {
        font-size: 11.5px;
        color: #94a3b8;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* Property */
      .property-row {
        display: flex;
        align-items: center;
        gap: 7px;
        min-width: 0;
      }

      .prop-icon {
        color: #10b981;
        flex-shrink: 0;
      }

      .property-title {
        font-size: 13.5px;
        font-weight: 500;
        color: #334155;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* Dates — apiladas verticalmente para ahorrar espacio */
      .date-stack {
        display: flex;
        flex-direction: column;
        gap: 1px;
      }

      .date-from {
        font-size: 12px;
        font-weight: 600;
        color: #334155;
        white-space: nowrap;
      }

      .date-to {
        font-size: 11.5px;
        color: #94a3b8;
        white-space: nowrap;
      }

      /* Rent */
      .col-rent {
        display: flex;
        align-items: baseline;
        gap: 4px;
      }

      .rent-currency {
        font-size: 11px;
        font-weight: 600;
        color: #64748b;
      }

      .rent-amount {
        font-size: 14px;
        font-weight: 700;
        color: #1e293b;
      }

      /* Status pill */
      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 11px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        white-space: nowrap;
      }

      .status-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .status-pill.status-borrador {
        background: #fef3c7;
        color: #92400e;
        .status-dot {
          background: #f59e0b;
        }
      }

      .status-pill.status-activo {
        background: #d1fae5;
        color: #065f46;
        .status-dot {
          background: #10b981;
        }
      }

      .status-pill.status-finalizado {
        background: #f1f5f9;
        color: #475569;
        .status-dot {
          background: #94a3b8;
        }
      }

      /* Actions */
      .col-actions {
        display: flex !important;
        justify-content: flex-end;
      }

      .action-group {
        display: flex;
        gap: 2px;
        align-items: center;
      }

      .action-btn {
        width: 32px !important;
        height: 32px !important;
        border-radius: 8px !important;
        display: flex !important;
        align-items: center;
        justify-content: center;
        transition:
          background 0.15s,
          color 0.15s;
      }

      .view-btn {
        color: #3b82f6 !important;
        &:hover {
          background: #eff6ff !important;
        }
      }
      .edit-btn {
        color: #f59e0b !important;
        &:hover {
          background: #fffbeb !important;
        }
      }
      .download-btn {
        color: #10b981 !important;
        &:hover {
          background: #d1fae5 !important;
        }
      }
      .renew-btn {
        color: #8b5cf6 !important;
        &:hover {
          background: #ede9fe !important;
        }
      }

      /* ════════════════════════════
       RESPONSIVE
    ════════════════════════════ */
      @media (max-width: 1200px) {
        .table-header,
        .table-row {
          grid-template-columns: 130px minmax(0, 1.3fr) minmax(0, 1fr) 90px 110px 100px 110px;
          gap: 10px;
        }
      }

      @media (max-width: 1024px) {
        .contracts-container {
          padding: 16px;
        }
        .dashboard-grid {
          grid-template-columns: repeat(3, 1fr);
        }
        .contracts-table {
          min-width: 700px;
        }
        .table-header,
        .table-row {
          grid-template-columns: 120px minmax(0, 1.3fr) minmax(0, 1fr) 86px 100px 95px 105px;
          gap: 8px;
          padding: 0 14px;
        }
      }

      @media (max-width: 768px) {
        .contracts-container {
          padding: 12px;
          gap: 16px;
        }
        .page-header {
          flex-direction: column;
          align-items: stretch;
        }
        .create-button {
          width: 100%;
          justify-content: center;
        }
        .dashboard-grid {
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .filters-content {
          flex-direction: column;
          align-items: stretch !important;
        }
        .search-field,
        .status-field {
          width: 100% !important;
          flex: 1;
          min-width: 0;
        }
        .filters-spacer {
          display: none;
        }
        /* En mobile la tabla hace scroll */
        .contracts-table {
          min-width: 680px;
        }
      }
    `,
  ],
})
export class ContratosComponent implements OnInit {
  readonly Plus = Plus;
  readonly FileText = FileText;
  readonly Search = Search;
  readonly RefreshCw = RefreshCw;
  readonly X = X;
  readonly CheckCircle2 = CheckCircle2;
  readonly Pencil = Pencil;
  readonly DollarSign = DollarSign;
  readonly TrendingUp = TrendingUp;
  readonly AlertTriangle = AlertTriangle;
  readonly Eye = Eye;
  readonly Download = Download;
  readonly RotateCcw = RotateCcw;
  readonly Home = Home;
  readonly Calendar = Calendar;
  readonly ArrowRight = ArrowRight;
  readonly User = User;
  readonly ContractStatus = ContractStatus;

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
      filtered = filtered.filter(
        (c: Contract) =>
          c.tenant?.name?.toLowerCase().includes(term) ||
          c.tenant?.email?.toLowerCase().includes(term) ||
          c.property?.title?.toLowerCase().includes(term) ||
          c.contract_number?.toLowerCase().includes(term),
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
    if (
      !confirm('¿Deseas renovar este contrato? Se creará un nuevo contrato basado en el actual.')
    ) {
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
      },
    });
  }

  getStatusClass(status: ContractStatus): string {
    return `status-${status.toLowerCase()}`;
  }
}
