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
  /**
   * Modo de alquiler que requiere el item. Si es undefined, aplica a ambos modos.
   * 'short_term' se oculta para tenants solo-largo-plazo; 'long_term' para
   * tenants solo-corto-plazo.
   */
  mode?: 'short_term' | 'long_term';
  /** Sección del sidebar (clave i18n) para agrupar items en categorías. */
  group?: string;
  /** Badge opcional para mostrar contadores (ej. pagos pendientes). */
  badgeCount?: number;
  children?: MenuOption[];
}
