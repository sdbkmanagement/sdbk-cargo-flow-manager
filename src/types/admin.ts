
// Use the actual database types
import { Database } from '@/integrations/supabase/types';

export type UserRole = Database['public']['Enums']['user_role'];
export type SystemUser = Database['public']['Tables']['users']['Row'];
export type AuthUser = {
  id: string;
  email: string;
  roles: UserRole[];
  status: 'active' | 'inactive';
  first_name: string;
  last_name: string;
  last_login?: string;
  created_at: string;
};

export const ROLES: UserRole[] = ['admin', 'transport', 'maintenance', 'rh', 'facturation', 'hsecq', 'obc', 'administratif', 'direction'];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrateur',
  transport: 'Transport',
  maintenance: 'Maintenance',
  rh: 'Ressources Humaines',
  facturation: 'Facturation',
  hsecq: 'HSECQ',
  obc: 'OBC',
  administratif: 'Administratif',
  direction: 'Direction'
};

export const MODULES = ['transport', 'maintenance', 'rh', 'facturation', 'hsecq', 'obc', 'administratif'] as const;
export const MODULE_LABELS: Record<string, string> = {
  transport: 'Transport',
  maintenance: 'Maintenance', 
  rh: 'Ressources Humaines',
  facturation: 'Facturation',
  hsecq: 'HSECQ',
  obc: 'OBC',
  administratif: 'Administratif'
};

export const PERMISSIONS = ['read', 'write', 'delete', 'admin'] as const;
export type AppPermission = typeof PERMISSIONS[number];
export const PERMISSION_LABELS: Record<AppPermission, string> = {
  read: 'Lecture',
  write: 'Écriture', 
  delete: 'Suppression',
  admin: 'Administration'
};

export type AppRole = UserRole;

export interface RolePermission {
  id: string;
  role: AppRole;
  module: string;
  permission: AppPermission;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details?: any;
  created_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  expires_at: string;
}
