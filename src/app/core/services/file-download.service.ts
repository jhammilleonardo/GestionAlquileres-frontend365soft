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

  openBlob(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
