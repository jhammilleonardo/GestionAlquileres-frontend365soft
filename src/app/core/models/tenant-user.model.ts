// Enums para inquilinos
export enum UserRole {
    ADMIN = 'ADMIN',
    USER = 'USER',
    MANAGER = 'MANAGER'
}

export enum UserStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    SUSPENDED = 'SUSPENDED'
}

// Interfaces
export interface TenantUser {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    phone?: string;
    tenant_id: number;
    status?: UserStatus;
    created_at: Date;
    updated_at?: Date;
    last_login?: Date;
}

// Estadísticas de inquilinos
export interface TenantUserStats {
    total_users: number;
    active_users: number;
    inactive_users: number;
    new_this_month: number;
    users_with_active_contracts: number;
    users_with_pending_payments: number;
}

// Filtros para inquilinos
export interface TenantUserFilters {
    role?: UserRole;
    status?: UserStatus;
    search?: string;
    date_from?: string;
    date_to?: string;
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
    active_contracts?: number;
    pending_payments?: number;
    total_paid?: number;
    properties?: Array<{
        id: number;
        title: string;
    }>;
}

// Labels para UI
export const UserRoleLabels: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'Administrador',
    [UserRole.USER]: 'Usuario',
    [UserRole.MANAGER]: 'Gerente'
};

export const UserStatusLabels: Record<UserStatus, string> = {
    [UserStatus.ACTIVE]: 'Activo',
    [UserStatus.INACTIVE]: 'Inactivo',
    [UserStatus.SUSPENDED]: 'Suspendido'
};
