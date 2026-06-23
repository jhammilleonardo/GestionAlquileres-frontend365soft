import { sanitizePhoneInput } from './input-sanitizers';

describe('sanitizePhoneInput', () => {
  it('debe eliminar las letras', () => {
    expect(sanitizePhoneInput('gsdgsd123')).toBe('123');
  });

  it('debe conservar dígitos, espacios, guiones y paréntesis', () => {
    expect(sanitizePhoneInput('(591) 700-00000')).toBe('(591) 700-00000');
  });

  it('debe conservar el + solo como prefijo', () => {
    expect(sanitizePhoneInput('+591 70000000')).toBe('+591 70000000');
    expect(sanitizePhoneInput('591+700')).toBe('591700');
  });

  it('debe devolver cadena vacía si no hay caracteres válidos', () => {
    expect(sanitizePhoneInput('abc')).toBe('');
  });
});
