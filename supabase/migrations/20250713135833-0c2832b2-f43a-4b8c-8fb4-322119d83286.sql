
-- Supprimer TOUTES les politiques RLS problématiques
DROP POLICY IF EXISTS "Allow_all_inserts_temporarily" ON public.users;
DROP POLICY IF EXISTS "Admin_full_access" ON public.users;
DROP POLICY IF EXISTS "User_own_profile_select" ON public.users;
DROP POLICY IF EXISTS "User_own_profile_update" ON public.users;
DROP POLICY IF EXISTS "Allow_user_creation" ON public.users;

-- DÉSACTIVER complètement RLS sur la table users
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Supprimer et recréer le trigger de manière plus simple
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Créer une fonction trigger ULTRA simple
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    roles,
    status
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    ARRAY['transport']::user_role[],
    'active'
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- S'assurer qu'un admin existe
INSERT INTO public.users (
  id,
  email,
  first_name,
  last_name,
  roles,
  status
) VALUES (
  gen_random_uuid(),
  'sdbkmanagement@gmail.com',
  'Admin',
  'Système',
  ARRAY['admin']::user_role[],
  'active'
) ON CONFLICT (email) DO UPDATE SET
  roles = ARRAY['admin']::user_role[],
  status = 'active';
