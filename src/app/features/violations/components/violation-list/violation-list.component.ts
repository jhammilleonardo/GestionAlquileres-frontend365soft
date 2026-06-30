import { SlicePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import {
  LucideAngularModule,
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCircle2,
  Eye,
  ListChecks,
} from 'lucide-angular';

import {
  Violation,
  ViolationFineStatus,
  ViolationSeverity,
  ViolationStatus,
  isViolationOverdue,
} from '../../../../core/models/violation.model';
import { SecureFileService } from '../../../../core/services/secure-file.service';
import { TenantCurrencyPipe } from '../../../../shared/pipes/tenant-currency.pipe';
import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import {
  AppStatusBadgeComponent,
  AppStatusTone,
} from '../../../../shared/ui/status-badge/status-badge.component';

@Component({
  selector: 'app-violation-list',
  standalone: true,
  imports: [
    SlicePipe,
    TranslocoModule,
    LucideAngularModule,
    TenantCurrencyPipe,
    AppButtonComponent,
    AppStatusBadgeComponent,
  ],
  templateUrl: './violation-list.component.html',
  styleUrl: '../../violations.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViolationListComponent {
  private readonly secureFile = inject(SecureFileService);

  readonly violations = input.required<readonly Violation[]>();
  readonly busyId = input<number | null>(null);

  readonly notified = output<Violation>();
  readonly pdfViewRequested = output<Violation>();
  readonly resolveRequested = output<Violation>();
  readonly detailRequested = output<Violation>();

  readonly Bell = Bell;
  readonly Eye = Eye;
  readonly CheckCircle2 = CheckCircle2;
  readonly CalendarClock = CalendarClock;
  readonly AlertTriangle = AlertTriangle;
  readonly ListChecks = ListChecks;

  protected readonly FineStatus = ViolationFineStatus;

  // Las fotos de evidencia son privadas (requieren JWT), por lo que un <img src>
  // directo falla con 401. Se resuelven a object URLs autenticados.
  private readonly photoObjectUrls = signal<Record<string, string>>({});

  constructor() {
    effect(() => {
      const violations = this.violations();
      untracked(() => this.loadEvidenceUrls(violations));
    });
  }

  photoSrc(path: string): string | null {
    return this.photoObjectUrls()[path] ?? null;
  }

  statusTone(status: ViolationStatus): AppStatusTone {
    switch (status) {
      case ViolationStatus.OPEN:
        return 'warning';
      case ViolationStatus.NOTIFIED:
      case ViolationStatus.IN_PROGRESS:
        return 'info';
      case ViolationStatus.ESCALATED:
        return 'danger';
      case ViolationStatus.RESOLVED:
        return 'success';
      case ViolationStatus.DISMISSED:
        return 'neutral';
    }
  }

  severityTone(severity: ViolationSeverity): AppStatusTone {
    switch (severity) {
      case ViolationSeverity.LOW:
        return 'neutral';
      case ViolationSeverity.MEDIUM:
        return 'warning';
      case ViolationSeverity.HIGH:
        return 'danger';
    }
  }

  fineTone(status: ViolationFineStatus): AppStatusTone {
    switch (status) {
      case ViolationFineStatus.CHARGED:
        return 'warning';
      case ViolationFineStatus.PAID:
        return 'success';
      default:
        return 'neutral';
    }
  }

  isOverdue(violation: Violation): boolean {
    return isViolationOverdue(violation);
  }

  hasFine(violation: Violation): boolean {
    return violation.fine_status !== ViolationFineStatus.NONE && violation.fine_amount != null;
  }

  isResolved(violation: Violation): boolean {
    return (
      violation.status === ViolationStatus.RESOLVED ||
      violation.status === ViolationStatus.DISMISSED
    );
  }

  private loadEvidenceUrls(violations: readonly Violation[]): void {
    for (const violation of violations) {
      for (const path of violation.evidence_photos ?? []) {
        if (this.photoObjectUrls()[path]) {
          continue;
        }
        this.secureFile.getObjectUrl(path, 'admin').subscribe({
          next: (objectUrl) =>
            this.photoObjectUrls.update((urls) => ({ ...urls, [path]: objectUrl })),
          error: () => undefined,
        });
      }
    }
  }
}
