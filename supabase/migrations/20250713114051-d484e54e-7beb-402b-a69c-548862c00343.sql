
-- Créer la table admin_audit_log pour le journal d'audit
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action character varying NOT NULL,
  target_type character varying NOT NULL,
  target_id uuid,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Créer la table login_attempts pour les tentatives de connexion
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email character varying NOT NULL,
  ip_address inet,
  success boolean NOT NULL DEFAULT false,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Activer RLS sur les nouvelles tables
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour admin_audit_log
CREATE POLICY "Admins peuvent voir tous les logs d'audit"
  ON public.admin_audit_log
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Politiques RLS pour login_attempts  
CREATE POLICY "Admins peuvent voir toutes les tentatives de connexion"
  ON public.login_attempts
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Système peut insérer des tentatives de connexion"
  ON public.login_attempts
  FOR INSERT
  WITH CHECK (true);
