
-- Créer la table pour gérer les permissions des rôles
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role user_role NOT NULL,
  module TEXT NOT NULL,
  permission TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role, module, permission)
);

-- Activer RLS sur la table role_permissions
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux admins de gérer les permissions
CREATE POLICY "Admins peuvent gérer les permissions des rôles"
ON public.role_permissions
FOR ALL
USING (public.current_user_is_admin());

-- Politique pour permettre à tous les utilisateurs connectés de voir les permissions
CREATE POLICY "Utilisateurs peuvent voir les permissions des rôles"
ON public.role_permissions
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Insérer les permissions par défaut pour chaque rôle
INSERT INTO public.role_permissions (role, module, permission) VALUES
-- Admin a tous les droits
('admin', 'fleet', 'admin'),
('admin', 'missions', 'admin'),
('admin', 'drivers', 'admin'),
('admin', 'billing', 'admin'),
('admin', 'validations', 'admin'),
('admin', 'rh', 'admin'),
('admin', 'dashboard', 'admin'),

-- Transport
('transport', 'fleet', 'read'),
('transport', 'fleet', 'write'),
('transport', 'missions', 'read'),
('transport', 'missions', 'write'),
('transport', 'drivers', 'read'),
('transport', 'dashboard', 'read'),

-- Maintenance
('maintenance', 'fleet', 'read'),
('maintenance', 'fleet', 'write'),
('maintenance', 'validations', 'validate'),
('maintenance', 'dashboard', 'read'),

-- HSECQ
('hsecq', 'fleet', 'read'),
('hsecq', 'drivers', 'read'),
('hsecq', 'validations', 'validate'),
('hsecq', 'dashboard', 'read'),

-- OBC
('obc', 'fleet', 'read'),
('obc', 'missions', 'read'),
('obc', 'drivers', 'read'),
('obc', 'validations', 'validate'),
('obc', 'dashboard', 'read'),

-- RH
('rh', 'rh', 'read'),
('rh', 'rh', 'write'),
('rh', 'drivers', 'read'),
('rh', 'dashboard', 'read'),

-- Facturation
('facturation', 'billing', 'read'),
('facturation', 'billing', 'write'),
('facturation', 'missions', 'read'),
('facturation', 'dashboard', 'read'),

-- Direction
('direction', 'fleet', 'read'),
('direction', 'missions', 'read'),
('direction', 'drivers', 'read'),
('direction', 'billing', 'read'),
('direction', 'rh', 'read'),
('direction', 'validations', 'read'),
('direction', 'dashboard', 'admin')

ON CONFLICT (role, module, permission) DO NOTHING;

-- Ajouter un trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_role_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER update_role_permissions_updated_at
  BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_role_permissions_updated_at();
