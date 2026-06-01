import {
  PropertyFormValue,
  PropertyRulesPayload,
  PropertySavePayload,
} from '../models/property-form.model';

export interface PropertySavePayloads {
  createDto: PropertySavePayload;
  updateDto: Omit<PropertySavePayload, 'new_owners'>;
}

export function buildPropertySavePayloads(formValue: PropertyFormValue): PropertySavePayloads {
  const propertyTypeId = formValue.property_type_id ? +formValue.property_type_id : 0;
  const propertySubtypeId = formValue.property_subtype_id ? +formValue.property_subtype_id : 0;

  const createDto: PropertySavePayload = {
    title: formValue.title ?? '',
    property_type_id: propertyTypeId,
    property_subtype_id: propertySubtypeId,
    addresses: (formValue.addresses ?? []).map((addr) => ({
      address_type: addr.address_type || 'address_1',
      street_address: addr.street_address,
      city: addr.city,
      country: addr.country,
      ...(addr.state ? { state: addr.state } : {}),
      ...(addr.zip_code ? { zip_code: addr.zip_code } : {}),
    })),
  };

  if (formValue.description) createDto.description = formValue.description;
  if (formValue.security_deposit_amount) {
    createDto.security_deposit_amount = +formValue.security_deposit_amount;
  }
  if (formValue.account_number) createDto.account_number = formValue.account_number;
  if (formValue.account_type) createDto.account_type = formValue.account_type;
  if (formValue.account_holder_name) createDto.account_holder_name = formValue.account_holder_name;
  if (formValue.monthly_rent) createDto.monthly_rent = +formValue.monthly_rent;
  if (formValue.currency) createDto.currency = formValue.currency;
  if (formValue.square_meters) createDto.square_meters = +formValue.square_meters;
  if (formValue.bedrooms) createDto.bedrooms = +formValue.bedrooms;
  if (formValue.bathrooms) createDto.bathrooms = +formValue.bathrooms;
  if (formValue.parking_spaces) createDto.parking_spaces = +formValue.parking_spaces;
  if (formValue.year_built) createDto.year_built = +formValue.year_built;
  if (formValue.is_furnished !== undefined) createDto.is_furnished = formValue.is_furnished;
  if (formValue.latitude) createDto.latitude = +formValue.latitude;
  if (formValue.longitude) createDto.longitude = +formValue.longitude;
  if (formValue.amenities?.length) createDto.amenities = formValue.amenities;
  if (formValue.included_items?.length) createDto.included_items = formValue.included_items;

  const propertyRules: PropertyRulesPayload = {};
  if (formValue.pets_allowed !== undefined) propertyRules.pets_allowed = formValue.pets_allowed;
  if (formValue.smoking_allowed !== undefined) {
    propertyRules.smoking_allowed = formValue.smoking_allowed;
  }
  if (formValue.max_occupants) propertyRules.max_occupants = +formValue.max_occupants;
  if (formValue.min_lease_months) propertyRules.min_lease_months = +formValue.min_lease_months;
  if (Object.keys(propertyRules).length > 0) createDto.property_rules = propertyRules;

  const validOwners = (formValue.new_owners ?? []).filter(
    (owner) => owner.name && owner.primary_email && owner.phone_number,
  );
  if (validOwners.length > 0) createDto.new_owners = validOwners;

  const { new_owners: _newOwners, ...updateDto } = createDto;
  return { createDto, updateDto };
}
