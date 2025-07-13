
-- D'abord, vérifier et corriger le type énuméré user_role
DO $$ 
BEGIN
    -- Supprimer le type s'il existe déjà (pour le recréer proprement)
    DROP TYPE IF EXISTS user_role CASCADE;
    
    -- Créer le type énuméré user_role avec toutes les valeurs nécessaires
    CREATE TYPE user_role AS ENUM (
        'admin',
        'transport', 
        'maintenance',
        'rh',
        'administratif',
        'hsecq',
        'obc',
        'facturation',
        'direction',
        'transitaire',
        'directeur_exploitation'
    );
END $$;

-- Recréer la table users avec la bonne structure
DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Activer RLS sur la table users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Recréer les politiques RLS
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

-- Politique permissive temporaire pour permettre la création d'utilisateurs
CREATE POLICY "Allow_user_creation" ON public.users
FOR INSERT TO authenticated
WITH CHECK (true);

-- Recréer le trigger pour créer automatiquement le profil utilisateur
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
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le nouveau trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Corriger la fonction is_admin pour qu'elle fonctionne avec le nouveau type
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
