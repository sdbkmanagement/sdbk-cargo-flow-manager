
-- Supprimer complètement la table users et la recréer proprement
DROP TABLE IF EXISTS public.users CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.is_admin();

-- Recréer la table users
CREATE TABLE public.users (
    id UUID PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    first_name VARCHAR NOT NULL DEFAULT '',
    last_name VARCHAR NOT NULL DEFAULT '',
    roles user_role[] NOT NULL DEFAULT ARRAY['transport']::user_role[],
    status VARCHAR NOT NULL DEFAULT 'active',
    password_hash VARCHAR NOT NULL DEFAULT 'managed_by_supabase_auth',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NULL,
    last_login TIMESTAMP WITH TIME ZONE NULL
);

-- Activer RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Créer la fonction is_admin en premier
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

-- Créer une politique très permissive pour l'insertion (temporaire)
CREATE POLICY "Allow_all_inserts_temporarily" ON public.users
FOR INSERT 
WITH CHECK (true);

-- Politique pour les admins (toutes opérations)
CREATE POLICY "Admin_full_access" ON public.users
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Politique pour voir son propre profil
CREATE POLICY "User_own_profile_select" ON public.users
FOR SELECT TO authenticated
USING (id = auth.uid());

-- Politique pour modifier son propre profil
CREATE POLICY "User_own_profile_update" ON public.users
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Créer le trigger fonction avec SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
AS $$
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
EXCEPTION
  WHEN OTHERS THEN
    -- Log l'erreur mais ne pas bloquer la création d'utilisateur
    RAISE WARNING 'Erreur lors de la création du profil utilisateur: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Insérer un utilisateur admin par défaut si aucun n'existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE 'admin' = ANY(roles)) THEN
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
      gen_random_uuid(),
      'sdbkmanagement@gmail.com',
      'Admin',
      'Système',
      ARRAY['admin']::user_role[],
      'active',
      'managed_by_supabase_auth',
      NOW(),
      NOW()
    ) ON CONFLICT (email) DO UPDATE SET
      roles = ARRAY['admin']::user_role[],
      status = 'active';
  END IF;
END $$;
