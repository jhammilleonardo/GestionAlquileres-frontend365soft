import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { AppDialogComponent } from '../../../../shared/ui/dialog/dialog.component';

@Component({
  selector: 'app-violation-resolve-dialog',
  standalone: true,
  imports: [TranslocoModule, AppButtonComponent, AppDialogComponent],
  templateUrl: './violation-resolve-dialog.component.html',
  styleUrl: '../../violations.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViolationResolveDialogComponent {
  readonly open = input.required<boolean>();
  readonly notes = input.required<string>();

  readonly closed = output<void>();
  readonly confirmed = output<void>();
  readonly notesChanged = output<string>();

  textareaValue(event: Event): string {
    return event.target instanceof HTMLTextAreaElement ? event.target.value : '';
  }
}
