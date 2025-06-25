
import { Database } from '@/integrations/supabase/types';

export type AppRole = Database['public']['Enums']['app_role'];
export type AppPermission = Database['public']['Enums']['app_permission'];

export interface SystemUser {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: AppRole;
  statut: 'actif' | 'inactif' | 'suspendu';
  derniere_connexion?: string;
  mot_de_passe_change: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface RolePermission {
  id: string;
  role: AppRole;
  module: string;
  permission: AppPermission;
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  user_id?: string;
  action: string;
  target_type: string;
  target_id?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface LoginAttempt {
  id: string;
  email: string;
  ip_address?: string;
  success: boolean;
  error_message?: string;
  created_at: string;
}

export const MODULES = [
  'fleet',
  'missions', 
  'drivers',
  'cargo',
  'billing',
  'validations',
  'rh',
  'admin'
] as const;

export const ROLES: AppRole[] = [
  'maintenance',
  'administratif',
  'hsecq', 
  'obc',
  'transport',
  'rh',
  'facturation',
  'direction',
  'admin'
];

export const PERMISSIONS: AppPermission[] = [
  'read',
  'write',
  'delete',
  'validate',
  'export',
  'admin'
];

export const ROLE_LABELS: Record<AppRole, string> = {
  maintenance: 'Maintenance',
  administratif: 'Administratif',
  hsecq: 'HSECQ',
  obc: 'OBC (Opérations)',
  transport: 'Transport',
  rh: 'Ressources Humaines',
  facturation: 'Facturation',
  direction: 'Direction',
  admin: 'Admin Système'
};

export const MODULE_LABELS: Record<string, string> = {
  fleet: 'Flotte',
  missions: 'Missions',
  drivers: 'Chauffeurs',
  cargo: 'Chargements',
  billing: 'Facturation',
  validations: 'Validations',
  rh: 'Ressources Humaines',
  admin: 'Administration'
};

export const PERMISSION_LABELS: Record<AppPermission, string> = {
  read: 'Lecture',
  write: 'Écriture',
  delete: 'Suppression',
  validate: 'Validation',
  export: 'Export',
  admin: 'Administration'
};
