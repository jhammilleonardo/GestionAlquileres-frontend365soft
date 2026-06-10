import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FileDownloadService {
  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);

    try {
      this.downloadUrl(url, filename);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  downloadUrl(url: string, filename: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  }

  openBlob(blob: Blob): boolean {
    const url = URL.createObjectURL(blob);
    // No se usa la opción `noopener`: con ella window.open devuelve null
    // aunque la pestaña sí se abra, lo que provocaría un falso "popup bloqueado"
    // y una descarga de respaldo. Se corta la referencia al opener manualmente.
    const openedWindow = window.open(url, '_blank');

    if (!openedWindow) {
      URL.revokeObjectURL(url);
      return false;
    }

    openedWindow.opener = null;
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return true;
  }
}
