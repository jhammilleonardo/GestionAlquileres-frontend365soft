import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { X } from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-dialog',
  imports: [LucideAngularModule],
  template: `
    @if (open()) {
      <div class="app-dialog" role="presentation" (click)="backdropClick()">
        <section
          class="app-dialog__panel"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="title()"
          (click)="$event.stopPropagation()"
        >
          <header class="app-dialog__header">
            <h2>{{ title() }}</h2>
            <button
              class="app-dialog__close"
              type="button"
              [attr.aria-label]="closeLabel()"
              (click)="closed.emit()"
            >
              <lucide-icon [img]="XIcon" [size]="20"></lucide-icon>
            </button>
          </header>

          <div class="app-dialog__body">
            <ng-content />
          </div>

          @if (showFooter()) {
            <footer class="app-dialog__footer">
              <ng-content select="[dialog-actions]" />
            </footer>
          }
        </section>
      </div>
    }
  `,
  styles: `
    .app-dialog {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: grid;
      place-items: center;
      padding: 1.5rem;
      background: rgb(15 23 42 / 62%);
    }

    .app-dialog__panel {
      display: grid;
      grid-template-rows: auto minmax(0, 1fr) auto;
      inline-size: min(100%, var(--app-dialog-width, 800px));
      max-block-size: min(90vh, 860px);
      overflow: hidden;
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-xl);
      background: var(--app-color-surface);
      box-shadow: var(--app-shadow-xl);
    }

    .app-dialog__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--app-color-border);
    }

    .app-dialog__header h2 {
      margin: 0;
      color: var(--app-color-text);
      font-size: 1.25rem;
      font-weight: 750;
    }

    .app-dialog__close {
      display: inline-flex;
      width: 2.25rem;
      height: 2.25rem;
      align-items: center;
      justify-content: center;
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: var(--app-color-text-muted);
      cursor: pointer;
    }

    .app-dialog__close:hover {
      background: var(--app-color-surface-muted);
      color: var(--app-color-text);
    }

    .app-dialog__body {
      overflow: auto;
      padding: 1.5rem;
    }

    .app-dialog__footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--app-color-border);
    }

    @media (max-width: 640px) {
      .app-dialog {
        padding: 0.75rem;
      }

      .app-dialog__header,
      .app-dialog__body,
      .app-dialog__footer {
        padding-inline: 1rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppDialogComponent {
  readonly open = input(false);
  readonly title = input('');
  readonly closeOnBackdrop = input(true);
  readonly closeLabel = input('Cerrar');
  readonly showFooter = input(true);
  readonly closed = output<void>();

  protected readonly XIcon = X;

  protected backdropClick(): void {
    if (this.closeOnBackdrop()) {
      this.closed.emit();
    }
  }
}
