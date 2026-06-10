import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FileDownloadService } from './file-download.service';

describe('FileDownloadService', () => {
  let service: FileDownloadService;
  let clickSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileDownloadService);
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  it('downloads a url with the provided filename', () => {
    service.downloadUrl('https://example.test/file.pdf', 'file.pdf');

    expect(clickSpy).toHaveBeenCalled();
  });

  it('downloads a blob and releases the object url', () => {
    const objectUrl = 'blob:test';
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(objectUrl);
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    service.downloadBlob(new Blob(['test']), 'test.txt');

    expect(clickSpy).toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalledWith(objectUrl);
  });

  it('opens a blob in a new tab when the browser allows it', () => {
    vi.useFakeTimers();
    const objectUrl = 'blob:pdf';
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(objectUrl);
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const openSpy = vi.spyOn(window, 'open').mockReturnValue({} as Window);

    const opened = service.openBlob(new Blob(['pdf']));

    expect(opened).toBe(true);
    expect(openSpy).toHaveBeenCalledWith(objectUrl, '_blank');

    vi.advanceTimersByTime(60_000);
    expect(revokeSpy).toHaveBeenCalledWith(objectUrl);
    vi.useRealTimers();
  });

  it('reports a blocked popup and releases the object url', () => {
    const objectUrl = 'blob:blocked';
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(objectUrl);
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(window, 'open').mockReturnValue(null);

    const opened = service.openBlob(new Blob(['pdf']));

    expect(opened).toBe(false);
    expect(revokeSpy).toHaveBeenCalledWith(objectUrl);
  });
});
