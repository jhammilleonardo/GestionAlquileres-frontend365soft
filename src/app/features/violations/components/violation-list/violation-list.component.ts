import { SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { LucideAngularModule, Bell, CheckCircle2, FileText } from 'lucide-angular';

import { environment } from '../../../../../environments/environment';
import { Violation, ViolationStatus } from '../../../../core/models/violation.model';
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
    AppButtonComponent,
    AppStatusBadgeComponent,
  ],
  templateUrl: './violation-list.component.html',
  styleUrl: '../../violations.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViolationListComponent {
  readonly violations = input.required<readonly Violation[]>();
  readonly busyId = input<number | null>(null);

  readonly notified = output<Violation>();
  readonly pdfRequested = output<Violation>();
  readonly resolveRequested = output<Violation>();

  readonly Bell = Bell;
  readonly FileText = FileText;
  readonly CheckCircle2 = CheckCircle2;

  statusTone(status: ViolationStatus): AppStatusTone {
    switch (status) {
      case ViolationStatus.OPEN:
        return 'warning';
      case ViolationStatus.NOTIFIED:
        return 'info';
      case ViolationStatus.RESOLVED:
        return 'success';
    }
  }

  photoUrl(path: string): string {
    return path.startsWith('http') ? path : `${environment.apiUrl.replace(/\/$/, '')}${path}`;
  }

  isResolved(violation: Violation): boolean {
    return violation.status === ViolationStatus.RESOLVED;
  }
}
