import { describe, expect, it } from 'vitest';

import { buildPropertySavePayloads } from './property-save.mapper';

describe('buildPropertySavePayloads', () => {
  it('normaliza el formulario de propiedad para crear y actualizar', () => {
    const result = buildPropertySavePayloads({
      title: 'Casa Central',
      description: 'Propiedad principal',
      property_type_id: '1',
      property_subtype_id: '2',
      monthly_rent: '1500',
      currency: 'BOB',
      square_meters: '120',
      bedrooms: '3',
      pets_allowed: true,
      max_occupants: '5',
      addresses: [
        {
          address_type: 'address_1',
          street_address: 'Av. Siempre Viva 123',
          city: 'Santa Cruz',
          country: 'BO',
        },
      ],
      new_owners: [
        {
          name: 'Owner Uno',
          primary_email: 'owner@example.com',
          phone_number: '70000000',
          ownership_percentage: 100,
          is_primary: true,
        },
      ],
    });

    expect(result.createDto).toMatchObject({
      title: 'Casa Central',
      description: 'Propiedad principal',
      property_type_id: 1,
      property_subtype_id: 2,
      monthly_rent: 1500,
      currency: 'BOB',
      square_meters: 120,
      bedrooms: 3,
      property_rules: {
        pets_allowed: true,
        max_occupants: 5,
      },
    });
    expect(result.createDto.addresses).toHaveLength(1);
    expect(result.createDto.new_owners).toHaveLength(1);
    expect(result.updateDto).not.toHaveProperty('new_owners');
  });

  it('ignora propietarios incompletos', () => {
    const result = buildPropertySavePayloads({
      title: 'Sin owner valido',
      property_type_id: 1,
      property_subtype_id: 2,
      addresses: [
        {
          street_address: 'Calle 1',
          city: 'La Paz',
          country: 'BO',
        },
      ],
      new_owners: [
        {
          name: 'Owner incompleto',
          primary_email: '',
          phone_number: '',
        },
      ],
    });

    expect(result.createDto.new_owners).toBeUndefined();
  });
});
