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
});
