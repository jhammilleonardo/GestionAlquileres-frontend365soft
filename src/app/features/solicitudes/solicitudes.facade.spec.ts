import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { SolicitudesFacade } from './solicitudes.facade';
import { ApplicationService } from '../../core/services/admin/application.service';
import { ApplicationListItem, ApplicationStatus } from '../../core/models/application.model';

/** Construye un ApplicationListItem mínimo para tests. */
function buildApp(
  id: number,
  status: ApplicationStatus,
  overrides: Partial<{ full_name: string; email: string; property: string }> = {},
): ApplicationListItem {
  return {
    id,
    property_id: 1,
    applicant_id: 1,
    status,
    personal_data: {
      phone: '',
      full_name: overrides.full_name ?? 'Juan Pérez',
      current_address: '',
      identity_document: '',
    },
    employment_data: {
      position: '',
      employer_name: '',
      employer_phone: '',
      monthly_income: 0,
      employment_duration: '',
    },
    rental_history: [],
    references: [],
    documents: [],
    additional_notes: null,
    admin_feedback: null,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    property_title: overrides.property ?? 'Casa Central',
    applicant_name: overrides.full_name ?? 'Juan Pérez',
    applicant_email: overrides.email ?? 'juan@mail.com',
  } as ApplicationListItem;
}

describe('SolicitudesFacade', () => {
  let getAllApplications: ReturnType<typeof vi.fn>;

  function setup(): SolicitudesFacade {
    TestBed.configureTestingModule({
      providers: [
        SolicitudesFacade,
        { provide: ApplicationService, useValue: { getAllApplications } },
      ],
    });
    return TestBed.inject(SolicitudesFacade);
  }

  beforeEach(() => {
    getAllApplications = vi.fn();
  });

  it('carga las solicitudes y calcula métricas por estado', () => {
    getAllApplications.mockReturnValue(
      of([
        buildApp(1, ApplicationStatus.PENDIENTE),
        buildApp(2, ApplicationStatus.PENDIENTE),
        buildApp(3, ApplicationStatus.APROBADA),
        buildApp(4, ApplicationStatus.RECHAZADA),
      ]),
    );

    const facade = setup();
    facade.loadApplications();

    expect(facade.loading()).toBe(false);
    expect(facade.metrics()).toEqual({
      total: 4,
      pendientes: 2,
      aprobadas: 1,
      rechazadas: 1,
    });
  });

  it('expone el error cuando la carga falla', () => {
    getAllApplications.mockReturnValue(throwError(() => ({ message: 'fallo de red' })));

    const facade = setup();
    facade.loadApplications();

    expect(facade.loading()).toBe(false);
    expect(facade.error()).toBe('fallo de red');
  });

  it('filtra por estado seleccionado', () => {
    getAllApplications.mockReturnValue(
      of([buildApp(1, ApplicationStatus.PENDIENTE), buildApp(2, ApplicationStatus.APROBADA)]),
    );

    const facade = setup();
    facade.loadApplications();
    facade.selectedStatus.set(ApplicationStatus.APROBADA);

    expect(facade.filteredApplications()).toHaveLength(1);
    expect(facade.filteredApplications()[0].id).toBe(2);
  });

  it('filtra por término de búsqueda en nombre, email o propiedad', () => {
    getAllApplications.mockReturnValue(
      of([
        buildApp(1, ApplicationStatus.PENDIENTE, { full_name: 'Ana López' }),
        buildApp(2, ApplicationStatus.PENDIENTE, { full_name: 'Beto Ruiz', email: 'beto@x.com' }),
      ]),
    );

    const facade = setup();
    facade.loadApplications();
    facade.searchTerm.set('beto');

    expect(facade.filteredApplications()).toHaveLength(1);
    expect(facade.filteredApplications()[0].id).toBe(2);
  });

  it('clearSearch reinicia el término de búsqueda', () => {
    getAllApplications.mockReturnValue(of([]));
    const facade = setup();
    facade.searchTerm.set('algo');
    facade.clearSearch();
    expect(facade.searchTerm()).toBe('');
  });
});
