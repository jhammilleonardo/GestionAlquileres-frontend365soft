export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'tenant' | 'owner';
  avatar?: string;
  phoneNumber?: string;
}

export interface MenuOption {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
  children?: MenuOption[];
}
