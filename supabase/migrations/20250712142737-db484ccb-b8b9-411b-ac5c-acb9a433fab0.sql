
-- Créer la table admin_audit_log si elle n'existe pas déjà
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action VARCHAR(50) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id UUID,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer la table login_attempts si elle n'existe pas déjà
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  ip_address INET,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insérer un utilisateur admin par défaut s'il n'existe pas
INSERT INTO public.users (id, email, password_hash, first_name, last_name, roles, status)
SELECT 
  gen_random_uuid(),
  'admin@sdbk.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
  'Admin',
  'SDBK',
  ARRAY['admin']::user_role[],
  'active'
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE email = 'admin@sdbk.com'
);

-- Mettre à jour le mot de passe pour admin123
UPDATE public.users 
SET password_hash = '$2a$10$HUjl5qjKE.WfF8FrqKGW.O8oEPqQr6VbQWUzCzKJvJw8QfL8O7.sC' -- admin123
WHERE email = 'admin@sdbk.com';

-- Activer RLS sur les nouvelles tables
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Créer des politiques pour admin_audit_log
CREATE POLICY IF NOT EXISTS "Admins peuvent voir tous les logs admin" 
ON public.admin_audit_log FOR SELECT 
TO authenticated 
USING (is_admin_user(auth.uid()));

-- Créer des politiques pour login_attempts
CREATE POLICY IF NOT EXISTS "Admins peuvent voir toutes les tentatives de connexion"
ON public.login_attempts FOR SELECT
TO authenticated
USING (is_admin_user(auth.uid()));

-- Permettre l'insertion des tentatives de connexion
CREATE POLICY IF NOT EXISTS "Système peut créer des tentatives de connexion"
ON public.login_attempts FOR INSERT
TO authenticated
WITH CHECK (true);
