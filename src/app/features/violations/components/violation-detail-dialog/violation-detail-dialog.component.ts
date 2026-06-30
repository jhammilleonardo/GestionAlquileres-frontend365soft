import { SlicePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import {
  LucideAngularModule,
  ArrowRightLeft,
  Ban,
  BadgeCheck,
  Bell,
  DollarSign,
  FilePlus2,
  ImagePlus,
  MessageSquare,
} from 'lucide-angular';

import {
  Violation,
  ViolationEvent,
  ViolationEventType,
  ViolationFineStatus,
  ViolationSeverity,
  ViolationStatus,
  isViolationOverdue,
} from '../../../../core/models/violation.model';
import { SecureFileService } from '../../../../core/services/secure-file.service';
import { TenantCurrencyPipe } from '../../../../shared/pipes/tenant-currency.pipe';
import { TenantDatePipe } from '../../../../shared/pipes/tenant-date.pipe';
import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { AppDialogComponent } from '../../../../shared/ui/dialog/dialog.component';
import {
  AppStatusBadgeComponent,
  AppStatusTone,
} from '../../../../shared/ui/status-badge/status-badge.component';

const CLOSED: readonly ViolationStatus[] = [ViolationStatus.RESOLVED, ViolationStatus.DISMISSED];

@Component({
  selector: 'app-violation-detail-dialog',
  standalone: true,
  imports: [
    SlicePipe,
    TranslocoModule,
    LucideAngularModule,
    TenantCurrencyPipe,
    TenantDatePipe,
    AppButtonComponent,
    AppDialogComponent,
    AppStatusBadgeComponent,
  ],
  templateUrl: './violation-detail-dialog.component.html',
  styleUrl: '../../violations.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViolationDetailDialogComponent {
  private readonly secureFile = inject(SecureFileService);
  private readonly transloco = inject(TranslocoService);

  readonly open = input.required<boolean>();
  readonly violation = input<Violation | null>(null);
  readonly loading = input(false);
  readonly busy = input(false);
  readonly noteText = input('');
  readonly fineAmount = input<number | null>(null);

  readonly closed = output<void>();
  readonly statusChange = output<ViolationStatus>();
  readonly noteTextChange = output<string>();
  readonly noteAdded = output<void>();
  readonly fineAmountChange = output<number | null>();
  readonly fineCharged = output<void>();
  readonly fineWaived = output<void>();
  readonly finePaid = output<void>();

  protected readonly FineStatus = ViolationFineStatus;
  protected readonly statusOrder: readonly ViolationStatus[] = [
    ViolationStatus.NOTIFIED,
    ViolationStatus.IN_PROGRESS,
    ViolationStatus.ESCALATED,
    ViolationStatus.RESOLVED,
    ViolationStatus.DISMISSED,
  ];

  private readonly photoObjectUrls = signal<Record<string, string>>({});

  readonly nextStatuses = computed<ViolationStatus[]>(() => {
    const current = this.violation()?.status;
    if (!current) return [];
    return this.statusOrder.filter((status) => status !== current);
  });

  constructor() {
    effect(() => {
      const violation = this.violation();
      untracked(() => this.loadEvidenceUrls(violation?.evidence_photos ?? []));
    });
  }

  photoSrc(path: string): string | null {
    return this.photoObjectUrls()[path] ?? null;
  }

  isOverdue(violation: Violation): boolean {
    return isViolationOverdue(violation);
  }

  hasPendingFine(violation: Violation): boolean {
    return violation.fine_status === ViolationFineStatus.CHARGED;
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

  eventIcon(type: ViolationEventType): typeof Bell {
    switch (type) {
      case ViolationEventType.CREATED:
        return FilePlus2;
      case ViolationEventType.STATUS_CHANGED:
        return ArrowRightLeft;
      case ViolationEventType.NOTIFIED:
        return Bell;
      case ViolationEventType.FINE_CHARGED:
        return DollarSign;
      case ViolationEventType.FINE_WAIVED:
        return Ban;
      case ViolationEventType.FINE_PAID:
        return BadgeCheck;
      case ViolationEventType.EVIDENCE_ADDED:
        return ImagePlus;
      case ViolationEventType.NOTE:
        return MessageSquare;
    }
  }

  /** Texto descriptivo del evento de la línea de tiempo. */
  eventLabel(event: ViolationEvent): string {
    if (event.event_type === ViolationEventType.STATUS_CHANGED) {
      const to = event.metadata?.['to'] as string | undefined;
      const from = event.metadata?.['from'] as string | undefined;
      const fromLabel = from ? this.transloco.translate(`violations.status.${from}`) : '';
      const toLabel = to ? this.transloco.translate(`violations.status.${to}`) : '';
      return `${fromLabel} → ${toLabel}`;
    }
    return this.transloco.translate(`violations.event.${event.event_type}`);
  }

  inputValue(event: Event): string {
    const target = event.target;
    return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
      ? target.value
      : '';
  }

  onNoteInput(event: Event): void {
    this.noteTextChange.emit(this.inputValue(event));
  }

  onFineInput(event: Event): void {
    const value = this.inputValue(event);
    const parsed = value === '' ? null : Number(value);
    this.fineAmountChange.emit(Number.isFinite(parsed as number) ? parsed : null);
  }

  private loadEvidenceUrls(paths: readonly string[]): void {
    for (const path of paths) {
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

  protected readonly closedStatuses = CLOSED;
}
