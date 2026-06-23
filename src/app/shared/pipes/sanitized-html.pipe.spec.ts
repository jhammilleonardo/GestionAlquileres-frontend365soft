import { DomSanitizer } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';

import { SanitizedHtmlPipe } from './sanitized-html.pipe';

describe('SanitizedHtmlPipe', () => {
  let pipe: SanitizedHtmlPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    pipe = new SanitizedHtmlPipe(TestBed.inject(DomSanitizer));
  });

  it('keeps safe html', () => {
    expect(pipe.transform('<strong>Terms</strong>')).toBe('<strong>Terms</strong>');
  });

  it('removes unsafe script content', () => {
    expect(pipe.transform('<img src=x onerror=alert(1)>')).not.toContain('onerror');
  });

  it('returns an empty string for empty values', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });
});
