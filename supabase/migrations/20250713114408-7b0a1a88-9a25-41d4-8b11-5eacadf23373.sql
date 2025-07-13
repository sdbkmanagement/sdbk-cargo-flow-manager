
-- Ajouter les colonnes manquantes à la table users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS nom character varying,
ADD COLUMN IF NOT EXISTS prenom character varying, 
ADD COLUMN IF NOT EXISTS statut character varying DEFAULT 'actif',
ADD COLUMN IF NOT EXISTS role character varying DEFAULT 'transport';

-- Créer les types pour les rôles et permissions
CREATE TYPE IF NOT EXISTS public.app_role AS ENUM (
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
  'directeur_exploitation'
);

CREATE TYPE IF NOT EXISTS public.app_permission AS ENUM (
  'read',
  'write', 
  'delete',
  'validate',
  'export',
  'admin'
);

-- Créer la table role_permissions pour gérer les permissions des rôles
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role app_role NOT NULL,
  module character varying NOT NULL,
  permission app_permission NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(role, module, permission)
);

-- Activer RLS sur role_permissions
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour role_permissions
CREATE POLICY "Admins peuvent gérer les permissions"
  ON public.role_permissions
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Tous peuvent voir les permissions"
  ON public.role_permissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Mettre à jour les données existantes si elles existent
UPDATE public.users 
SET nom = last_name, prenom = first_name, statut = 'actif'
WHERE nom IS NULL AND last_name IS NOT NULL;
