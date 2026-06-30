import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import { OwnerDetailPanelComponent } from './owner-detail-panel.component';
import { RentalOwnersService } from '../../../../core/services/admin/rental-owners.service';
import { PropertyService } from '../../../../core/services/admin/property.service';
import { SlugService } from '../../../../core/services/slug.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { RentalOwnerSummary } from '../../../../core/models/rental-owner.model';

const owner = {
  id: 9,
  name: 'Carlos',
  primary_email: 'c@mail.com',
  phone_number: '700',
  is_company: false,
  is_active: true,
  properties_count: 0,
  pending_balance: 0,
  has_account: false,
} as RentalOwnerSummary;

describe('OwnerDetailPanelComponent', () => {
  let rentalOwners: {
    getProperties: ReturnType<typeof vi.fn>;
    getStatements: ReturnType<typeof vi.fn>;
    getContracts: ReturnType<typeof vi.fn>;
  };

  function build() {
    rentalOwners = {
      getProperties: vi.fn(() => of([])),
      getStatements: vi.fn(() => of([])),
      getContracts: vi.fn(() => of([])),
    };
    TestBed.configureTestingModule({
      imports: [OwnerDetailPanelComponent],
      providers: [
        { provide: RentalOwnersService, useValue: rentalOwners },
        { provide: PropertyService, useValue: { getAdminProperties: vi.fn(() => of([])) } },
        { provide: SlugService, useValue: { getSlug: () => 'acme' } },
        { provide: ToastService, useValue: { error: vi.fn(), success: vi.fn() } },
        { provide: TranslocoService, useValue: { translate: (k: string) => k } },
      ],
    }).overrideComponent(OwnerDetailPanelComponent, { set: { template: '' } });
    const fixture = TestBed.createComponent(OwnerDetailPanelComponent);
    fixture.componentRef.setInput('owner', owner);
    fixture.detectChanges();
    return fixture;
  }

  it('carga propiedades del propietario al abrir', () => {
    build();
    expect(rentalOwners.getProperties).toHaveBeenCalledWith('acme', 9);
  });

  it('carga liquidaciones solo al entrar a esa pestaña (perezoso)', () => {
    const fixture = build();
    expect(rentalOwners.getStatements).not.toHaveBeenCalled();
    fixture.componentInstance.setTab('statements');
    expect(rentalOwners.getStatements).toHaveBeenCalledWith('acme', 9);
    // No vuelve a pedir si ya cargó.
    fixture.componentInstance.setTab('properties');
    fixture.componentInstance.setTab('statements');
    expect(rentalOwners.getStatements).toHaveBeenCalledTimes(1);
  });

  it('carga contratos solo al entrar a esa pestaña', () => {
    const fixture = build();
    fixture.componentInstance.setTab('contracts');
    expect(rentalOwners.getContracts).toHaveBeenCalledWith('acme', 9);
  });
});
