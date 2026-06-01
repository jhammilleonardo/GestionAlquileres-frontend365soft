import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ApplicationService } from '../../core/services/admin/application.service';
import { ApplicationListItem, ApplicationStatus } from '../../core/models/application.model';

export interface ApplicationMetrics {
  total: number;
  pendientes: number;
  aprobadas: number;
  rechazadas: number;
}

@Injectable()
export class ApplicationsFacade {
  private readonly applicationService = inject(ApplicationService);
  private readonly destroyRef = inject(DestroyRef);

  // Estado
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Datos crudos (una sola llamada HTTP)
  private readonly allApplications = signal<ApplicationListItem[]>([]);

  // Filtros
  readonly selectedStatus = signal('');
  readonly searchTerm = signal('');

  // Mutadores de filtros para [(ngModel)]
  get selectedStatusValue(): string {
    return this.selectedStatus();
  }
  set selectedStatusValue(v: string) {
    this.selectedStatus.set(v);
  }

  get searchTermValue(): string {
    return this.searchTerm();
  }
  set searchTermValue(v: string) {
    this.searchTerm.set(v);
  }

  // Estado derivado
  readonly filteredApplications = computed<ApplicationListItem[]>(() => {
    let result = this.allApplications();
    const status = this.selectedStatus();
    const term = this.searchTerm().toLowerCase();

    if (status) {
      result = result.filter((a) => a.status === (status as ApplicationStatus));
    }

    if (term) {
      result = result.filter(
        (a) =>
          a.personal_data.full_name.toLowerCase().includes(term) ||
          a.applicant_email.toLowerCase().includes(term) ||
          a.property_title.toLowerCase().includes(term),
      );
    }

    return result;
  });

  readonly metrics = computed<ApplicationMetrics>(() => {
    const apps = this.allApplications();
    return {
      total: apps.length,
      pendientes: apps.filter((a) => a.status === ApplicationStatus.PENDIENTE).length,
      aprobadas: apps.filter((a) => a.status === ApplicationStatus.APROBADA).length,
      rechazadas: apps.filter((a) => a.status === ApplicationStatus.RECHAZADA).length,
    };
  });

  loadApplications(): void {
    this.loading.set(true);
    this.error.set(null);

    this.applicationService
      .getAllApplications()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (apps) => {
          this.allApplications.set(apps);
          this.loading.set(false);
        },
        error: (err: { message?: string }) => {
          this.error.set(err?.message ?? 'Error al cargar las solicitudes');
          this.loading.set(false);
        },
      });
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }
}
