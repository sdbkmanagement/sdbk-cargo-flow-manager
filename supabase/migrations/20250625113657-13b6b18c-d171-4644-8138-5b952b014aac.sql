
-- Migration pour le module Administration & Gestion des accès
-- Créer le type enum pour les rôles système
CREATE TYPE app_role AS ENUM (
  'maintenance',
  'administratif', 
  'hsecq',
  'obc',
  'transport',
  'rh',
  'facturation',
  'direction',
  'admin'
);

-- Créer le type enum pour les permissions
CREATE TYPE app_permission AS ENUM (
  'read',
  'write', 
  'delete',
  'validate',
  'export',
  'admin'
);

-- Table des utilisateurs système (distincte de auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  role app_role NOT NULL DEFAULT 'transport',
  statut VARCHAR(20) NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif', 'suspendu')),
  derniere_connexion TIMESTAMP WITH TIME ZONE,
  mot_de_passe_change BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES public.users(id)
);

-- Table des permissions par rôle et module
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  module VARCHAR(50) NOT NULL, -- 'fleet', 'missions', 'drivers', 'cargo', 'billing', 'validations', 'rh', 'admin'
  permission app_permission NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(role, module, permission)
);

-- Table d'audit des actions administratives
CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50) NOT NULL, -- 'user', 'role', 'permission'
  target_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des tentatives de connexion
CREATE TABLE public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  ip_address INET,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insérer les permissions par défaut pour chaque rôle
INSERT INTO public.role_permissions (role, module, permission) VALUES
-- Admin - accès complet à tous les modules
('admin', 'fleet', 'read'), ('admin', 'fleet', 'write'), ('admin', 'fleet', 'delete'), ('admin', 'fleet', 'validate'), ('admin', 'fleet', 'export'), ('admin', 'fleet', 'admin'),
('admin', 'missions', 'read'), ('admin', 'missions', 'write'), ('admin', 'missions', 'delete'), ('admin', 'missions', 'validate'), ('admin', 'missions', 'export'), ('admin', 'missions', 'admin'),
('admin', 'drivers', 'read'), ('admin', 'drivers', 'write'), ('admin', 'drivers', 'delete'), ('admin', 'drivers', 'validate'), ('admin', 'drivers', 'export'), ('admin', 'drivers', 'admin'),
('admin', 'cargo', 'read'), ('admin', 'cargo', 'write'), ('admin', 'cargo', 'delete'), ('admin', 'cargo', 'validate'), ('admin', 'cargo', 'export'), ('admin', 'cargo', 'admin'),
('admin', 'billing', 'read'), ('admin', 'billing', 'write'), ('admin', 'billing', 'delete'), ('admin', 'billing', 'validate'), ('admin', 'billing', 'export'), ('admin', 'billing', 'admin'),
('admin', 'validations', 'read'), ('admin', 'validations', 'write'), ('admin', 'validations', 'delete'), ('admin', 'validations', 'validate'), ('admin', 'validations', 'export'), ('admin', 'validations', 'admin'),
('admin', 'rh', 'read'), ('admin', 'rh', 'write'), ('admin', 'rh', 'delete'), ('admin', 'rh', 'validate'), ('admin', 'rh', 'export'), ('admin', 'rh', 'admin'),
('admin', 'admin', 'read'), ('admin', 'admin', 'write'), ('admin', 'admin', 'delete'), ('admin', 'admin', 'validate'), ('admin', 'admin', 'export'), ('admin', 'admin', 'admin'),

-- Maintenance - flotte et validations
('maintenance', 'fleet', 'read'), ('maintenance', 'fleet', 'write'), ('maintenance', 'fleet', 'validate'),
('maintenance', 'validations', 'read'), ('maintenance', 'validations', 'write'), ('maintenance', 'validations', 'validate'),

-- Transport - missions, chauffeurs, chargements
('transport', 'missions', 'read'), ('transport', 'missions', 'write'), ('transport', 'missions', 'export'),
('transport', 'drivers', 'read'), ('transport', 'drivers', 'write'),
('transport', 'cargo', 'read'), ('transport', 'cargo', 'write'),

