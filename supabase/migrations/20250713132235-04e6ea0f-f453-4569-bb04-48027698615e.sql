
-- 1. S'assurer que le trigger pour créer automatiquement un profil utilisateur fonctionne
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    ARRAY['transport']::user_role[],
    'active',
    'managed_by_supabase_auth',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Corriger la fonction is_admin pour qu'elle fonctionne correctement
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Supprimer toutes les anciennes politiques RLS
DROP POLICY IF EXISTS "Admin_peut_tout_faire" ON public.users;
DROP POLICY IF EXISTS "Utilisateur_peut_voir_son_profil" ON public.users;
DROP POLICY IF EXISTS "Utilisateur_peut_modifier_son_profil" ON public.users;
DROP POLICY IF EXISTS "Politique_temporaire_permissive_SELECT" ON public.users;
DROP POLICY IF EXISTS "Politique_temporaire_permissive_INSERT" ON public.users;
DROP POLICY IF EXISTS "Politique_temporaire_permissive_UPDATE" ON public.users;
DROP POLICY IF EXISTS "Politique_temporaire_permissive_DELETE" ON public.users;

-- 4. Créer des politiques RLS claires et fonctionnelles
CREATE POLICY "Admin_full_access" ON public.users
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "User_own_profile_select" ON public.users
FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "User_own_profile_update" ON public.users
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 5. Créer manuellement le compte admin si il n'existe pas déjà
DO $$
DECLARE
  admin_exists BOOLEAN;
  admin_user_id UUID;
BEGIN
  -- Vérifier si un admin existe déjà
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE 'admin' = ANY(roles) AND status = 'active'
  ) INTO admin_exists;
  
  -- Si aucun admin n'existe, créer un utilisateur admin de base
  IF NOT admin_exists THEN
    -- Générer un UUID pour l'admin
    admin_user_id := gen_random_uuid();
    
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
      admin_user_id,
      'admin@sdbk.com',
      'Admin',
      'Système',
      ARRAY['admin']::user_role[],
      'active',
      'to_be_set_in_auth_users',
      NOW(),
      NOW()
    ) ON CONFLICT (email) DO UPDATE SET
      roles = ARRAY['admin']::user_role[],
      status = 'active';
      
    RAISE NOTICE 'Compte admin créé avec l''ID: %. Vous devez maintenant créer ce compte dans Supabase Auth Dashboard avec l''email admin@sdbk.com', admin_user_id;
  END IF;
END $$;

-- 6. Fonction utilitaire pour créer des utilisateurs via l'interface admin
CREATE OR REPLACE FUNCTION public.create_user_with_role(
  p_email TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_role TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  user_id UUID;
BEGIN
  -- Utiliser l'ID fourni ou en générer un nouveau
  user_id := COALESCE(p_user_id, gen_random_uuid());
  
  -- Insérer dans la table users
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
    user_id,
    p_email,
    p_first_name,
    p_last_name,
    ARRAY[p_role::user_role],
    'active',
    'managed_by_supabase_auth',
    NOW(),
    NOW()
  );
  
  RETURN json_build_object(
    'success', true,
    'user_id', user_id,
    'message', 'Utilisateur créé avec succès'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
