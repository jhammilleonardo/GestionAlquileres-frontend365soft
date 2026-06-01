import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { CheckCircle2, Clock, FileText, LucideAngularModule, XCircle } from 'lucide-angular';

import { ApplicationMetrics } from '../../applications.facade';

@Component({
  selector: 'app-application-stats',
  standalone: true,
  imports: [TranslocoModule, LucideAngularModule],
  templateUrl: './application-stats.component.html',
  styleUrl: '../../applications.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationStatsComponent {
  readonly metrics = input.required<ApplicationMetrics>();

  readonly FileText = FileText;
  readonly Clock = Clock;
  readonly CheckCircle2 = CheckCircle2;
  readonly XCircle = XCircle;
}
