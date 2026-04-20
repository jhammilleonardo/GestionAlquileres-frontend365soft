import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  LucideAngularModule,
  Search,
  FileText,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  X,
} from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ApplicationService } from '../../core/services/admin/application.service';
import { ApplicationListItem, ApplicationStatus } from '../../core/models/application.model';
import { TenantDatePipe } from '../../shared/pipes/tenant-date.pipe';
import { TenantCurrencyPipe } from '../../shared/pipes/tenant-currency.pipe';

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  providers: [provideTranslocoScope('solicitudes')],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatTooltipModule,
    MatChipsModule,
    MatTableModule,
    MatProgressSpinnerModule,
    LucideAngularModule,
    TranslocoModule,
    TenantDatePipe,
    TenantCurrencyPipe,
  ],
  templateUrl: './solicitudes.component.html',
  styleUrls: ['./solicitudes.component.css'],
})
export class SolicitudesComponent implements OnInit, OnDestroy {
  // Icons
  readonly Search = Search;
  readonly FileText = FileText;
  readonly Eye = Eye;
  readonly CheckCircle2 = CheckCircle2;
  readonly XCircle = XCircle;
  readonly Clock = Clock;
  readonly X = X;

  private applicationService = inject(ApplicationService);
  private destroy$ = new Subject<void>();
  private cdr = inject(ChangeDetectorRef);

  // Estado
  loading = false;
  error: string | null = null;

  // Datos crudos (una sola llamada HTTP)
  private allApplications: ApplicationListItem[] = [];

  // Filtros
  selectedStatus = '';
  searchTerm = '';

  displayedColumns = ['id', 'applicant', 'property', 'income', 'date', 'status', 'actions'];

  statuses = ['', 'PENDIENTE', 'APROBADA', 'RECHAZADA'];

  // ── Getters computados (sin llamadas HTTP extra) ──────────────────────────────

  get filteredApplications(): ApplicationListItem[] {
    let result = this.allApplications;

    if (this.selectedStatus) {
      result = result.filter((a) => a.status === (this.selectedStatus as ApplicationStatus));
    }

    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase();
      result = result.filter(
        (a) =>
          a.personal_data.full_name.toLowerCase().includes(q) ||
          a.applicant_email.toLowerCase().includes(q) ||
          a.property_title.toLowerCase().includes(q),
      );
    }

    return result;
  }

  get metrics() {
    return {
      total: this.allApplications.length,
      pendientes: this.allApplications.filter((a) => a.status === ApplicationStatus.PENDIENTE)
        .length,
      aprobadas: this.allApplications.filter((a) => a.status === ApplicationStatus.APROBADA).length,
      rechazadas: this.allApplications.filter((a) => a.status === ApplicationStatus.RECHAZADA)
        .length,
    };
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadApplications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Data loading (UNA sola petición HTTP) ─────────────────────────────────────

  loadApplications(): void {
    this.loading = true;
    this.error = null;

    this.applicationService
      .getAllApplications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (apps) => {
          this.allApplications = apps;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = err?.message ?? 'Error al cargar las solicitudes';
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  // ── Handlers (solo filtran en memoria, sin nueva petición) ────────────────────

  onStatusChange(): void {
    /* el getter filteredApplications recalcula automáticamente */
  }
  onSearch(): void {
    /* ídem */
  }
  clearSearch(): void {
    this.searchTerm = '';
  }
}
