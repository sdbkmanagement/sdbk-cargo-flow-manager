
-- Diagnostic et correction complète des politiques RLS pour la table users

-- 1. Vérifier et corriger la structure de la table users pour les rôles
-- Nous nous assurons que les rôles sont stockés dans le bon format

-- 2. Recréer la fonction is_admin() avec un diagnostic intégré
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_roles user_role[];
  user_exists BOOLEAN;
BEGIN
  -- Si aucun utilisateur connecté, retourner false
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Vérifier si l'utilisateur existe et récupérer ses rôles
  SELECT roles, TRUE INTO user_roles, user_exists
  FROM public.users 
  WHERE id = auth.uid() 
  AND status = 'active';
  
  -- Si l'utilisateur n'existe pas, retourner false
  IF NOT user_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Vérifier si 'admin' est dans les rôles
  RETURN 'admin' = ANY(user_roles);
  
EXCEPTION 
  WHEN OTHERS THEN
    -- En cas d'erreur, retourner false pour sécurité
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Supprimer toutes les anciennes politiques pour repartir à zéro
DROP POLICY IF EXISTS "Admins peuvent créer des utilisateurs" ON public.users;
DROP POLICY IF EXISTS "Création des utilisateurs" ON public.users;
DROP POLICY IF EXISTS "Lecture des utilisateurs" ON public.users;
DROP POLICY IF EXISTS "Modification des utilisateurs" ON public.users;
DROP POLICY IF EXISTS "Suppression des utilisateurs" ON public.users;
DROP POLICY IF EXISTS "Admins peuvent tout voir et modifier" ON public.users;
DROP POLICY IF EXISTS "Utilisateurs peuvent voir leur propre profil" ON public.users;

-- 4. Créer des politiques RLS claires et permissives pour les admins
CREATE POLICY "Admin_peut_tout_faire" ON public.users
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 5. Permettre aux utilisateurs de voir leur propre profil
CREATE POLICY "Utilisateur_peut_voir_son_profil" ON public.users
FOR SELECT TO authenticated
USING (id = auth.uid());

-- 6. Permettre aux utilisateurs de modifier leur propre profil
CREATE POLICY "Utilisateur_peut_modifier_son_profil" ON public.users
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 7. S'assurer qu'un utilisateur admin existe
-- Vérifier s'il existe déjà un admin
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count 
  FROM public.users 
  WHERE 'admin' = ANY(roles) AND status = 'active';
  
  -- Si aucun admin n'existe, créer admin@sdbk.com
  IF admin_count = 0 THEN
    INSERT INTO public.users (
      email, 
      first_name, 
      last_name, 
      roles, 
      status,
      password_hash
    ) VALUES (
      'admin@sdbk.com',
      'Admin',
      'Système',
      ARRAY['admin']::user_role[],
      'active',
      'temp_hash_to_be_set'
    ) ON CONFLICT (email) DO UPDATE SET
      roles = ARRAY['admin']::user_role[],
      status = 'active';
  END IF;
END $$;
