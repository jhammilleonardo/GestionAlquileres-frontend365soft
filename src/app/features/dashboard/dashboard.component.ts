import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe, LowerCasePipe, PercentPipe } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BadgeDollarSign,
  Building2,
  Calendar,
  CheckCircle,
  ClipboardList,
  ExternalLink,
  FileText,
  LucideAngularModule,
  type LucideIconData,
  Receipt,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  Users,
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

/** Elemento del centro de acciones: algo que requiere atención del admin. */
interface ActionItem {
  readonly key: string;
  readonly count: number;
  readonly icon: LucideIconData;
  readonly tone: AppStatusTone;
  readonly action: () => void;
}

/** Prioridad de orden del centro de acciones (más urgente primero). */
const ACTION_TONE_ORDER: Record<AppStatusTone, number> = {
  danger: 0,
  warning: 1,
  info: 2,
  success: 3,
  neutral: 4,
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DecimalPipe,
    LowerCasePipe,
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
  readonly rentalModeBlocked = signal(false);
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
  readonly Calendar = Calendar;
  readonly Users = Users;
  readonly FileText = FileText;
  readonly ShieldAlert = ShieldAlert;
  readonly AlertCircle = AlertCircle;
  readonly Receipt = Receipt;

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

  /**
   * Centro de acciones (estilo Airbnb): lista priorizada de pendientes derivada
   * de los KPIs ya cargados. Solo muestra lo que tiene conteo > 0 y ordena por
   * urgencia (morosidad/violaciones primero). Cada ítem navega a su módulo.
   */
  readonly actionItems = computed<ActionItem[]>(() => {
    const k = this.kpis();
    const items: ActionItem[] = [];

    const delinquent = k.delinquentCount ?? 0;
    if (delinquent > 0) {
      items.push({
        key: 'delinquent',
        count: delinquent,
        icon: AlertCircle,
        tone: 'danger',
        action: () => this.goToDelinquent(),
      });
    }

    const violations = k.openViolationsCount ?? 0;
    if (violations > 0) {
      items.push({
        key: 'violations',
        count: violations,
        icon: ShieldAlert,
        tone: 'danger',
        action: () => this.goToViolations(),
      });
    }

    const pendingPayments = k.pendingPaymentsCount ?? 0;
    if (pendingPayments > 0) {
      items.push({
        key: 'pendingPayments',
        count: pendingPayments,
        icon: Receipt,
        tone: 'warning',
        action: () => this.goToPendingPayments(),
      });
    }

    const maintenance = k.activeMaintenanceCount ?? 0;
    if (maintenance > 0) {
      items.push({
        key: 'maintenance',
        count: maintenance,
        icon: Wrench,
        tone: 'warning',
        action: () => this.goToMaintenance(),
      });
    }

    const expiring = k.expiringContracts ?? 0;
    if (expiring > 0) {
      items.push({
        key: 'expiringContracts',
        count: expiring,
        icon: FileText,
        tone: 'warning',
        action: () => this.goToExpiringContracts(),
      });
    }

    const applications = k.pendingApplicationsList?.length ?? 0;
    if (applications > 0) {
      items.push({
        key: 'applications',
        count: applications,
        icon: ClipboardList,
        tone: 'info',
        action: () => this.goToApplications(),
      });
    }

    const inspections = k.upcomingInspectionsCount ?? 0;
    if (inspections > 0) {
      items.push({
        key: 'inspections',
        count: inspections,
        icon: Calendar,
        tone: 'info',
        action: () => this.goToInspections(),
      });
    }

    return items.sort((a, b) => ACTION_TONE_ORDER[a.tone] - ACTION_TONE_ORDER[b.tone]);
  });

  readonly hasActionItems = computed(() => this.actionItems().length > 0);

  readonly rentCollectionPct = computed<number>(() => {
    const expected = this.kpis().monthlyExpected ?? 0;
    const collected = this.kpis().monthlyIncome ?? 0;
    if (expected <= 0) return 0;
    return Math.min(Math.round((collected / expected) * 100), 100);
  });

  readonly rentCollectionTone = computed<AppStatusTone>(() => {
    const pct = this.rentCollectionPct();
    if (pct >= 80) return 'success';
    if (pct >= 50) return 'warning';
    return 'danger';
  });

  readonly MAINTENANCE_STAGE_LABELS: Record<string, string | undefined> = {
    REPORTED: 'Reportado',
    ASSIGNED: 'Asignado',
    SCHEDULED: 'Programado',
    IN_PROGRESS: 'En progreso',
    REPORTED_TO_OWNER: 'Reportado al propietario',
    COMPLETED: 'Completado',
    NEW: 'Nuevo',
  };

  constructor() {
    const navState = history.state as
      | { accessDenied?: boolean; rentalModeBlocked?: boolean }
      | undefined;
    if (navState?.accessDenied) {
      this.accessDenied.set(true);
      setTimeout(() => this.accessDenied.set(false), 5000);
    }
    if (navState?.rentalModeBlocked) {
      this.rentalModeBlocked.set(true);
      setTimeout(() => this.rentalModeBlocked.set(false), 5000);
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

  goToDelinquent(): void {
    this.navigate(['pagos'], { tab: 'delinquent' });
  }

  goToApplications(): void {
    this.navigate(['solicitudes']);
  }

  goToViolations(): void {
    this.navigate(['violaciones']);
  }

  goToInspections(): void {
    this.navigate(['inspecciones']);
  }

  goToExpenses(): void {
    this.navigate(['gastos']);
  }

  readonly VIOLATION_TYPE_LABELS: Record<string, string | undefined> = {
    noise: 'Ruido',
    pets: 'Mascotas',
    parking: 'Estacionamiento',
    damage: 'Daños',
    cleanliness: 'Limpieza',
    other: 'Otro',
  };

  readonly INSPECTION_TYPE_LABELS: Record<string, string | undefined> = {
    move_in: 'Entrada',
    move_out: 'Salida',
    periodic: 'Periódica',
  };

  readonly EXPENSE_CATEGORY_LABELS: Record<string, string | undefined> = {
    MAINTENANCE: 'Mantenimiento',
    INSURANCE: 'Seguros',
    TAX: 'Impuestos',
    UTILITIES: 'Servicios',
    MANAGEMENT_FEE: 'Honorarios',
    CLEANING: 'Limpieza',
    OTHER: 'Otros',
  };

  goToPublicProperties(): void {
    const slug = this.slugService.getSlug();
    const url = this.router.serializeUrl(
      this.router.createUrlTree([slug, 'publico', 'propiedades']),
    );
    window.open(url, '_blank', 'noopener');
  }

  private navigate(segments: string[], queryParams?: Record<string, string>): void {
    const slug = this.slugService.getSlug();
    void this.router.navigate([slug, ...segments], queryParams ? { queryParams } : {});
  }
}
