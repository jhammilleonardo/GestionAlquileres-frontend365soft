import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  LucideAngularModule,
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
import { MaintenanceStatus } from '../../../core/models/maintenance-request.model';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-tenant-maintenance-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    LucideAngularModule,
    TranslocoModule,
  ],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <!-- Encabezado Moderno -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div class="flex items-start gap-4">
          <div class="p-3 bg-primary-50 rounded-2xl shadow-sm border border-primary-100">
            <lucide-icon [img]="Wrench" class="text-primary-600" [size]="28"></lucide-icon>
          </div>
          <div>
            <h1 class="text-3xl font-bold text-slate-800 tracking-tight mb-1">
              {{ 'public.tenantMaintenance.listTitle' | transloco }}
            </h1>
            <p class="text-slate-500 text-sm md:text-base">
              {{ 'public.tenantMaintenance.listSubtitle' | transloco }}
            </p>
          </div>
        </div>

        <button
          mat-raised-button
          [routerLink]="crearSolicitudUrl()"
          style="background-color: #2563eb; color: white; border-radius: 12px; padding: 10px 24px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px;"
        >
          <lucide-icon [img]="Plus" [size]="18"></lucide-icon>
          {{ 'public.tenantMaintenance.newRequest' | transloco }}
        </button>
      </div>

      <!-- Panel de Controles (Buscador y Filtros) -->
      <mat-card class="mb-8" style="padding: 12px 20px; border: none; box-shadow: none;">
        <div
          style="display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap;"
        >
          <!-- Filtros con mat-chip-listbox -->
          <mat-chip-listbox
            [value]="selectedStatus"
            (change)="filterByStatus($event.value)"
            style="flex-shrink:0;"
          >
            <mat-chip-option value="all">
              {{ 'public.tenantMaintenance.all' | transloco }}
              <strong style="margin-left:4px;">{{ maintenanceService.stats()?.total || 0 }}</strong>
            </mat-chip-option>
            <mat-chip-option value="NEW">{{
              'public.tenantMaintenance.new' | transloco
            }}</mat-chip-option>
            <mat-chip-option value="IN_PROGRESS">
              {{ 'public.tenantMaintenance.inProgress' | transloco }}
              <strong style="margin-left:4px;">{{
                maintenanceService.stats()?.active || 0
              }}</strong>
            </mat-chip-option>
            <mat-chip-option value="COMPLETED">
              {{ 'public.tenantMaintenance.completed' | transloco }}
              <strong style="margin-left:4px;">{{
                maintenanceService.stats()?.completed || 0
              }}</strong>
            </mat-chip-option>
          </mat-chip-listbox>

          <!-- Buscador con mat-form-field -->
          <mat-form-field
            appearance="outline"
            subscriptSizing="dynamic"
            style="flex:1; min-width:200px;"
          >
            <lucide-icon
              matPrefix
              [img]="Search"
              [size]="16"
              style="margin-right:6px; opacity:0.5;"
            ></lucide-icon>
            <input
              matInput
              [(ngModel)]="searchQuery"
              [placeholder]="'public.tenantMaintenance.searchPlaceholder' | transloco"
            />
          </mat-form-field>
        </div>
      </mat-card>

      <!-- Contenido Principal -->
      @if (maintenanceService.isLoading()) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (i of [1, 2, 3, 4, 5, 6]; track i) {
            <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse">
              <div class="flex justify-between items-center mb-4">
                <div class="h-4 bg-slate-200 rounded w-1/4"></div>
                <div class="h-6 bg-slate-200 rounded-full w-1/3"></div>
              </div>
              <div class="h-5 bg-slate-200 rounded w-3/4 mb-3"></div>
              <div class="h-4 bg-slate-200 rounded w-1/2 mb-6"></div>
              <div class="h-16 bg-slate-100 rounded-xl mb-4"></div>
              <div class="flex gap-4 pt-4 border-t border-slate-100">
                <div class="h-4 bg-slate-200 rounded w-1/4"></div>
                <div class="h-4 bg-slate-200 rounded w-1/4"></div>
              </div>
            </div>
          }
        </div>
      } @else if (filteredRequests.length === 0) {
        <div
          class="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-3xl border border-slate-100 border-dashed shadow-sm"
        >
          <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <lucide-icon [img]="FileText" class="text-slate-300" [size]="40"></lucide-icon>
          </div>
          <h3 class="text-xl font-bold text-slate-800 mb-2">
            {{
              searchQuery || selectedStatus !== 'all'
                ? ('public.tenantMaintenance.noResults' | transloco)
                : ('public.tenantMaintenance.noRequests' | transloco)
            }}
          </h3>
          <p class="text-slate-500 max-w-sm mx-auto mb-8">
            {{
              searchQuery || selectedStatus !== 'all'
                ? ('public.tenantMaintenance.noResultsDesc' | transloco)
                : ('public.tenantMaintenance.noRequestsDesc' | transloco)
            }}
          </p>
          @if (searchQuery || selectedStatus !== 'all') {
            <button
              (click)="clearFilters()"
              class="text-primary-600 font-medium hover:text-primary-700 bg-primary-50 px-6 py-2.5 rounded-xl transition-colors"
            >
              {{ 'public.tenantMaintenance.clearFilters' | transloco }}
            </button>
          } @else {
            <button
              [routerLink]="crearSolicitudUrl()"
              class="text-white font-medium bg-primary-600 hover:bg-primary-700 px-6 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              {{ 'public.tenantMaintenance.createFirst' | transloco }}
            </button>
          }
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          @for (request of filteredRequests; track request.id) {
            <div
              [routerLink]="buildRequestDetailUrl(request.id)"
              class="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer p-6 flex flex-col"
            >
              <!-- Top: ticket + status + mensajes -->
              <div class="flex justify-between items-center mb-3">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-mono text-slate-400">{{ request.ticket_number }}</span>
                  @if (
                    getUnreadCount(
                      request.id,
                      maintenanceService.messageCounts()[request.id] || 0
                    ) > 0
                  ) {
                    <div class="relative inline-flex">
                      <lucide-icon [img]="MessageSquare" [size]="20" class="text-blue-500">
                      </lucide-icon>
                      <span
                        class="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1"
                      >
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
                <span
                  class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white"
                  [ngClass]="{
                    'bg-blue-500': request.status === 'NEW',
                    'bg-amber-500': request.status === 'IN_PROGRESS',
                    'bg-emerald-500': request.status === 'COMPLETED' || request.status === 'CLOSED',
                    'bg-orange-500': request.status === 'DEFERRED',
                  }"
                >
                  {{ 'public.tenantMaintenance.status.' + request.status | transloco }}
                </span>
              </div>

              <!-- Title -->
              <h3 class="text-lg font-bold text-slate-900 line-clamp-2 mb-3 flex-1">
                {{ request.title }}
              </h3>

              <!-- Description -->
              <p class="text-sm text-slate-500 line-clamp-2 mb-4">
                {{ request.description }}
              </p>

              <!-- Footer: category + priority -->
              <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
                @if (request.category) {
                  <div
                    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 cursor-default"
                    [style.border-color]="
                      hoveredCat[request.id] ? getCategoryColor(request.category) : '#cbd5e1'
                    "
                    [style.color]="
                      hoveredCat[request.id] ? getCategoryColor(request.category) : '#64748b'
                    "
                    (mouseenter)="hoveredCat[request.id] = true"
                    (mouseleave)="hoveredCat[request.id] = false"
                  >
                    <lucide-icon
                      [img]="getCategoryIcon(request.category)"
                      [size]="14"
                      [style.color]="
                        hoveredCat[request.id] ? getCategoryColor(request.category) : '#64748b'
                      "
                    >
                    </lucide-icon>
                    <span class="text-xs font-medium">{{
                      'public.tenantMaintenance.category.' + request.category | transloco
                    }}</span>
                  </div>
                }

                <span
                  class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white"
                  [ngClass]="{
                    'bg-emerald-500': request.priority === 'LOW',
                    'bg-orange-500': request.priority === 'NORMAL',
                    'bg-red-500': request.priority === 'HIGH',
                  }"
                >
                  {{ 'public.tenantMaintenance.priority.' + request.priority | transloco }}
                </span>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      /* Utilidades para ocultar barra de scroll en los filtros */
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }

      /* Animaciones suaves */
      .animate-fade-in {
        animation: fadeIn 0.4s ease-out forwards;
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

  private categoryIconMap: Record<string, any> = {
    PLOMERIA: Droplet,
    ELECTRICO: Zap,
    CLIMATIZACION: Wind,
    LLAVE_CERRADURA: KeyRound,
    ILUMINACION: Lightbulb,
    ACCESORIOS: Hammer,
    AFUERA: Leaf,
    GENERAL: Home,
  };

  private categoryBgMap: Record<string, string> = {
    PLOMERIA: '#dbeafe',
    ELECTRICO: '#fef9c3',
    CLIMATIZACION: '#cffafe',
    LLAVE_CERRADURA: '#ffedd5',
    ILUMINACION: '#fefce8',
    ACCESORIOS: '#f1f5f9',
    AFUERA: '#dcfce7',
    GENERAL: '#eff6ff',
  };

  private categoryColorMap: Record<string, string> = {
    PLOMERIA: '#1d4ed8',
    ELECTRICO: '#a16207',
    CLIMATIZACION: '#0e7490',
    LLAVE_CERRADURA: '#c2410c',
    ILUMINACION: '#854d0e',
    ACCESORIOS: '#475569',
    AFUERA: '#15803d',
    GENERAL: '#1d4ed8',
  };

  getCategoryIcon(category: string): any {
    return this.categoryIconMap[category] ?? Wrench;
  }

  getVisibleMessages(request: any): any[] {
    return (request.messages || []).filter((m: any) => m.send_to_resident === true);
  }

  getUnreadCount(requestId: number, totalVisible: number): number {
    const read = parseInt(localStorage.getItem(`mnt_read_${requestId}`) ?? '0', 10);
    return Math.max(0, totalVisible - read);
  }

  getCategoryBg(category: string): string {
    return this.categoryBgMap[category] ?? '#f1f5f9';
  }

  getCategoryColor(category: string): string {
    return this.categoryColorMap[category] ?? '#475569';
  }

  maintenanceService = inject(TenantMaintenanceService);
  private slugService = inject(SlugService);

  searchQuery = '';
  selectedStatus: string = 'all';
  hoveredCat: Record<number, boolean> = {};

  crearSolicitudUrl = computed(() => this.slugService.buildUrl('/portal/mantenimiento/nueva'));

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

  ngOnInit(): void {
    this.maintenanceService.loadMyRequests();
    this.maintenanceService.loadStats();
  }

  filterByStatus(status: string): void {
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
