
-- Corriger la politique RLS récursive pour la table users
DROP POLICY IF EXISTS "Admins peuvent gérer les utilisateurs" ON public.users;
DROP POLICY IF EXISTS "Utilisateurs peuvent voir leur profil" ON public.users;
DROP POLICY IF EXISTS "Utilisateurs peuvent mettre à jour leur profil" ON public.users;

-- Créer une fonction sécurisée pour vérifier si l'utilisateur actuel est admin
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND 'admin' = ANY(roles) 
    AND status = 'active'
  );
$$;

-- Recréer les politiques sans récursion
CREATE POLICY "Admins peuvent gérer les utilisateurs" 
ON public.users 
FOR ALL 
USING (public.current_user_is_admin());

CREATE POLICY "Utilisateurs peuvent voir leur profil" 
ON public.users 
FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "Utilisateurs peuvent mettre à jour leur profil" 
ON public.users 
FOR UPDATE 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- S'assurer que le compte admin existe
INSERT INTO public.users (
  id,
  email,
  first_name,
  last_name,
  roles,
  status,
  password_hash,
  created_at,
  updated_at
) VALUES (
  '3e884fae-6dd9-436f-a6f5-595672045409'::uuid,
  'sdbkmanagement@gmail.com',
  'Admin',
  'SDBK',
  ARRAY['admin']::user_role[],
  'active',
  'managed_by_supabase_auth',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  roles = ARRAY['admin']::user_role[],
  status = 'active',
  updated_at = NOW();
