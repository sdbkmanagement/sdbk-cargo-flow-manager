
export type UserRole = 
  | 'transport'
  | 'maintenance' 
  | 'hsecq'
  | 'obc'
  | 'rh'
  | 'facturation'
  | 'direction'
  | 'administratif'
  | 'admin';

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  roles: UserRole[];
  status: 'active' | 'inactive';
  last_login?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CreateUserData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  roles: UserRole[];
  status?: 'active' | 'inactive';
}

export interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  roles?: UserRole[];
  status?: 'active' | 'inactive';
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  ip_address?: string;
  user_agent?: string;
  expires_at: string;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser extends User {
  session_token: string;
  expires_at: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  transport: 'Transport',
  maintenance: 'Maintenance',
  hsecq: 'HSECQ',
  obc: 'OBC',
  rh: 'Ressources Humaines',
  facturation: 'Facturation',
  direction: 'Direction',
  administratif: 'Administratif',
  admin: 'Administrateur'
};

export const VALIDATION_ROLES: UserRole[] = ['maintenance', 'administratif', 'hsecq', 'obc'];
