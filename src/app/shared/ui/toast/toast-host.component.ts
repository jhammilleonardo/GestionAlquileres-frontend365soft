import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { AlertTriangle, CheckCircle2, Info, LucideAngularModule, X, XCircle } from 'lucide-angular';
import { AppToast, ToastService } from './toast.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-toast-host',
  standalone: true,
  imports: [LucideAngularModule, TranslocoModule],
  templateUrl: './toast-host.component.html',
  styleUrl: './toast-host.component.scss',
})
export class ToastHostComponent {
  readonly toastService = inject(ToastService);

  readonly CheckCircle2 = CheckCircle2;
  readonly XCircle = XCircle;
  readonly AlertTriangle = AlertTriangle;
  readonly Info = Info;
  readonly X = X;

  iconFor(toast: AppToast) {
    switch (toast.variant) {
      case 'success':
        return this.CheckCircle2;
      case 'error':
        return this.XCircle;
      case 'warning':
        return this.AlertTriangle;
      default:
        return this.Info;
    }
  }
}
