export type AvailableModule =
  | 'properties'
  | 'units'
  | 'users'
  | 'contracts'
  | 'payments'
  | 'maintenance'
  | 'reports'
  | 'config'
  | 'employees'
  | 'owners'
  | 'inspections'
  | 'violations'
  | 'expenses'
  | 'vendors'
  | 'messages';

export interface ModulePermission {
  module: AvailableModule;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export interface Employee {
  id: number;
  email: string;
  name: string;
  phone?: string | null;
  role: 'EMPLEADO';
  is_active: boolean;
  last_connection?: string | null;
  created_at: string;
  updated_at: string;
  permissions: ModulePermission[];
}

export interface CreateEmployeeDto {
  name: string;
  email: string;
  password: string;
  phone?: string;
  permissions?: Partial<ModulePermission>[];
}

export interface UpdateEmployeeDto {
  name?: string;
  phone?: string;
  is_active?: boolean;
}

/** Módulos implementados que se gestionan en el panel de permisos */
export const PERMISSION_MODULES: { key: AvailableModule; label: string }[] = [
  { key: 'properties', label: 'Propiedades' },
  { key: 'users', label: 'Inquilinos' },
  { key: 'contracts', label: 'Contratos' },
  { key: 'payments', label: 'Pagos' },
  { key: 'maintenance', label: 'Mantenimiento' },
  { key: 'reports', label: 'Reportes' },
  { key: 'owners', label: 'Propietarios' },
  { key: 'inspections', label: 'Inspecciones' },
  { key: 'violations', label: 'Violaciones' },
  { key: 'expenses', label: 'Gastos' },
  { key: 'vendors', label: 'Proveedores' },
  { key: 'config', label: 'Configuración' },
  { key: 'employees', label: 'Empleados' },
];

/** Fusiona los permisos del empleado con defaults para todos los módulos */
export function mergePermissions(existing: ModulePermission[]): ModulePermission[] {
  return PERMISSION_MODULES.map(({ key }) => {
    const found = existing.find((p) => p.module === key);
    return found
      ? { ...found }
      : { module: key, can_view: false, can_create: false, can_edit: false, can_delete: false };
  });
}
