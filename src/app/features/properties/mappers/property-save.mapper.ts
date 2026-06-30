import {
  PropertyFormValue,
  PropertyRulesPayload,
  PropertySavePayload,
} from '../models/property-form.model';

export interface PropertySavePayloads {
  createDto: PropertySavePayload;
  updateDto: Omit<PropertySavePayload, 'new_owners' | 'rental_type' | 'price_per_night'>;
}

export function buildPropertySavePayloads(formValue: PropertyFormValue): PropertySavePayloads {
  const rentalType = formValue.rental_type ?? 'LONG_TERM';
  const supportsShortTerm = rentalType === 'SHORT_TERM' || rentalType === 'BOTH';
  const supportsLongTerm = rentalType === 'LONG_TERM' || rentalType === 'BOTH';
  const propertyTypeId = formValue.property_type_id ? +formValue.property_type_id : 0;
  const propertySubtypeId = formValue.property_subtype_id ? +formValue.property_subtype_id : 0;
  const securityDeposit = toNumberOrUndefined(formValue.security_deposit_amount);
  const monthlyRent = toNumberOrUndefined(formValue.monthly_rent);
  const pricePerNight = toNumberOrUndefined(formValue.price_per_night);
  const squareMeters = toNumberOrUndefined(formValue.square_meters);
  const bedrooms = toNumberOrUndefined(formValue.bedrooms);
  const bathrooms = toNumberOrUndefined(formValue.bathrooms);
  const parkingSpaces = toNumberOrUndefined(formValue.parking_spaces);
  const yearBuilt = toNumberOrUndefined(formValue.year_built);
  const latitude = toNumberOrUndefined(formValue.latitude);
  const longitude = toNumberOrUndefined(formValue.longitude);
  const maxOccupants = toNumberOrUndefined(formValue.max_occupants);
  const minLeaseMonths = toNumberOrUndefined(formValue.min_lease_months);

  const createDto: PropertySavePayload = {
    title: formValue.title ?? '',
    property_type_id: propertyTypeId,
    property_subtype_id: propertySubtypeId,
    addresses: (formValue.addresses ?? []).map((addr) => ({
      address_type: addr.address_type || 'address_1',
      // La calle ya no se escribe a mano. Si el punto del mapa no la rellenó,
      // se compone con Municipio/Departamento/País (el backend la exige no vacía).
      street_address: resolveStreetAddress(addr),
      city: addr.city,
      country: addr.country,
      ...(addr.state ? { state: addr.state } : {}),
      ...(addr.zip_code ? { zip_code: addr.zip_code } : {}),
    })),
  };

  if (formValue.description) createDto.description = formValue.description;
  if (securityDeposit !== undefined) createDto.security_deposit_amount = securityDeposit;
  if (formValue.rental_type) createDto.rental_type = rentalType;
  if (supportsLongTerm && monthlyRent !== undefined) createDto.monthly_rent = monthlyRent;
  if (supportsShortTerm && pricePerNight !== undefined) createDto.price_per_night = pricePerNight;
  if (formValue.currency) createDto.currency = formValue.currency;
  if (squareMeters !== undefined) createDto.square_meters = squareMeters;
  if (bedrooms !== undefined) createDto.bedrooms = bedrooms;
  if (bathrooms !== undefined) createDto.bathrooms = bathrooms;
  if (parkingSpaces !== undefined) createDto.parking_spaces = parkingSpaces;
  if (yearBuilt !== undefined) createDto.year_built = yearBuilt;
  if (formValue.is_furnished !== undefined) createDto.is_furnished = formValue.is_furnished;
  if (latitude !== undefined) createDto.latitude = latitude;
  if (longitude !== undefined) createDto.longitude = longitude;
  if (formValue.amenities?.length) createDto.amenities = formValue.amenities;
  if (formValue.included_items?.length) createDto.included_items = formValue.included_items;

  const propertyRules: PropertyRulesPayload = {};
  if (formValue.pets_allowed !== undefined) propertyRules.pets_allowed = formValue.pets_allowed;
  if (formValue.smoking_allowed !== undefined) {
    propertyRules.smoking_allowed = formValue.smoking_allowed;
  }
  if (maxOccupants !== undefined) propertyRules.max_occupants = maxOccupants;
  if (supportsLongTerm && minLeaseMonths !== undefined) {
    propertyRules.min_lease_months = minLeaseMonths;
  }
  if (Object.keys(propertyRules).length > 0) createDto.property_rules = propertyRules;

  const validOwners = (formValue.new_owners ?? []).filter(
    (owner) => owner.name && owner.primary_email && owner.phone_number,
  );
  if (validOwners.length > 0) createDto.new_owners = validOwners;

  if (supportsShortTerm) {
    assignShortTermConfig(createDto, formValue);
  }

  const {
    new_owners: _newOwners,
    rental_type: _rentalType,
    price_per_night: _pricePerNight,
    ...updateDto
  } = createDto;

  return { createDto, updateDto };
}

/** Vuelca la config de corto plazo del formulario al DTO de creación. */
function assignShortTermConfig(dto: PropertySavePayload, formValue: PropertyFormValue): void {
  const depositToConfirmPct = toNumberOrUndefined(formValue.deposit_to_confirm_pct);
  if (depositToConfirmPct !== undefined) dto.deposit_to_confirm_pct = depositToConfirmPct;

  if (formValue.checkin_time) dto.checkin_time = formValue.checkin_time;
  if (formValue.checkout_time) dto.checkout_time = formValue.checkout_time;
  if (formValue.booking_mode) dto.booking_mode = formValue.booking_mode;
  if (formValue.cancellation_policy) dto.cancellation_policy = formValue.cancellation_policy;
}

function toNumberOrUndefined(value: number | string | null | undefined): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Devuelve una dirección de calle no vacía (el backend la exige). Usa la que
 * rellenó el punto del mapa y, si está vacía, la compone con la cascada de
 * localidad (Municipio, Departamento, País).
 */
function resolveStreetAddress(addr: {
  street_address?: string;
  city?: string;
  state?: string;
  country?: string;
}): string {
  const fromMap = addr.street_address?.trim();
  if (fromMap) return fromMap;

  return [addr.city, addr.state, addr.country]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ');
}
