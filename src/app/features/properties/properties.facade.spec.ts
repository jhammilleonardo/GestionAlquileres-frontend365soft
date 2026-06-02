import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  Property,
  PropertyStatus,
  PropertySubtype,
  PropertyType,
} from '../../core/models/property.model';
import { PropertyService } from '../../core/services/admin/property.service';
import { SlugService } from '../../core/services/slug.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { PropertiesFacade } from './properties.facade';

describe('PropertiesFacade', () => {
  let propertyService: {
    getAdminProperties: ReturnType<typeof vi.fn>;
    getPropertyTypes: ReturnType<typeof vi.fn>;
    getPropertySubtypes: ReturnType<typeof vi.fn>;
    getAdminPropertyById: ReturnType<typeof vi.fn>;
    createProperty: ReturnType<typeof vi.fn>;
    updateProperty: ReturnType<typeof vi.fn>;
    uploadPropertyImage: ReturnType<typeof vi.fn>;
    deleteProperty: ReturnType<typeof vi.fn>;
    updatePropertyStatus: ReturnType<typeof vi.fn>;
  };
  let toast: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    warning: ReturnType<typeof vi.fn>;
  };
  let router: {
    navigate: ReturnType<typeof vi.fn>;
  };

  function setup(): PropertiesFacade {
    TestBed.configureTestingModule({
      providers: [
        PropertiesFacade,
        { provide: PropertyService, useValue: propertyService },
        { provide: ToastService, useValue: toast },
        { provide: SlugService, useValue: { getSlug: () => 'demo' } },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: { queryParams: of({}) },
        },
      ],
    });
    return TestBed.inject(PropertiesFacade);
  }

  beforeEach(() => {
    propertyService = {
      getAdminProperties: vi.fn(() => of([makeProperty(1)])),
      getPropertyTypes: vi.fn(() => of<PropertyType[]>([{ id: 1, name: 'Casa' }])),
      getPropertySubtypes: vi.fn(() =>
        of<PropertySubtype[]>([
          { id: 10, name: 'Casa familiar', property_type_id: 1 },
          { id: 20, name: 'Monoambiente', property_type_id: 2 },
        ]),
      ),
      getAdminPropertyById: vi.fn(() => of(makeProperty(1))),
      createProperty: vi.fn(() => of(makeProperty(2))),
      updateProperty: vi.fn(() => of(makeProperty(1))),
      uploadPropertyImage: vi.fn(() => of({})),
      deleteProperty: vi.fn(() => of({})),
      updatePropertyStatus: vi.fn(() => of({})),
    };
    toast = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    };
    router = {
      navigate: vi.fn(),
    };
  });

  it('carga propiedades, tipos y subtipos al inicializar', () => {
    const facade = setup();

    expect(propertyService.getAdminProperties).toHaveBeenCalled();
    expect(propertyService.getPropertyTypes).toHaveBeenCalled();
    expect(propertyService.getPropertySubtypes).toHaveBeenCalled();
    expect(facade.properties()).toHaveLength(1);
    expect(facade.propertyTypeOptions()).toEqual([{ value: 1, label: 'Casa' }]);
  });

  it('aplica y limpia filtros de estado y tipo', () => {
    const facade = setup();
    propertyService.getAdminProperties.mockClear();

    facade.setStatusFilter(PropertyStatus.OCUPADO);
    expect(facade.filters.status).toBe(PropertyStatus.OCUPADO);
    expect(propertyService.getAdminProperties).toHaveBeenCalledWith(
      expect.objectContaining({ status: PropertyStatus.OCUPADO }),
    );

    facade.setPropertyTypeFilter(1);
    expect(facade.filters.property_type_id).toBe(1);

    facade.clearFilters();
    expect(facade.filters.status).toBeUndefined();
    expect(facade.filters.property_type_id).toBeUndefined();
  });

  it('filtra subtipos por tipo de propiedad y limpia subtipo cuando corresponde', () => {
    const facade = setup();
    facade.propertyForm.patchValue({ property_subtype_id: 20 });

    facade.onPropertyTypeChange(1);

    expect(facade.propertySubtypeOptions()).toEqual([{ value: 10, label: 'Casa familiar' }]);
    expect(facade.propertyForm.get('property_subtype_id')?.value).toBe('');
  });

  it('crea propiedad valida y recarga el listado', () => {
    const facade = setup();
    propertyService.getAdminProperties.mockClear();
    facade.openCreateModal();
    patchValidPropertyForm(facade);

    facade.saveProperty();

    expect(propertyService.createProperty).toHaveBeenCalled();
    expect(propertyService.getAdminProperties).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Propiedad creada exitosamente');
    expect(facade.isSubmitting()).toBe(false);
  });

  it('actualiza propiedad existente', () => {
    const facade = setup();
    facade.openEditModal(makeProperty(1));
    patchValidPropertyForm(facade);

    facade.saveProperty();

    expect(propertyService.updateProperty).toHaveBeenCalledWith(1, expect.any(Object));
    expect(toast.success).toHaveBeenCalledWith('Propiedad actualizada exitosamente');
  });

  it('muestra errores cuando el formulario es invalido', () => {
    const facade = setup();
    facade.openCreateModal();
    facade.propertyForm.patchValue({ title: '' });

    facade.saveProperty();

    expect(propertyService.createProperty).not.toHaveBeenCalled();
    expect(facade.validationErrors().length).toBeGreaterThan(0);
  });

  it('borra propiedad confirmada y recarga', () => {
    const facade = setup();
    propertyService.getAdminProperties.mockClear();
    facade.deleteProperty(makeProperty(1));

    facade.confirmDelete();

    expect(propertyService.deleteProperty).toHaveBeenCalledWith(1);
    expect(propertyService.getAdminProperties).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Propiedad eliminada exitosamente');
  });

  it('activa o desactiva una propiedad', () => {
    const facade = setup();

    facade.toggleStatus({ ...makeProperty(1), active: true });

    expect(propertyService.updatePropertyStatus).toHaveBeenCalledWith(
      1,
      PropertyStatus.INACTIVO,
      false,
    );
    expect(toast.success).toHaveBeenCalledWith('Propiedad desactivada');
  });

  it('notifica errores al cargar propiedades', () => {
    propertyService.getAdminProperties.mockReturnValue(throwError(() => new Error('fail')));

    const facade = setup();

    expect(facade.isListLoading()).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('Error al cargar las propiedades');
  });
});

function makeProperty(id: number): Property {
  return {
    id,
    title: `Propiedad ${id}`,
    property_type_id: 1,
    property_subtype_id: 10,
    status: PropertyStatus.DISPONIBLE,
    active: true,
    monthly_rent: 1000,
    currency: 'BOB',
    addresses: [
      {
        address_type: 'address_1',
        street_address: 'Calle 1',
        city: 'La Paz',
        country: 'BO',
      },
    ],
  };
}

function patchValidPropertyForm(facade: PropertiesFacade): void {
  facade.propertyForm.patchValue({
    title: 'Casa Central',
    property_type_id: 1,
    property_subtype_id: 10,
    monthly_rent: 1500,
    currency: 'BOB',
  });
  facade.propertyForm.get('addresses')?.patchValue([
    {
      address_type: 'address_1',
      street_address: 'Av. Siempre Viva',
      city: 'La Paz',
      country: 'BO',
    },
  ]);
}
