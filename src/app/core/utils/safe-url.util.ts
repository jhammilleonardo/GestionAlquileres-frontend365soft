/**
 * Whitelist estricta de URLs antes de confiarlas con `bypassSecurityTrust*`.
 *
 * Confiar una URL sin validar su esquema es una vía de XSS (`javascript:`,
 * `data:text/html`, etc.). Estas funciones acotan lo permitido a imágenes raster
 * en `data:` y a http(s); el resto se descarta para que el llamador muestre un
 * placeholder en vez de confiar contenido arbitrario.
 */

// Imágenes raster en data URL (se excluye svg: puede contener <script>).
const SAFE_IMAGE_DATA_URL = /^data:image\/(png|jpe?g|gif|webp|bmp);base64,/i;

/** ¿Es una URL de imagen segura para usar como `[src]` confiable? */
export function isSafeImageUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  if (SAFE_IMAGE_DATA_URL.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** ¿Es una object URL local (`blob:`) creada por la propia app? */
export function isBlobUrl(value: string | null | undefined): value is string {
  return !!value && /^blob:/i.test(value);
}

/**
 * Normaliza el campo `qr_image` del backend a un src de imagen seguro: acepta
 * http(s) o `data:`; si viene base64 “pelado” lo envuelve como PNG. Devuelve
 * null si el resultado no pasa la whitelist.
 */
export function resolveQrImageSrc(qrImage: string | null | undefined): string | null {
  if (!qrImage) return null;
  const candidate =
    qrImage.startsWith('http') || qrImage.startsWith('data:')
      ? qrImage
      : `data:image/png;base64,${qrImage}`;
  return isSafeImageUrl(candidate) ? candidate : null;
}
