import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RentalOwnersService } from './rental-owners.service';
import { environment } from '../../../../environments/environment';

describe('RentalOwnersService — liquidaciones y contratos', () => {
  let service: RentalOwnersService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RentalOwnersService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RentalOwnersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('pide las liquidaciones del propietario al endpoint correcto', () => {
    service.getStatements('acme', 9).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}acme/admin/rental-owners/9/statements`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('pide los contratos del propietario al endpoint correcto', () => {
    service.getContracts('acme', 9).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}acme/admin/rental-owners/9/contracts`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
