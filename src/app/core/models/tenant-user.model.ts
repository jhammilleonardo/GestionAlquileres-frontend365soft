// Enums para inquilinos
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  MANAGER = 'MANAGER',
  INQUILINO = 'INQUILINO',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export type TenantLeaseStatus = 'active' | 'pending' | 'past' | 'none';

// Interfaces
export interface TenantUser {
  id: number;
  name: string;
  email: string;
  role: UserRole | string;
  phone?: string | null;
  tenant_id?: number;
  is_active?: boolean;
  status?: UserStatus | string;
  created_at: Date | string;
  updated_at?: Date | string;
  last_login?: Date | string;
}

// Estadísticas de inquilinos
export interface TenantUserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  new_this_month: number;
  users_with_active_contracts: number;
  users_with_pending_payments: number;
  total_balance_due?: number;
  total_paid?: number;
}

// Filtros para inquilinos
export interface TenantUserFilters {
  role?: UserRole;
  status?: UserStatus | TenantLeaseStatus | 'approved' | 'pending' | 'all';
  search?: string;
  date_from?: string;
  date_to?: string;
  hasActiveContract?: boolean;
}

// DTOs
export interface CreateTenantUserDto {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
}

export interface UpdateTenantUserDto {
  name?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  status?: UserStatus;
}

// Admin Tenant User (includes additional info)
export interface AdminTenantUser extends TenantUser {
  lease_status?: TenantLeaseStatus;
  application_count?: number;
  approved_applications?: number;
  active_contracts?: number;
  pending_payments?: number;
  balance_due?: number | string;
  total_paid?: number | string;
  current_contract_id?: number | null;
  contract_number?: string | null;
  contract_status?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  monthly_rent?: number | string | null;
  currency?: string | null;
  property_id?: number | null;
  property_title?: string | null;
  unit_id?: number | null;
  unit_number?: string | null;
  properties?: Array<{
    id: number;
    title: string;
  }>;
}

// Rent ledger del inquilino
export interface TenantLedgerLine {
  id: number;
  date: string;
  due_date: string | null;
  payment_type: string;
  payment_method: string;
  status: string;
  amount: number;
  reference_number: string | null;
  contract_number: string | null;
  running_balance: number;
}

export interface TenantLedger {
  tenant_id: number;
  currency: string;
  summary: {
    total_charged: number;
    total_paid: number;
    balance_due: number;
    pending_count: number;
  };
  lines: TenantLedgerLine[];
}

export interface TenantMaintenanceItem {
  id: number;
  ticket_number: string;
  title: string;
  category: string | null;
  status: string;
  priority: string;
  property_title: string | null;
  created_at: string;
  completed_at: string | null;
}

// Labels para UI
export const UserRoleLabels: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Administrador',
  [UserRole.USER]: 'Usuario',
  [UserRole.MANAGER]: 'Gerente',
  [UserRole.INQUILINO]: 'Inquilino',
};

export const UserStatusLabels: Record<UserStatus, string> = {
  [UserStatus.ACTIVE]: 'Activo',
  [UserStatus.INACTIVE]: 'Inactivo',
  [UserStatus.SUSPENDED]: 'Suspendido',
};
