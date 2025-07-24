
-- Restaurer la base de données à l'état précédent
-- Supprimer les nouvelles politiques RLS restrictives

-- Supprimer les politiques RLS sur la table users
DROP POLICY IF EXISTS "Admin secure access" ON users;
DROP POLICY IF EXISTS "User secure profile access" ON users;

-- Restaurer les politiques RLS d'origine sur users
DROP POLICY IF EXISTS "Admins peuvent gérer les utilisateurs" ON users;
DROP POLICY IF EXISTS "Utilisateurs peuvent mettre à jour leur profil" ON users;
DROP POLICY IF EXISTS "Utilisateurs peuvent voir leur profil" ON users;

CREATE POLICY "Admins peuvent gérer les utilisateurs" ON users
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users users_1
    WHERE users_1.id = auth.uid()
    AND 'admin'::user_role = ANY(users_1.roles)
    AND users_1.status = 'active'
  )
);

CREATE POLICY "Utilisateurs peuvent mettre à jour leur profil" ON users
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Utilisateurs peuvent voir leur profil" ON users
FOR SELECT TO authenticated
USING (id = auth.uid());

-- Supprimer les nouvelles tables de sécurité qui peuvent causer des problèmes
DROP TABLE IF EXISTS security_audit_log CASCADE;
DROP TABLE IF EXISTS login_attempts CASCADE;

-- Supprimer les nouvelles fonctions de sécurité
DROP FUNCTION IF EXISTS create_secure_admin() CASCADE;
DROP FUNCTION IF EXISTS log_security_event(text, jsonb, inet, text) CASCADE;

-- S'assurer que l'utilisateur admin existe et est accessible
-- Mettre à jour le statut de l'utilisateur admin pour s'assurer qu'il peut se connecter
UPDATE users 
SET 
  status = 'active',
  roles = ARRAY['admin']::user_role[],
  module_permissions = ARRAY['fleet', 'missions', 'drivers', 'cargo', 'billing', 'validations', 'rh', 'admin', 'dashboard']
WHERE email = 'sdbkmanagement@gmail.com';

-- Si l'utilisateur n'existe pas, le créer
INSERT INTO users (
  id,
  email,
  first_name,
  last_name,
  roles,
  status,
  module_permissions,
  password_hash
) 
SELECT 
  gen_random_uuid(),
  'sdbkmanagement@gmail.com',
  'Admin',
  'SDBK',
  ARRAY['admin']::user_role[],
  'active',
  ARRAY['fleet', 'missions', 'drivers', 'cargo', 'billing', 'validations', 'rh', 'admin', 'dashboard'],
  'managed_by_supabase_auth'
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'sdbkmanagement@gmail.com'
);

-- Supprimer les politiques RLS restrictives sur d'autres tables
DROP POLICY IF EXISTS "Secure admin access" ON admin_audit_log;
DROP POLICY IF EXISTS "Secure validation access" ON validation_workflows;
DROP POLICY IF EXISTS "Secure validation etapes access" ON validation_etapes;

-- Restaurer les politiques d'origine
CREATE POLICY "Admins peuvent voir tous les logs d'audit" ON admin_audit_log
FOR SELECT TO authenticated
USING (is_admin());

CREATE POLICY "Validateurs peuvent voir les workflows" ON validation_workflows
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (
      'admin'::user_role = ANY(users.roles) OR
      'maintenance'::user_role = ANY(users.roles) OR
      'hsecq'::user_role = ANY(users.roles) OR
      'obc'::user_role = ANY(users.roles) OR
      'administratif'::user_role = ANY(users.roles)
    )
    AND users.status = 'active'
  )
);

CREATE POLICY "Validateurs peuvent mettre à jour les workflows" ON validation_workflows
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (
      'admin'::user_role = ANY(users.roles) OR
      'maintenance'::user_role = ANY(users.roles) OR
      'hsecq'::user_role = ANY(users.roles) OR
      'obc'::user_role = ANY(users.roles) OR
      'administratif'::user_role = ANY(users.roles)
    )
    AND users.status = 'active'
  )
);

CREATE POLICY "Validateurs peuvent voir les étapes" ON validation_etapes
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (
      'admin'::user_role = ANY(users.roles) OR
      'maintenance'::user_role = ANY(users.roles) OR
      'hsecq'::user_role = ANY(users.roles) OR
      'obc'::user_role = ANY(users.roles) OR
      'administratif'::user_role = ANY(users.roles)
    )
    AND users.status = 'active'
  )
);

CREATE POLICY "Validateurs peuvent mettre à jour leurs étapes" ON validation_etapes
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (
      'admin'::user_role = ANY(users.roles) OR
      'maintenance'::user_role = ANY(users.roles) OR
      'hsecq'::user_role = ANY(users.roles) OR
      'obc'::user_role = ANY(users.roles) OR
      'administratif'::user_role = ANY(users.roles)
    )
    AND users.status = 'active'
  )
);

-- Nettoyer les autres tables qui pourraient avoir des politiques restrictives
DROP POLICY IF EXISTS "Secure user audit access" ON user_audit_log;

CREATE POLICY "Admins peuvent voir tous les logs" ON user_audit_log
FOR SELECT TO authenticated
USING (is_admin_user(auth.uid()));

-- S'assurer que les fonctions de base fonctionnent
-- Recréer la fonction is_admin si elle a été supprimée
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND 'admin' = ANY(roles) 
    AND status = 'active'
  );
EXCEPTION 
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;
