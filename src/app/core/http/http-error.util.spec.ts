import { describe, it, expect } from 'vitest';
import { HttpErrorResponse } from '@angular/common/http';
import { getApiErrorMessage } from './http-error.util';

describe('getApiErrorMessage', () => {
  it('usa el mensaje de un Error normalizado (ApiClientService)', () => {
    expect(getApiErrorMessage(new Error('Credenciales inválidas'))).toBe('Credenciales inválidas');
  });

  it('extrae message string de un HttpErrorResponse', () => {
    const error = new HttpErrorResponse({ error: { message: 'Pago duplicado' }, status: 409 });
    expect(getApiErrorMessage(error)).toBe('Pago duplicado');
  });

  it('extrae el primer message de un arreglo (validaciones de NestJS)', () => {
    const error = new HttpErrorResponse({
      error: { message: ['email inválido', 'password corto'] },
      status: 400,
    });
    expect(getApiErrorMessage(error)).toBe('email inválido');
  });

  it('acepta un cuerpo de error string', () => {
    const error = new HttpErrorResponse({ error: 'Acceso denegado', status: 403 });
    expect(getApiErrorMessage(error)).toBe('Acceso denegado');
  });

  it('devuelve mensaje de sin conexión cuando status es 0', () => {
    const error = new HttpErrorResponse({ status: 0 });
    expect(getApiErrorMessage(error)).toContain('No se pudo conectar');
  });

  it('usa el fallback cuando el error no aporta información', () => {
    expect(getApiErrorMessage(null, 'Error al cargar')).toBe('Error al cargar');
    expect(getApiErrorMessage({}, 'Error al cargar')).toBe('Error al cargar');
  });

  it('lee objetos planos con forma { message }', () => {
    expect(getApiErrorMessage({ message: 'Sin permisos' })).toBe('Sin permisos');
  });
});
