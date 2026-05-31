import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BadgeDollarSign,
  Building2,
  CheckCircle,
  ClipboardList,
  ExternalLink,
  LucideAngularModule,
  RefreshCw,
  TrendingUp,
  Wrench,
} from 'lucide-angular';

import {
  AdminOperationsService,
  ReportKpis,
} from '../../core/services/admin/admin-operations.service';
import { SlugService } from '../../core/services/slug.service';
import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { AppLoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { AppPageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import {
  AppStatusBadgeComponent,
  AppStatusTone,
} from '../../shared/ui/status-badge/status-badge.component';

interface KpiTrend {
  readonly pct: number;
  readonly up: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DecimalPipe,
    PercentPipe,
    TranslocoModule,
    LucideAngularModule,
    AppButtonComponent,
    AppLoadingStateComponent,
    AppPageHeaderComponent,
    AppStatusBadgeComponent,
  ],
  providers: [provideTranslocoScope('dashboard')],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly router = inject(Router);
  private readonly slugService = inject(SlugService);
  private readonly operations = inject(AdminOperationsService);

  readonly accessDenied = signal(false);
  readonly isLoading = signal(true);
  readonly kpis = signal<ReportKpis>({});

  readonly AlertTriangle = AlertTriangle;
  readonly ArrowUpRight = ArrowUpRight;
  readonly ArrowDownRight = ArrowDownRight;
  readonly ExternalLink = ExternalLink;
  readonly RefreshCw = RefreshCw;
  readonly TrendingUp = TrendingUp;
  readonly BadgeDollarSign = BadgeDollarSign;
  readonly Wrench = Wrench;
  readonly Building2 = Building2;
  readonly ClipboardList = ClipboardList;
  readonly CheckCircle = CheckCircle;

  // Comparativo de ingresos vs mes anterior (null cuando no hay base previa)
  readonly incomeTrend = computed<KpiTrend | null>(() => {
    const current = this.kpis().monthlyIncome ?? 0;
    const previous = this.kpis().monthlyIncomePrevious ?? 0;
    if (previous <= 0) {
      return null;
    }
    const pct = ((current - previous) / previous) * 100;
    return { pct: Math.abs(pct), up: pct >= 0 };
  });

  readonly hasDelinquency = computed(() => (this.kpis().delinquentCount ?? 0) > 0);

  constructor() {
    const navState = history.state as { accessDenied?: boolean } | undefined;
    if (navState?.accessDenied) {
      this.accessDenied.set(true);
      setTimeout(() => this.accessDenied.set(false), 5000);
    }

    this.loadKpis();
  }

  refresh(): void {
    this.loadKpis();
  }

  private loadKpis(): void {
    this.isLoading.set(true);
    this.operations
      .getReportsKpis()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (kpis) => this.kpis.set(kpis),
        error: () => this.kpis.set({}),
      });
  }

  getOccupancyTone(): AppStatusTone {
    const rate = this.kpis().occupancyRateValue ?? 0;
    if (rate >= 0.8) return 'success';
    if (rate >= 0.5) return 'warning';
    return 'danger';
  }

  getMaintenanceTone(): AppStatusTone {
    const count = this.kpis().activeMaintenanceCount ?? 0;
    if (count === 0) return 'success';
    if (count <= 5) return 'warning';
    return 'danger';
  }

  getPendingPaymentsTone(): AppStatusTone {
    if (this.hasDelinquency()) return 'danger';
    const count = this.kpis().pendingPaymentsCount ?? 0;
    if (count === 0) return 'success';
    return 'warning';
  }

  // Navegación por KPI: cada tarjeta lleva al módulo correspondiente con el filtro aplicado
  goToOccupancy(): void {
    this.navigate(['propiedades']);
  }

  goToIncome(): void {
    this.navigate(['pagos']);
  }

  goToPendingPayments(): void {
    this.navigate(['pagos'], { tab: 'pending' });
  }

  goToMaintenance(): void {
    this.navigate(['mantenimiento']);
  }

  goToExpiringContracts(): void {
    this.navigate(['contratos'], { status: 'POR_VENCER' });
  }

  goToAvailableProperties(): void {
    this.navigate(['propiedades'], { status: 'available' });
  }

  goToPublicProperties(): void {
    const slug = this.slugService.getSlug();
    void this.router.navigate([slug, 'publico', 'propiedades']);
  }

  private navigate(segments: string[], queryParams?: Record<string, string>): void {
    const slug = this.slugService.getSlug();
    void this.router.navigate([slug, ...segments], queryParams ? { queryParams } : {});
  }
}
