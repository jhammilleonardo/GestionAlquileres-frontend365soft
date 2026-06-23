/**
 * Saneadores de entrada para usarse con `inputFilter` de `app-text-field`.
 *
 * Bloquean caracteres inválidos mientras el usuario escribe (también al pegar),
 * en vez de solo marcar el campo como inválido después.
 */

/**
 * Mantiene solo caracteres válidos de teléfono: dígitos, `+`, espacios, guiones
 * y paréntesis. El `+` solo se permite al inicio.
 */
export function sanitizePhoneInput(value: string): string {
  const cleaned = value.replace(/[^\d\s()+-]/g, '');

  // El `+` solo tiene sentido como prefijo internacional: lo conservamos si está
  // al inicio y eliminamos cualquier otro.
  const hasLeadingPlus = cleaned.startsWith('+');
  const withoutPlus = cleaned.replace(/\+/g, '');

  return hasLeadingPlus ? `+${withoutPlus}` : withoutPlus;
}
