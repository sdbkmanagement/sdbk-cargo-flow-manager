
-- Supprimer les anciennes tables et contraintes
DROP TABLE IF EXISTS public.login_attempts CASCADE;
DROP TABLE IF EXISTS public.admin_audit_log CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Supprimer les anciens types ENUM
DROP TYPE IF EXISTS app_role CASCADE;
DROP TYPE IF EXISTS app_permission CASCADE;

-- Créer le nouveau type pour les rôles
CREATE TYPE user_role AS ENUM (
  'transport',
  'maintenance', 
  'hsecq',
  'obc',
  'rh',
  'facturation',
  'direction',
  'administratif',
  'admin'
);

-- Créer la nouvelle table users avec authentification intégrée
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  roles user_role[] NOT NULL DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES public.users(id)
);

-- Table pour l'historique des connexions
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour l'audit des actions utilisateurs
CREATE TABLE public.user_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id UUID,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Créer un utilisateur admin par défaut
INSERT INTO public.users (first_name, last_name, email, password_hash, roles, status) 
VALUES (
  'Admin', 
  'Système', 
  'admin@sdbk.com', 
  '$2b$10$rQZ9QwGGpKVKX4zY8zK4tOxJ8aP4xQzJ9aP4xQzJ9aP4xQzJ9aP4xQ', -- password: admin123
  ARRAY['admin']::user_role[], 
  'active'
);

-- Activer RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_audit_log ENABLE ROW LEVEL SECURITY;

-- Fonction pour vérifier si l'utilisateur est admin
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id 
    AND 'admin' = ANY(roles) 
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Politiques RLS pour users
CREATE POLICY "Admins peuvent tout voir et modifier" 
  ON public.users FOR ALL 
  USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Utilisateurs peuvent voir leur propre profil" 
  ON public.users FOR SELECT 
  USING (id = auth.uid());

-- Politiques RLS pour user_sessions
CREATE POLICY "Admins peuvent voir toutes les sessions" 
  ON public.user_sessions FOR ALL 
  USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Utilisateurs peuvent voir leurs propres sessions" 
  ON public.user_sessions FOR SELECT 
  USING (user_id = auth.uid());

-- Politiques RLS pour user_audit_log
CREATE POLICY "Admins peuvent voir tous les logs" 
  ON public.user_audit_log FOR SELECT 
  USING (public.is_admin_user(auth.uid()));

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour logger les actions
CREATE OR REPLACE FUNCTION log_user_action()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.user_audit_log (user_id, action, target_type, target_id, details)
    VALUES (auth.uid(), 'CREATE_USER', 'user', NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.user_audit_log (user_id, action, target_type, target_id, details)
    VALUES (auth.uid(), 'UPDATE_USER', 'user', NEW.id, 
            jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.user_audit_log (user_id, action, target_type, target_id, details)
    VALUES (auth.uid(), 'DELETE_USER', 'user', OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger d'audit pour users
CREATE TRIGGER audit_users_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.users
  FOR EACH ROW EXECUTE FUNCTION log_user_action();

-- Index pour les performances
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_roles ON public.users USING GIN(roles);
CREATE INDEX idx_users_status ON public.users(status);
CREATE INDEX idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_audit_log_user_id ON public.user_audit_log(user_id);
CREATE INDEX idx_user_audit_log_created_at ON public.user_audit_log(created_at);

-- Mettre à jour les étapes de validation pour utiliser les nouveaux rôles
UPDATE public.validation_etapes 
SET validateur_role = CASE 
  WHEN etape = 'maintenance' THEN 'maintenance'
  WHEN etape = 'administratif' THEN 'administratif'
  WHEN etape = 'hsecq' THEN 'hsecq'
  WHEN etape = 'obc' THEN 'obc'
  ELSE validateur_role
END
WHERE validateur_role IS NOT NULL;
