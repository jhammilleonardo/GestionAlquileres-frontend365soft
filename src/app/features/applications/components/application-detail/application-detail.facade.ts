import { Injectable, inject, signal } from '@angular/core';

import { Application, ApplicationStatus } from '../../../../core/models/application.model';
import { ApplicationService } from '../../../../core/services/admin/application.service';

import { getApiErrorMessage } from '../../../../core/http/http-error.util';
@Injectable()
export class ApplicationDetailFacade {
  private readonly applicationService = inject(ApplicationService);

  readonly application = signal<Application | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  load(id: number): void {
    if (!Number.isFinite(id) || id <= 0) {
      this.error.set('ID de solicitud no valido');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.applicationService.getApplicationById(id).subscribe({
      next: (application) => {
        this.application.set(application);
        this.loading.set(false);
      },
      error: (error: { error?: { message?: string }; message?: string }) => {
        this.error.set(getApiErrorMessage(error, error.message ?? 'Error al cargar la solicitud'));
        this.loading.set(false);
      },
    });
  }

  canBeApproved(status: ApplicationStatus): boolean {
    return status === ApplicationStatus.PENDIENTE;
  }

  canBeRejected(status: ApplicationStatus): boolean {
    return status === ApplicationStatus.PENDIENTE;
  }
}
