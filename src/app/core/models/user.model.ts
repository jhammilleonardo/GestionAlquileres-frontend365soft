export type UserRole = 'ADMIN' | 'SUPERADMIN' | 'EMPLEADO' | 'TECNICO' | 'INQUILINO';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phoneNumber?: string;
  tenant_slug?: string;
}

export interface MenuOption {
  label: string;
  icon: string;
  route: string;
  /** Clave del módulo en el backend. Si es undefined, el item es siempre visible. */
  module?: string;
  /** Badge opcional para mostrar contadores (ej. pagos pendientes). */
  badgeCount?: number;
  children?: MenuOption[];
}
