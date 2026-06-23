import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Pipe({
  name: 'safe',
  standalone: true,
})
export class SafePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(url: string, type: string): SafeResourceUrl | string {
    if (type === 'resourceUrl') {
      if (!this.isAllowedResourceUrl(url)) {
        return '';
      }
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
    return url;
  }

  private isAllowedResourceUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' && parsed.hostname === 'www.openstreetmap.org';
    } catch {
      return false;
    }
  }
}
