/**
 * Utilidades de contraste para el color de marca del tenant.
 *
 * El portal usa el color de marca como fondo (hero, CTA, botones). Si el tenant
 * elige un color claro, el texto blanco fijo queda ilegible. Estas funciones
 * eligen automáticamente un color de texto legible (negro/blanco) según la
 * luminancia del fondo, cumpliendo el contraste WCAG AA exigido (ADA).
 */

const NEAR_BLACK = '#111827';
const WHITE = '#ffffff';

/** Parsea `#RRGGBB` (o `#RGB`) a [r,g,b] 0–255; null si no es válido. */
function parseHex(hex: string): [number, number, number] | null {
  const value = hex.trim().replace(/^#/, '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    return null;
  }
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** Luminancia relativa (WCAG 2.x) de un canal 0–255. */
function channelLuminance(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Luminancia relativa de un color hex (0 = negro, 1 = blanco). */
export function relativeLuminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) {
    return 0;
  }
  const [r, g, b] = rgb.map(channelLuminance);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Devuelve el color de texto legible (negro o blanco) sobre un fondo dado,
 * eligiendo el que maximiza el contraste. Para colores inválidos devuelve blanco.
 */
export function readableTextColor(backgroundHex: string): string {
  const luminance = relativeLuminance(backgroundHex);
  // Contraste con blanco vs con negro; elegir el mayor.
  const contrastWithWhite = (1 + 0.05) / (luminance + 0.05);
  const contrastWithBlack = (luminance + 0.05) / (0 + 0.05);
  return contrastWithBlack > contrastWithWhite ? NEAR_BLACK : WHITE;
}
