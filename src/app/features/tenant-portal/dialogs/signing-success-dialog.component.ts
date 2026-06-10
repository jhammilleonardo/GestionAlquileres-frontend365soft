import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { CheckCircle } from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';
import { Contract } from '../../../core/services/tenant/tenant-contract.service';
import { AppButtonComponent, AppDialogComponent } from '../../../shared/ui';

@Component({
  selector: 'app-signing-success-dialog',
  standalone: true,
  imports: [LucideAngularModule, TranslocoModule, AppButtonComponent, AppDialogComponent],
  template: `
    <app-dialog
      [open]="open()"
      [title]="'public.signingSuccess.title' | transloco"
      [closeOnBackdrop]="false"
      (closed)="closed.emit()"
    >
      <div class="success-content">
        <div class="success-icon">
          <lucide-icon [img]="CheckCircle" [size]="58"></lucide-icon>
        </div>

        <p class="success-message">{{ 'public.signingSuccess.message' | transloco }}</p>

        <div class="success-details">
          <p>{{ 'public.signingSuccess.storageMessage' | transloco }}</p>
        </div>
      </div>

      <div dialog-actions>
        <app-button appearance="primary" (clicked)="closed.emit()">
          {{ 'public.signingSuccess.understood' | transloco }}
        </app-button>
      </div>
    </app-dialog>
  `,
  styles: `
    :host {
      --app-dialog-width: 460px;
    }

    .success-content {
      display: grid;
      justify-items: center;
      gap: var(--app-space-4);
      text-align: center;
    }

    .success-icon {
      display: inline-grid;
      place-items: center;
      inline-size: 5rem;
      block-size: 5rem;
      border-radius: 50%;
      background: var(--tui-status-positive);
      color: #fff;
    }

    .success-message {
      max-inline-size: 28rem;
      margin: 0;
      color: var(--app-color-text-muted);
      line-height: 1.6;
    }

    .success-details {
      border-radius: var(--app-radius-md);
      background: var(--tui-status-positive-pale);
      color: var(--tui-status-positive);
      padding: var(--app-space-3);
      text-align: start;
    }

    .success-details p {
      margin: 0;
      line-height: 1.5;
    }

    [dialog-actions] {
      display: flex;
      justify-content: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SigningSuccessDialogComponent {
  readonly open = input(false);
  readonly contract = input<Contract | null>(null);
  readonly closed = output<void>();

  protected readonly CheckCircle = CheckCircle;
}
