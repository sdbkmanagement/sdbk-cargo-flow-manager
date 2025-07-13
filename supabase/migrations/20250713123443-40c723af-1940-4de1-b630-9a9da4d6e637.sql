
-- Créer une fonction pour gérer automatiquement la création du profil utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer automatiquement un profil utilisateur basique lors de l'inscription
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
    ARRAY['transport']::user_role[], -- Rôle par défaut
    'active',
    'managed_by_supabase_auth',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger pour auto-créer le profil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fonction pour créer un utilisateur via Supabase Auth (pour les admins)
CREATE OR REPLACE FUNCTION public.admin_create_user_with_auth(
  p_email text,
  p_password text,
  p_first_name text,
  p_last_name text,
  p_role text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Cette fonction sera appelée côté client avec supabase.auth.admin.createUser
  -- Puis on mettra à jour le rôle
  UPDATE public.users 
  SET 
    roles = ARRAY[p_role::user_role],
    first_name = p_first_name,
    last_name = p_last_name,
    updated_at = NOW()
  WHERE email = p_email;
  
  RETURN json_build_object('success', true);
END;
$$;

-- Fonction améliorée pour vérifier si l'utilisateur actuel est admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Vérifier via auth.uid() maintenant que nous utilisons Supabase Auth
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

-- Créer un utilisateur admin par défaut s'il n'existe pas
DO $$
DECLARE
  admin_exists BOOLEAN;
BEGIN
  -- Vérifier s'il existe déjà un admin
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE 'admin' = ANY(roles) AND status = 'active'
  ) INTO admin_exists;
  
  -- Si aucun admin n'existe, on devra en créer un manuellement via Supabase Auth
  IF NOT admin_exists THEN
    RAISE NOTICE 'Aucun utilisateur admin trouvé. Vous devrez créer un compte admin via Supabase Auth Dashboard ou l''interface.';
  END IF;
END $$;
