import { TestBed } from '@angular/core/testing';
import { FormDraftService } from './form-draft.service';

describe('FormDraftService', () => {
  let service: FormDraftService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [FormDraftService] });
    service = TestBed.inject(FormDraftService);
    localStorage.clear();
    sessionStorage.clear();
  });

  it('debe guardar y recuperar un borrador en localStorage por defecto', () => {
    service.save('draft_1', { name: 'Ana', count: 2 });

    expect(service.load<{ name: string; count: number }>('draft_1')).toEqual({
      name: 'Ana',
      count: 2,
    });
  });

  it('debe aislar los borradores por tipo de almacenamiento', () => {
    service.save('draft_1', { value: 'local' }, 'local');
    service.save('draft_1', { value: 'session' }, 'session');

    expect(service.load<{ value: string }>('draft_1', 'local')).toEqual({ value: 'local' });
    expect(service.load<{ value: string }>('draft_1', 'session')).toEqual({ value: 'session' });
  });

  it('debe retornar null cuando no existe el borrador', () => {
    expect(service.load('inexistente')).toBeNull();
  });

  it('debe descartar y limpiar un borrador corrupto', () => {
    localStorage.setItem('draft_1', '{ no es json válido');

    expect(service.load('draft_1')).toBeNull();
    expect(localStorage.getItem('draft_1')).toBeNull();
  });

  it('debe eliminar un borrador al limpiarlo', () => {
    service.save('draft_1', { a: 1 });
    service.clear('draft_1');

    expect(service.load('draft_1')).toBeNull();
  });
});
