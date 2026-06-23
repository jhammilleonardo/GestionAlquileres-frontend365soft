export interface RentalOwner {
  id: number;
  name: string;
  company_name?: string | null;
  is_company: boolean;
  primary_email: string;
  phone_number: string;
  is_active: boolean;
}

export interface RentalOwnerSummary extends RentalOwner {
  properties_count: number;
  pending_balance: number;
  /** Si el propietario ya tiene cuenta de portal creada. */
  has_account: boolean;
}

export interface CreateRentalOwnerDto {
  name: string;
  primary_email: string;
  phone_number: string;
  company_name?: string;
  is_company?: boolean;
  secondary_email?: string;
  secondary_phone?: string;
  notes?: string;
}

export type UpdateRentalOwnerDto = Partial<CreateRentalOwnerDto>;

export interface AssignOwnerPropertyDto {
  property_id: number;
  ownership_percentage?: number;
  is_primary?: boolean;
}

/** Propiedad asignada a un propietario, tal como la devuelve el backend. */
export interface OwnerAssignedProperty {
  id: number;
  title: string;
  status?: string;
  ownership_percentage?: number;
  is_primary?: boolean;
  [key: string]: unknown;
}

/** Resultado de invitar al propietario: enlace de un solo uso para definir su contraseña. */
export interface RentalOwnerInvite {
  email: string;
  inviteUrl: string;
  expiresAt: string;
  /** true si la cuenta se creó ahora; false si ya existía (reenvío). */
  created: boolean;
}

export interface RentalOwnerMessage {
  message: string;
}
