import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'sanitizedHtml',
  standalone: true,
})
export class SanitizedHtmlPipe implements PipeTransform {
  constructor(private readonly sanitizer: DomSanitizer) {}

  transform(value: string | null | undefined): string {
    if (!value) return '';
    return this.sanitizer.sanitize(SecurityContext.HTML, value) ?? '';
  }
}
