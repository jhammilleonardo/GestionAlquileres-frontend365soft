import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface AppToast {
  id: number;
  message: string;
  variant: ToastVariant;
  duration: number;
}

export interface ToastOptions {
  variant?: ToastVariant;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly visibleToasts = signal<AppToast[]>([]);
  readonly toasts = this.visibleToasts.asReadonly();
  private nextId = 1;

  show(message: string, options: ToastOptions = {}): number {
    const toast: AppToast = {
      id: this.nextId++,
      message,
      variant: options.variant ?? 'info',
      duration: options.duration ?? 3500,
    };

    this.visibleToasts.update((toasts) => [...toasts, toast]);

    if (toast.duration > 0) {
      window.setTimeout(() => this.dismiss(toast.id), toast.duration);
    }

    return toast.id;
  }

  success(message: string, duration?: number): number {
    return this.show(message, { variant: 'success', duration });
  }

  error(message: string, duration = 5000): number {
    return this.show(message, { variant: 'error', duration });
  }

  warning(message: string, duration?: number): number {
    return this.show(message, { variant: 'warning', duration });
  }

  info(message: string, duration?: number): number {
    return this.show(message, { variant: 'info', duration });
  }

  dismiss(id: number): void {
    this.visibleToasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }
}
