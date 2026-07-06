
import { Database } from '@/integrations/supabase/types';

export type AppRole = 'maintenance' | 'administratif' | 'hsecq' | 'obc' | 'transport' | 'rh' | 'facturation' | 'direction' | 'admin' | 'transitaire' | 'directeur_exploitation' | 'dashboard_viewer';
export type AppPermission = 'read' | 'write' | 'delete' | 'validate' | 'export' | 'admin';
export type ModulePermission = 'fleet' | 'drivers' | 'rh' | 'missions' | 'billing' | 'dashboard';

export interface SystemUser {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  roles?: string[];
  module_permissions?: string[];
  statut: 'actif' | 'inactif' | 'suspendu';
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface RolePermission {
  id: string;
  role: string;
  module: string;
  permission: string;
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
  'dashboard',
  'fleet',
  'missions',
  'drivers',
  'billing',
  'validations',
  'rh',
  'hseq',
  'obc',
  'formations',
  'maintenance',
  'clients',
  'societe',
  'rapports',
  'admin'
] as const;

export const ROLES: string[] = [
  'maintenance',
  'administratif',
  'hsecq', 
  'obc',
  'transport',
  'rh',
  'facturation',
  'direction',
  'admin',
  'transitaire',
  'directeur_exploitation',
  'dashboard_viewer'
];

export const MODULE_PERMISSIONS: string[] = [
  'dashboard',
  'fleet',
  'missions',
  'drivers',
  'billing',
  'validations',
  'rh',
  'hseq',
  'obc',
  'formations',
  'maintenance',
  'clients',
  'societe',
  'rapports'
];

export const PERMISSIONS: string[] = [
  'read',
  'write',
  'delete',
  'validate',
  'export',
  'admin'
];

export const ROLE_LABELS: Record<string, string> = {
  maintenance: 'Maintenance',
  administratif: 'Administratif',
  hseq: 'HSEQ',
  obc: 'OBC (Opérations)',
  transport: 'Transport',
  rh: 'Ressources Humaines',
  facturation: 'Facturation',
  direction: 'Direction',
  admin: 'Admin Système',
  transitaire: 'Transitaire',
  directeur_exploitation: 'Directeur d\'Exploitation',
  dashboard_viewer: 'Consultation Dashboard'
};

export const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  fleet: 'Flotte',
  missions: 'Missions',
  drivers: 'Chauffeurs',
  billing: 'Facturation',
  validations: 'Validations',
  rh: 'Ressources Humaines',
  hseq: 'HSEQ',
  obc: 'OBC',
  formations: 'Formations',
  maintenance: 'Maintenance',
  clients: 'Clients',
  societe: 'Société',
  rapports: 'Rapports',
  admin: 'Administration'
};

export const PERMISSION_LABELS: Record<string, string> = {
  read: 'Lecture',
  write: 'Écriture',
  delete: 'Suppression',
  validate: 'Validation',
  export: 'Export',
  admin: 'Administration'
};
