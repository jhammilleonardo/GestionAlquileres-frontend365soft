import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { Upload } from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-file-upload',
  imports: [LucideAngularModule, TranslocoModule],
  template: `
    <label class="app-file" [class.app-file--disabled]="disabled()">
      <input
        class="app-file__input"
        type="file"
        [accept]="accept()"
        [disabled]="disabled()"
        [multiple]="multiple()"
        (change)="onFilesSelected($event)"
      />

      <span class="app-file__surface">
        <lucide-icon [img]="UploadIcon" [size]="22"></lucide-icon>
        <span class="app-file__text">
          <strong>{{ label() }}</strong>
          @if (hint()) {
            <small>{{ hint() }}</small>
          }
        </span>
      </span>
    </label>

    @if (selectedNames().length > 0) {
      <ul class="app-file__list" [attr.aria-label]="'common.selectedFiles' | transloco">
        @for (name of selectedNames(); track name) {
          <li>{{ name }}</li>
        }
      </ul>
    }
  `,
  styles: `
    :host {
      display: block;
      inline-size: 100%;
    }

    .app-file {
      cursor: pointer;
      display: block;
    }

    .app-file__input {
      block-size: 1px;
      inline-size: 1px;
      opacity: 0;
      position: absolute;
    }

    .app-file__surface {
      align-items: center;
      background: var(--app-color-surface);
      border: 1px dashed var(--app-color-border-strong);
      border-radius: var(--app-radius-lg);
      color: var(--app-color-text-muted);
      display: flex;
      gap: var(--app-space-3);
      min-block-size: 72px;
      padding: var(--app-space-4);
      transition:
        background 0.15s,
        border-color 0.15s,
        color 0.15s;
    }

    .app-file:hover .app-file__surface,
    .app-file__input:focus-visible + .app-file__surface {
      background: var(--app-color-primary-soft);
      border-color: var(--app-color-primary);
      color: var(--app-color-primary);
    }

    .app-file--disabled {
      cursor: not-allowed;
      opacity: 0.62;
    }

    .app-file__text {
      display: grid;
      gap: 2px;
    }

    .app-file__text strong {
      color: var(--app-color-text);
      font-size: 0.875rem;
      font-weight: 700;
    }

    .app-file__text small {
      color: var(--app-color-text-muted);
      font-size: 0.75rem;
    }

    .app-file__list {
      color: var(--app-color-text-muted);
      font-size: 0.8125rem;
      margin: var(--app-space-2) 0 0;
      padding-inline-start: var(--app-space-4);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppFileUploadComponent {
  readonly label = input('Seleccionar archivo');
  readonly hint = input<string | null>(null);
  readonly accept = input<string | null>(null);
  readonly multiple = input(false);
  readonly disabled = input(false);
  readonly filesSelected = output<File[]>();

  protected readonly UploadIcon = Upload;
  protected readonly selectedNames = signal<string[]>([]);

  protected onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    this.selectedNames.set(files.map((file) => file.name));
    this.filesSelected.emit(files);
  }
}
