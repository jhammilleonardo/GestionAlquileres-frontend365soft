import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslocoService } from '@jsverse/transloco';

import { PaymentService } from './payment.service';
import { SlugService } from '../slug.service';
import { environment } from '../../../../environments/environment';

describe('PaymentService', () => {
  let service: PaymentService;
  let httpMock: HttpTestingController;

  const baseUrl = `${environment.apiUrl}acme/admin/payments`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PaymentService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SlugService, useValue: { buildApiEndpoint: (p: string) => `acme/${p}` } },
        { provide: TranslocoService, useValue: { translate: (k: string) => k } },
      ],
    });
    service = TestBed.inject(PaymentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.match(() => true).forEach((r) => r.flush({}));
    httpMock.verify();
  });

  it('loadPayments normaliza montos string a número', () => {
    service.loadPayments();

    const req = httpMock.expectOne((r) => r.url === baseUrl);
    req.flush({
      payments: [
        { id: 1, amount: '1500.50', processor_fee: '20.00' },
        { id: 2, amount: 800, processor_fee: undefined },
      ],
      total: 2,
      page: 1,
      limit: 50,
    });

    const payments = service.payments();
    expect(payments).toHaveLength(2);
    expect(payments[0].amount).toBe(1500.5);
    expect(payments[0].processor_fee).toBe(20);
    expect(payments[1].amount).toBe(800);
    expect(payments[1].processor_fee).toBeUndefined();
  });

  it('loadPayments deja la lista vacía y marca error si falla', () => {
    service.loadPayments();
    const req = httpMock.expectOne((r) => r.url === baseUrl);
    req.flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });

    expect(service.payments()).toEqual([]);
    expect(service.error()).toBeTruthy();
  });

  it('getPayment normaliza el monto del pago individual', () => {
    let amount = 0;
    service.getPayment(5).subscribe((p) => (amount = p.amount));

    const req = httpMock.expectOne(`${baseUrl}/5`);
    req.flush({ id: 5, amount: '999.99' });

    expect(amount).toBe(999.99);
  });

  it('getProofUrl devuelve null si no hay comprobante', () => {
    expect(service.getProofUrl({ proof_file: undefined } as never)).toBeNull();
  });

  it('getProofUrl respeta URLs absolutas', () => {
    const url = service.getProofUrl({ proof_file: 'https://cdn.x/comprobante.png' } as never);
    expect(url).toBe('https://cdn.x/comprobante.png');
  });
});
