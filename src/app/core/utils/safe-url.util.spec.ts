import { isBlobUrl, isSafeImageUrl, resolveQrImageSrc } from './safe-url.util';

describe('safe-url.util', () => {
  describe('isSafeImageUrl', () => {
    it('acepta data URL de imagen raster', () => {
      expect(isSafeImageUrl('data:image/png;base64,AAAA')).toBe(true);
      expect(isSafeImageUrl('data:image/jpeg;base64,AAAA')).toBe(true);
    });

    it('acepta http(s)', () => {
      expect(isSafeImageUrl('https://cdn.x.com/qr.png')).toBe(true);
      expect(isSafeImageUrl('http://x.com/qr.png')).toBe(true);
    });

    it('rechaza esquemas peligrosos y svg', () => {
      expect(isSafeImageUrl('javascript:alert(1)')).toBe(false);
      expect(isSafeImageUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(isSafeImageUrl('data:image/svg+xml;base64,AAAA')).toBe(false);
      expect(isSafeImageUrl('')).toBe(false);
      expect(isSafeImageUrl(null)).toBe(false);
    });
  });

  describe('isBlobUrl', () => {
    it('acepta solo blob:', () => {
      expect(isBlobUrl('blob:http://localhost/abc')).toBe(true);
      expect(isBlobUrl('https://x.com/a.pdf')).toBe(false);
      expect(isBlobUrl(null)).toBe(false);
    });
  });

  describe('resolveQrImageSrc', () => {
    it('envuelve base64 pelado como PNG', () => {
      expect(resolveQrImageSrc('AAAABBBB')).toBe('data:image/png;base64,AAAABBBB');
    });

    it('respeta http y data válidos', () => {
      expect(resolveQrImageSrc('https://x.com/q.png')).toBe('https://x.com/q.png');
      expect(resolveQrImageSrc('data:image/png;base64,ZZ')).toBe('data:image/png;base64,ZZ');
    });

    it('descarta data peligroso', () => {
      expect(resolveQrImageSrc('data:text/html,<script>')).toBeNull();
      expect(resolveQrImageSrc(null)).toBeNull();
    });
  });
});
