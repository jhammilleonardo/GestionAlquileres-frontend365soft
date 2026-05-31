import { Injectable, signal } from '@angular/core';

export type ConfirmDialogVariant = 'default' | 'danger';

export interface ConfirmDialogInputOptions {
  label: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  input?: ConfirmDialogInputOptions;
}

export interface ConfirmDialogResult {
  confirmed: boolean;
  value?: string;
}

interface ConfirmDialogRequest {
  id: number;
  options: ConfirmDialogOptions;
  resolve: (result: ConfirmDialogResult) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly activeRequest = signal<ConfirmDialogRequest | null>(null);
  readonly request = this.activeRequest.asReadonly();

  private nextId = 1;

  open(options: ConfirmDialogOptions): Promise<ConfirmDialogResult> {
    this.resolve(false);

    return new Promise<ConfirmDialogResult>((resolve) => {
      this.activeRequest.set({
        id: this.nextId++,
        options,
        resolve,
      });
    });
  }

  async confirm(options: ConfirmDialogOptions): Promise<boolean> {
    const result = await this.open(options);
    return result.confirmed;
  }

  resolve(confirmed: boolean, value?: string): void {
    const request = this.activeRequest();
    if (!request) return;

    this.activeRequest.set(null);
    request.resolve({ confirmed, value });
  }
}
