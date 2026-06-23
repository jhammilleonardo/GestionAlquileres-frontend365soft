import { normalizeSocialUrl } from './social-link.util';

describe('normalizeSocialUrl', () => {
  it('convierte usuarios sociales en enlaces externos absolutos', () => {
    expect(normalizeSocialUrl('facebook', 'mi.pagina')).toBe('https://www.facebook.com/mi.pagina');
    expect(normalizeSocialUrl('instagram', '@mi_cuenta')).toBe(
      'https://www.instagram.com/mi_cuenta',
    );
  });

  it('normaliza dominios oficiales y números de WhatsApp', () => {
    expect(normalizeSocialUrl('facebook', 'facebook.com/mi.pagina')).toBe(
      'https://facebook.com/mi.pagina',
    );
    expect(normalizeSocialUrl('whatsapp', '+591 700-00-000')).toBe('https://wa.me/59170000000');
  });

  it('rechaza protocolos peligrosos y dominios que no corresponden', () => {
    expect(normalizeSocialUrl('facebook', 'javascript:alert(1)')).toBeNull();
    expect(normalizeSocialUrl('instagram', 'https://example.com/cuenta')).toBeNull();
  });
});
