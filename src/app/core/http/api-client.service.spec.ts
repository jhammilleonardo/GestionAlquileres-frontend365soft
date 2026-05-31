import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../../environments/environment';
import { ApiClientService } from './api-client.service';

describe('ApiClientService', () => {
  let service: ApiClientService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ApiClientService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('construye URLs relativas desde environment.apiUrl', () => {
    service.get<{ ok: boolean }>('/health').subscribe((response) => {
      expect(response).toEqual({ ok: true });
    });

    const req = httpMock.expectOne(`${environment.apiUrl}health`);
    expect(req.request.method).toBe('GET');
    req.flush({ ok: true });
  });

  it('respeta URLs absolutas sin anteponer environment.apiUrl', () => {
    service.get<{ ok: boolean }>('https://api.example.com/ping').subscribe((response) => {
      expect(response.ok).toBe(true);
    });

    const req = httpMock.expectOne('https://api.example.com/ping');
    expect(req.request.method).toBe('GET');
    req.flush({ ok: true });
  });

  it('serializa query params y omite valores vacios', () => {
    service
      .get<{ data: unknown[] }>('/demo/admin/payments', {
        params: {
          status: 'APPROVED',
          page: 2,
          includeReceipts: true,
          tags: ['rent', 'late'],
          empty: '',
          missing: null,
        },
      })
      .subscribe((response) => {
        expect(response.data).toEqual([]);
      });

    const req = httpMock.expectOne(
      (request) => request.url === `${environment.apiUrl}demo/admin/payments`,
    );

    expect(req.request.params.get('status')).toBe('APPROVED');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('includeReceipts')).toBe('true');
    expect(req.request.params.getAll('tags')).toEqual(['rent', 'late']);
    expect(req.request.params.has('empty')).toBe(false);
    expect(req.request.params.has('missing')).toBe(false);
    req.flush({ data: [] });
  });

  it('agrega Content-Type JSON para cuerpos planos', () => {
    service
      .post<{ id: number }, { name: string }>('/demo/admin/users', { name: 'Ana' })
      .subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}demo/admin/users`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    req.flush({ id: 1 });
  });

  it('no fuerza Content-Type cuando el cuerpo es FormData', () => {
    const formData = new FormData();
    formData.append('file', new File(['demo'], 'demo.txt'));

    service.post<{ ok: boolean }, FormData>('/demo/admin/files', formData).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}demo/admin/files`);
    expect(req.request.headers.has('Content-Type')).toBe(false);
    req.flush({ ok: true });
  });

  it('normaliza mensajes de error del backend', () => {
    let emittedError: unknown;

    service.get('/demo/admin/missing').subscribe({
      error: (error: unknown) => {
        emittedError = error;
      },
    });

    const req = httpMock.expectOne(`${environment.apiUrl}demo/admin/missing`);
    req.flush(
      { message: ['Campo requerido', 'Formato invalido'] },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(emittedError).toBeInstanceOf(Error);
    expect((emittedError as Error).message).toBe('Campo requerido, Formato invalido');
  });

  it('usa mensaje de conexion cuando el backend no responde', () => {
    let emittedError: unknown;

    service.get('/demo/admin/down').subscribe({
      error: (error: unknown) => {
        emittedError = error;
      },
    });

    const req = httpMock.expectOne(`${environment.apiUrl}demo/admin/down`);
    req.flush(null, { status: 0, statusText: 'Unknown Error' });

    expect(emittedError).toBeInstanceOf(Error);
    expect((emittedError as Error).message).toContain('No se pudo conectar');
  });
});
