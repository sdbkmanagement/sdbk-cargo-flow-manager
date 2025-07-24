
export interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  nom: string;
  prenom: string;
  role: string;
  roles: string[];
  module_permissions: string[];
  password?: string;
  statut: 'actif' | 'inactif' | 'suspendu';
}

export interface SystemUser {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  roles: string[];
  module_permissions: string[];
  statut: 'actif' | 'inactif' | 'suspendu';
  created_at: string;
  updated_at: string;
}

export interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'user_created' | 'permission_change' | 'data_access';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: string;
  user_id: string;
  ip_address: string;
  details?: Record<string, any>;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, any>;
  created_at: string;
  ip_address?: string;
}

export interface AdminAuditLog {
  id: string;
  user_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, any>;
  created_at: string;
  ip_address?: string;
}

export interface LoginAttempt {
  id: string;
  email: string;
  success: boolean;
  ip_address?: string;
  error_message?: string;
  created_at: string;
}

// Role definitions
export const ROLES = [
  'admin',
  'transport',
  'maintenance',
  'administratif',
  'hsecq',
  'obc',
  'rh',
  'facturation',
  'direction',
  'transitaire',
  'directeur_exploitation'
] as const;

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur',
  transport: 'Transport',
  maintenance: 'Maintenance',
  administratif: 'Administratif',
  hsecq: 'HSECQ',
  obc: 'OBC',
  rh: 'Ressources Humaines',
  facturation: 'Facturation',
  direction: 'Direction',
  transitaire: 'Transitaire',
  directeur_exploitation: 'Directeur d\'exploitation'
};

// Module definitions
export const MODULE_PERMISSIONS = [
  'dashboard',
  'fleet',
  'drivers',
  'missions',
  'billing',
  'rh',
  'admin',
  'validations',
  'maintenance',
  'documents'
] as const;

export const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Tableau de bord',
  fleet: 'Flotte',
  drivers: 'Chauffeurs',
  missions: 'Missions',
  billing: 'Facturation',
  rh: 'Ressources Humaines',
  admin: 'Administration',
  validations: 'Validations',
  maintenance: 'Maintenance',
  documents: 'Documents'
};

// Permission definitions
export const PERMISSIONS = [
  'read',
  'write',
  'delete',
  'validate',
  'admin'
] as const;

export const PERMISSION_LABELS: Record<string, string> = {
  read: 'Lecture',
  write: 'Écriture',
  delete: 'Suppression',
  validate: 'Validation',
  admin: 'Administration'
};

// Module definitions for role management
export const MODULES = [
  'dashboard',
  'fleet',
  'drivers',
  'missions',
  'billing',
  'rh',
  'admin',
  'validations',
  'maintenance',
  'documents'
] as const;

export type Role = typeof ROLES[number];
export type ModulePermission = typeof MODULE_PERMISSIONS[number];
export type Permission = typeof PERMISSIONS[number];
export type Module = typeof MODULES[number];
