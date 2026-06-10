import { Component, inject, OnInit, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  type LucideIconData,
  Plus,
  Search,
  Wrench,
  Clock,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  ChevronRight,
  Droplet,
  Zap,
  Wind,
  KeyRound,
  Lightbulb,
  Hammer,
  Leaf,
  Home,
} from 'lucide-angular';
import { TenantMaintenanceService } from '../../../core/services/tenant/tenant-maintenance.service';
import { SlugService } from '../../../core/services/slug.service';
import { MaintenanceReadStateService } from '../../../core/services/maintenance/maintenance-read-state.service';
import {
  MaintenanceCategory,
  MaintenanceMessage,
  MaintenancePriority,
  MaintenanceRequest,
  MaintenanceStatus,
} from '../../../core/models/maintenance-request.model';
import { TranslocoModule } from '@jsverse/transloco';
import {
  AppButtonComponent,
  AppEmptyStateComponent,
  AppLoadingStateComponent,
  AppStatusBadgeComponent,
  AppStatusTone,
  AppTextFieldComponent,
} from '../../../shared/ui';

type MaintenanceFilterStatus = MaintenanceStatus | 'all';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tenant-maintenance-list',
  standalone: true,
  imports: [
    RouterModule,
    FormsModule,
    LucideAngularModule,
    TranslocoModule,
    AppButtonComponent,
    AppEmptyStateComponent,
    AppLoadingStateComponent,
    AppStatusBadgeComponent,
    AppTextFieldComponent,
  ],
  template: `
    <section class="maintenance-list">
      <header class="maintenance-list__header">
        <div class="maintenance-list__title-group">
          <div class="maintenance-list__icon">
            <lucide-icon [img]="Wrench" [size]="28"></lucide-icon>
          </div>
          <div>
            <h1>{{ 'public.tenantMaintenance.listTitle' | transloco }}</h1>
            <p>{{ 'public.tenantMaintenance.listSubtitle' | transloco }}</p>
          </div>
        </div>

        <app-button [routerLink]="crearSolicitudUrl()" size="l">
          <lucide-icon [img]="Plus" [size]="18"></lucide-icon>
          {{ 'public.tenantMaintenance.newRequest' | transloco }}
        </app-button>
      </header>

      <div class="maintenance-list__toolbar">
        <div class="status-filters" role="group" aria-label="Filtros de estado">
          @for (filter of statusFilters; track filter.value) {
            <button
              type="button"
              class="status-filter"
              [class.status-filter--active]="selectedStatus === filter.value"
              (click)="filterByStatus(filter.value)"
            >
              <span>{{ filter.labelKey | transloco }}</span>
              @if (filter.count !== null) {
                <strong>{{ filter.count }}</strong>
              }
            </button>
          }
        </div>

        <div class="maintenance-list__search">
          <lucide-icon [img]="Search" [size]="16"></lucide-icon>
          <app-text-field
            [(ngModel)]="searchQuery"
            type="search"
            [placeholder]="'public.tenantMaintenance.searchPlaceholder' | transloco"
            size="m"
          />
        </div>
      </div>

      @if (maintenanceService.isLoading()) {
        <div class="maintenance-list__loading">
          <app-loading-state [label]="'public.tenantMaintenance.loading' | transloco" />
        </div>
      } @else if (filteredRequests.length === 0) {
        <app-empty-state
          [title]="
            searchQuery || selectedStatus !== 'all'
              ? ('public.tenantMaintenance.noResults' | transloco)
              : ('public.tenantMaintenance.noRequests' | transloco)
          "
          [description]="
            searchQuery || selectedStatus !== 'all'
              ? ('public.tenantMaintenance.noResultsDesc' | transloco)
              : ('public.tenantMaintenance.noRequestsDesc' | transloco)
          "
        >
          <lucide-icon icon [img]="FileText" [size]="32"></lucide-icon>
          @if (searchQuery || selectedStatus !== 'all') {
            <app-button actions appearance="outline" (clicked)="clearFilters()">
              {{ 'public.tenantMaintenance.clearFilters' | transloco }}
            </app-button>
          } @else {
            <app-button actions [routerLink]="crearSolicitudUrl()">
              {{ 'public.tenantMaintenance.createFirst' | transloco }}
            </app-button>
          }
        </app-empty-state>
      } @else {
        <div class="request-grid">
          @for (request of filteredRequests; track request.id) {
            <article [routerLink]="buildRequestDetailUrl(request.id)" class="request-card">
              <div class="request-card__top">
                <div class="request-card__meta">
                  <span class="request-card__ticket">{{ request.ticket_number }}</span>
                  @if (
                    getUnreadCount(
                      request.id,
                      maintenanceService.messageCounts()[request.id] || 0
                    ) > 0
                  ) {
                    <div class="relative inline-flex">
                      <lucide-icon [img]="MessageSquare" [size]="20" class="text-blue-500">
                      </lucide-icon>
                      <span class="request-card__unread">
                        {{
                          getUnreadCount(
                            request.id,
                            maintenanceService.messageCounts()[request.id] || 0
                          )
                        }}
                      </span>
                    </div>
                  }
                </div>
                <app-status-badge
                  [tone]="getStatusTone(request.status)"
                  [label]="'public.tenantMaintenance.status.' + request.status | transloco"
                />
              </div>

              <h2>{{ request.title }}</h2>
              <p>{{ request.description }}</p>

              <div class="request-card__footer">
                @if (request.category) {
                  <div class="category-pill">
                    <lucide-icon [img]="getCategoryIcon(request.category)" [size]="14">
                    </lucide-icon>
                    <span>{{
                      'public.tenantMaintenance.category.' + request.category | transloco
                    }}</span>
                  </div>
                }

                <app-status-badge
                  [tone]="getPriorityTone(request.priority)"
                  [label]="'public.tenantMaintenance.priority.' + request.priority | transloco"
                />
              </div>
            </article>
          }
        </div>
      }
    </section>
  `,
  styles: [
    `
      .maintenance-list {
        max-width: 80rem;
        margin: 0 auto;
        padding: var(--app-space-8) var(--app-space-4);
        animation: fadeIn 0.25s ease-out forwards;
      }

      .maintenance-list__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--app-space-5);
        margin-bottom: var(--app-space-8);
      }

      .maintenance-list__title-group {
        display: flex;
        align-items: flex-start;
        gap: var(--app-space-4);
        min-width: 0;
      }

      .maintenance-list__icon {
        display: grid;
        place-items: center;
        width: 3.5rem;
        height: 3.5rem;
        border: 1px solid var(--app-color-border);
        border-radius: var(--app-radius-lg);
        background: var(--tui-status-info-pale);
        color: var(--tui-status-info);
        flex: 0 0 auto;
      }

      h1 {
        margin: 0;
        color: var(--app-color-text);
        font-size: clamp(1.75rem, 3vw, 2.25rem);
        font-weight: 800;
        line-height: 1.1;
      }

      p {
        margin: var(--app-space-1) 0 0;
        color: var(--app-color-text-muted);
      }

      .maintenance-list__toolbar {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(16rem, 24rem);
        gap: var(--app-space-4);
        align-items: center;
        padding: var(--app-space-4);
        margin-bottom: var(--app-space-6);
        border: 1px solid var(--app-color-border);
        border-radius: var(--app-radius-lg);
        background: var(--app-color-surface);
      }

      .status-filters {
        display: flex;
        flex-wrap: wrap;
        gap: var(--app-space-2);
      }

      .status-filter {
        display: inline-flex;
        align-items: center;
        gap: var(--app-space-2);
        min-height: 2.25rem;
        padding: 0 var(--app-space-3);
        border: 1px solid var(--app-color-border);
        border-radius: 999px;
        background: var(--app-color-surface);
        color: var(--app-color-text-muted);
        cursor: pointer;
        font: inherit;
        font-size: 0.875rem;
        font-weight: 700;
        transition:
          background 0.15s,
          border-color 0.15s,
          color 0.15s;
      }

      .status-filter:hover,
      .status-filter--active {
        border-color: var(--app-color-primary);
        background: color-mix(in srgb, var(--app-color-primary) 10%, transparent);
        color: var(--app-color-primary);
      }

      .status-filter strong {
        color: inherit;
      }

      .maintenance-list__search {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        align-items: center;
        gap: var(--app-space-2);
        color: var(--app-color-text-muted);
      }

      .maintenance-list__loading {
        display: grid;
        place-items: center;
        min-height: 16rem;
      }

      .request-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: var(--app-space-5);
      }

      .request-card {
        display: flex;
        flex-direction: column;
        min-height: 12.5rem;
        padding: var(--app-space-4);
        border: 1px solid var(--app-color-border);
        border-radius: var(--app-radius-md);
        background: var(--app-color-surface);
        box-shadow: var(--app-shadow-sm);
        cursor: pointer;
        transition:
          border-color 0.15s,
          box-shadow 0.15s,
          transform 0.15s;
      }

      .request-card:hover {
        border-color: color-mix(in srgb, var(--app-color-primary) 35%, var(--app-color-border));
        box-shadow: var(--app-shadow-md);
        transform: translateY(-2px);
      }

      .request-card__top,
      .request-card__footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--app-space-3);
      }

      .request-card__meta {
        display: inline-flex;
        align-items: center;
        gap: var(--app-space-2);
        min-width: 0;
      }

      .request-card__ticket {
        display: inline-flex;
        max-width: 12rem;
        min-height: 1.625rem;
        align-items: center;
        overflow: hidden;
        border: 1px solid color-mix(in srgb, var(--app-color-primary) 24%, transparent);
        border-radius: 999px;
        background: color-mix(in srgb, var(--app-color-primary) 8%, #fff);
        color: var(--app-color-primary);
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 0.72rem;
        font-weight: 800;
        padding: 0.125rem 0.55rem;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .relative {
        position: relative;
      }

      .inline-flex {
        display: inline-flex;
      }

      .request-card__unread {
        position: absolute;
        inset-block-start: -0.375rem;
        inset-inline-end: -0.5rem;
        display: grid;
        place-items: center;
        min-width: 1.125rem;
        height: 1.125rem;
        padding: 0 0.25rem;
        border-radius: 999px;
        background: var(--tui-status-negative);
        color: #fff;
        font-size: 0.625rem;
        font-weight: 800;
      }

      .request-card h2 {
        display: -webkit-box;
        margin: var(--app-space-4) 0 var(--app-space-2);
        overflow: hidden;
        color: var(--app-color-text);
        font-size: 1.125rem;
        font-weight: 780;
        line-height: 1.25;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
      }

      .request-card p {
        display: -webkit-box;
        flex: 1;
        min-height: 2.8rem;
        margin: 0 0 var(--app-space-4);
        overflow: hidden;
        color: var(--app-color-text-muted);
        font-size: 0.875rem;
        line-height: 1.55;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
      }

      .request-card__footer {
        flex-wrap: wrap;
        padding-top: var(--app-space-3);
        border-top: 1px solid var(--app-color-border);
      }

      .category-pill {
        display: inline-flex;
        align-items: center;
        gap: var(--app-space-2);
        max-width: 100%;
        min-height: 1.875rem;
        padding: 0.25rem 0.625rem;
        border: 1px solid color-mix(in srgb, var(--app-color-primary) 20%, var(--app-color-border));
        border-radius: 999px;
        background: color-mix(in srgb, var(--app-color-primary) 6%, #fff);
        color: var(--app-color-primary);
        font-size: 0.75rem;
        font-weight: 800;
      }

      .category-pill span {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .category-pill lucide-icon {
        flex: 0 0 auto;
      }

      @media (max-width: 980px) {
        .maintenance-list__toolbar {
          grid-template-columns: 1fr;
        }

        .request-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 680px) {
        .maintenance-list {
          padding-inline: var(--app-space-3);
        }

        .maintenance-list__header {
          flex-direction: column;
        }

        .request-grid {
          grid-template-columns: 1fr;
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class TenantMaintenanceListComponent implements OnInit {
  readonly Plus = Plus;
  readonly Search = Search;
  readonly Wrench = Wrench;
  readonly Clock = Clock;
  readonly MessageSquare = MessageSquare;
  readonly AlertCircle = AlertCircle;
  readonly CheckCircle2 = CheckCircle2;
  readonly XCircle = XCircle;
  readonly FileText = FileText;
  readonly ChevronRight = ChevronRight;
  readonly Droplet = Droplet;
  readonly Zap = Zap;
  readonly Wind = Wind;
  readonly KeyRound = KeyRound;
  readonly Lightbulb = Lightbulb;
  readonly Hammer = Hammer;
  readonly Leaf = Leaf;
  readonly Home = Home;

  private categoryIconMap: Record<MaintenanceCategory, LucideIconData> = {
    PLOMERIA: Droplet,
    ELECTRICO: Zap,
    CLIMATIZACION: Wind,
    LLAVE_CERRADURA: KeyRound,
    ILUMINACION: Lightbulb,
    ACCESORIOS: Hammer,
    AFUERA: Leaf,
    GENERAL: Home,
  };

  private categoryBgMap: Record<MaintenanceCategory, string> = {
    PLOMERIA: '#dbeafe',
    ELECTRICO: '#fef9c3',
    CLIMATIZACION: '#cffafe',
    LLAVE_CERRADURA: '#ffedd5',
    ILUMINACION: '#fefce8',
    ACCESORIOS: '#f1f5f9',
    AFUERA: '#dcfce7',
    GENERAL: '#eff6ff',
  };

  private categoryColorMap: Record<MaintenanceCategory, string> = {
    PLOMERIA: '#1d4ed8',
    ELECTRICO: '#a16207',
    CLIMATIZACION: '#0e7490',
    LLAVE_CERRADURA: '#c2410c',
    ILUMINACION: '#854d0e',
    ACCESORIOS: '#475569',
    AFUERA: '#15803d',
    GENERAL: '#1d4ed8',
  };

  getCategoryIcon(category: MaintenanceCategory): LucideIconData {
    return this.categoryIconMap[category] ?? Wrench;
  }

  getVisibleMessages(request: MaintenanceRequest): MaintenanceMessage[] {
    return (request.messages || []).filter((message) => message.send_to_resident === true);
  }

  getUnreadCount(requestId: number, totalVisible: number): number {
    return this.readState.getTenantVisibleUnreadCount(requestId, totalVisible);
  }

  getCategoryBg(category: MaintenanceCategory): string {
    return this.categoryBgMap[category] ?? '#f1f5f9';
  }

  getCategoryColor(category: MaintenanceCategory): string {
    return this.categoryColorMap[category] ?? '#475569';
  }

  maintenanceService = inject(TenantMaintenanceService);
  private slugService = inject(SlugService);
  private readState = inject(MaintenanceReadStateService);

  searchQuery = '';
  selectedStatus: MaintenanceFilterStatus = 'all';
  hoveredCat: Record<number, boolean> = {};

  crearSolicitudUrl = computed(() => this.slugService.buildUrl('/portal/mantenimiento/nueva'));

  get statusFilters(): Array<{
    value: MaintenanceFilterStatus;
    labelKey: string;
    count: number | null;
  }> {
    const stats = this.maintenanceService.stats();

    return [
      {
        value: 'all',
        labelKey: 'public.tenantMaintenance.all',
        count: stats?.total ?? 0,
      },
      {
        value: MaintenanceStatus.NEW,
        labelKey: 'public.tenantMaintenance.new',
        count: this.requestsByStatus(MaintenanceStatus.NEW),
      },
      {
        value: MaintenanceStatus.IN_PROGRESS,
        labelKey: 'public.tenantMaintenance.inProgress',
        count: stats?.active ?? null,
      },
      {
        value: MaintenanceStatus.COMPLETED,
        labelKey: 'public.tenantMaintenance.completed',
        count: stats?.completed ?? null,
      },
    ];
  }

  get filteredRequests() {
    let requests = this.maintenanceService.requests() || [];

    // Asegurarse de que las fechas sean objetos Date para evitar errores en formatDate
    requests = requests.map((r) => ({
      ...r,
      created_at: typeof r.created_at === 'string' ? new Date(r.created_at) : r.created_at,
    }));

    if (this.selectedStatus !== 'all') {
      requests = requests.filter((r) => r.status === (this.selectedStatus as MaintenanceStatus));
    }

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      requests = requests.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query) ||
          r.ticket_number.toLowerCase().includes(query),
      );
    }

    return requests;
  }

  getStatusTone(status: MaintenanceStatus): AppStatusTone {
    const toneByStatus: Record<MaintenanceStatus, AppStatusTone> = {
      [MaintenanceStatus.NEW]: 'info',
      [MaintenanceStatus.IN_PROGRESS]: 'warning',
      [MaintenanceStatus.COMPLETED]: 'success',
      [MaintenanceStatus.CLOSED]: 'success',
      [MaintenanceStatus.DEFERRED]: 'warning',
    };

    return toneByStatus[status];
  }

  getPriorityTone(priority: MaintenancePriority): AppStatusTone {
    const toneByPriority: Record<MaintenancePriority, AppStatusTone> = {
      [MaintenancePriority.LOW]: 'success',
      [MaintenancePriority.NORMAL]: 'warning',
      [MaintenancePriority.HIGH]: 'danger',
    };

    return toneByPriority[priority];
  }

  private requestsByStatus(status: MaintenanceStatus): number {
    return this.maintenanceService.requests().filter((request) => request.status === status).length;
  }

  ngOnInit(): void {
    this.maintenanceService.loadMyRequests();
    this.maintenanceService.loadStats();
  }

  filterByStatus(status: MaintenanceFilterStatus): void {
    this.selectedStatus = status || 'all';
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = 'all';
  }

  buildRequestDetailUrl(requestId: number): string {
    return this.slugService.buildUrl(`/portal/mantenimiento/${requestId}`);
  }
}
