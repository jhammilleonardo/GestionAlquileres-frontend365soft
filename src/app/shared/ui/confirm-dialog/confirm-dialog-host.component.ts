import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AlertTriangle, LucideAngularModule } from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';
import { AppDialogComponent } from '../dialog/dialog.component';
import { ConfirmDialogService } from './confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog-host',
  standalone: true,
  imports: [LucideAngularModule, AppDialogComponent, TranslocoModule],
  templateUrl: './confirm-dialog-host.component.html',
  styleUrl: './confirm-dialog-host.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogHostComponent {
  readonly confirmDialog = inject(ConfirmDialogService);
  readonly AlertTriangle = AlertTriangle;
  readonly inputValue = signal('');

  readonly request = this.confirmDialog.request;
  readonly options = computed(() => this.request()?.options ?? null);
  readonly isDanger = computed(() => this.options()?.variant === 'danger');
  readonly inputRequired = computed(() => this.options()?.input?.required ?? false);
  readonly inputInvalid = computed(() => this.inputRequired() && !this.inputValue().trim());

  close(): void {
    this.inputValue.set('');
    this.confirmDialog.resolve(false);
  }

  confirm(): void {
    if (this.inputInvalid()) return;
    const value = this.options()?.input ? this.inputValue().trim() : undefined;
    this.inputValue.set('');
    this.confirmDialog.resolve(true, value);
  }

  onInput(event: Event): void {
    this.inputValue.set((event.target as HTMLTextAreaElement).value);
  }
}