-- RH - ressources humaines et chauffeurs
('rh', 'drivers', 'read'), ('rh', 'drivers', 'write'), ('rh', 'drivers', 'export'),
('rh', 'rh', 'read'), ('rh', 'rh', 'write'), ('rh', 'rh', 'export'),

-- Facturation - facturation et chargements
('facturation', 'billing', 'read'), ('facturation', 'billing', 'write'), ('facturation', 'billing', 'export'),
('facturation', 'cargo', 'read'),

-- HSECQ - validations et formations
('hsecq', 'validations', 'read'), ('hsecq', 'validations', 'write'), ('hsecq', 'validations', 'validate'),
('hsecq', 'drivers', 'read'),

-- OBC - opérations et missions
('obc', 'missions', 'read'), ('obc', 'missions', 'write'), ('obc', 'missions', 'validate'),
('obc', 'cargo', 'read'), ('obc', 'cargo', 'write'),
('obc', 'validations', 'read'), ('obc', 'validations', 'write'), ('obc', 'validations', 'validate'),

-- Administratif - lecture générale
('administratif', 'fleet', 'read'), ('administratif', 'missions', 'read'), ('administratif', 'drivers', 'read'),
('administratif', 'cargo', 'read'), ('administratif', 'billing', 'read'),

-- Direction - lecture et export sur tous les modules
('direction', 'fleet', 'read'), ('direction', 'fleet', 'export'),
('direction', 'missions', 'read'), ('direction', 'missions', 'export'),
('direction', 'drivers', 'read'), ('direction', 'drivers', 'export'),
('direction', 'cargo', 'read'), ('direction', 'cargo', 'export'),
('direction', 'billing', 'read'), ('direction', 'billing', 'export'),
('direction', 'validations', 'read'), ('direction', 'validations', 'export'),
('direction', 'rh', 'read'), ('direction', 'rh', 'export');

-- Insérer un utilisateur admin par défaut
INSERT INTO public.users (email, nom, prenom, role, statut) VALUES
('admin@sdbk.com', 'Admin', 'Système', 'admin', 'actif');

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour updated_at sur users
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Fonction pour logger les actions d'audit
CREATE OR REPLACE FUNCTION log_admin_action()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.admin_audit_log (user_id, action, target_type, target_id, details)
        VALUES (auth.uid(), 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.admin_audit_log (user_id, action, target_type, target_id, details)
        VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id, 
                jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.admin_audit_log (user_id, action, target_type, target_id, details)
        VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Triggers d'audit
CREATE TRIGGER audit_users_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.users
    FOR EACH ROW EXECUTE PROCEDURE log_admin_action();

CREATE TRIGGER audit_role_permissions_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.role_permissions
    FOR EACH ROW EXECUTE PROCEDURE log_admin_action();

-- Index pour les performances
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_statut ON public.users(statut);
CREATE INDEX idx_role_permissions_role_module ON public.role_permissions(role, module);
CREATE INDEX idx_admin_audit_log_user_id ON public.admin_audit_log(user_id);
CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log(created_at);
CREATE INDEX idx_login_attempts_email ON public.login_attempts(email);
CREATE INDEX idx_login_attempts_created_at ON public.login_attempts(created_at);

-- RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour users
CREATE POLICY "Les admins peuvent tout voir" ON public.users FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.email = auth.email() AND u.role = 'admin' AND u.statut = 'actif'
        )
    );

CREATE POLICY "Les utilisateurs peuvent voir leur propre profil" ON public.users FOR SELECT TO authenticated
    USING (email = auth.email());

-- Politiques RLS pour role_permissions
CREATE POLICY "Les admins peuvent gérer les permissions" ON public.role_permissions FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.email = auth.email() AND u.role = 'admin' AND u.statut = 'actif'
        )
    );

CREATE POLICY "Lecture des permissions pour tous les utilisateurs authentifiés" ON public.role_permissions FOR SELECT TO authenticated
    USING (true);

-- Politiques RLS pour admin_audit_log
CREATE POLICY "Les admins peuvent voir les logs d'audit" ON public.admin_audit_log FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.email = auth.email() AND u.role = 'admin' AND u.statut = 'actif'
        )
    );
