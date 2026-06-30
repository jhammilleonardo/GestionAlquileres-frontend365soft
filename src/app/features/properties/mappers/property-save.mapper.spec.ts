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

  it('no manda campos no soportados por PATCH y conserva valores numéricos en cero', () => {
    const result = buildPropertySavePayloads({
      title: 'Departamento',
      property_type_id: 1,
      property_subtype_id: 2,
      rental_type: 'LONG_TERM',
      monthly_rent: '0',
      price_per_night: '100',
      security_deposit_amount: 0,
      bedrooms: 0,
      bathrooms: '0',
      latitude: 0,
      longitude: '0',
      addresses: [
        {
          street_address: 'Calle 1',
          city: 'La Paz',
          state: 'La Paz',
          country: 'BO',
        },
      ],
    });

    expect(result.createDto).toMatchObject({
      monthly_rent: 0,
      security_deposit_amount: 0,
      bedrooms: 0,
      bathrooms: 0,
      latitude: 0,
      longitude: 0,
    });
    expect(result.updateDto).toMatchObject({
      monthly_rent: 0,
      security_deposit_amount: 0,
      bedrooms: 0,
      bathrooms: 0,
      latitude: 0,
      longitude: 0,
    });
    expect(result.updateDto).not.toHaveProperty('new_owners');
    expect(result.updateDto).not.toHaveProperty('rental_type');
    expect(result.updateDto).not.toHaveProperty('price_per_night');
    expect(result.createDto).not.toHaveProperty('price_per_night');
    expect(result.createDto).not.toHaveProperty('deposit_to_confirm_pct');
  });

  it('en corto plazo sólo manda precio por noche y configuración básica de reserva', () => {
    const result = buildPropertySavePayloads({
      title: 'Alojamiento temporal',
      property_type_id: 1,
      property_subtype_id: 2,
      rental_type: 'SHORT_TERM',
      monthly_rent: '2000',
      price_per_night: '250',
      min_lease_months: '12',
      max_occupants: '4',
      deposit_to_confirm_pct: '30',
      checkin_time: '15:00',
      checkout_time: '11:00',
      cleaning_fee: '50',
      weekly_discount_pct: '10',
      advance_notice_days: '2',
      addresses: [
        {
          street_address: 'Calle 1',
          city: 'La Paz',
          state: 'La Paz',
          country: 'BO',
        },
      ],
    });

    expect(result.createDto).toMatchObject({
      rental_type: 'SHORT_TERM',
      price_per_night: 250,
      deposit_to_confirm_pct: 30,
      checkin_time: '15:00',
      checkout_time: '11:00',
      property_rules: {
        max_occupants: 4,
      },
    });
    expect(result.createDto).not.toHaveProperty('monthly_rent');
    expect(result.createDto.property_rules).not.toHaveProperty('min_lease_months');
    expect(result.createDto).not.toHaveProperty('cleaning_fee');
    expect(result.createDto).not.toHaveProperty('weekly_discount_pct');
    expect(result.createDto).not.toHaveProperty('advance_notice_days');
    expect(result.updateDto).toMatchObject({
      deposit_to_confirm_pct: 30,
      checkin_time: '15:00',
      checkout_time: '11:00',
    });
  });
});
