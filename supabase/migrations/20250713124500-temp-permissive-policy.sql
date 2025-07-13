
-- Politique temporaire très permissive pour contourner les problèmes RLS
-- Cette politique sera remplacée par une politique plus stricte une fois l'authentification en place

-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "Admin_peut_tout_faire" ON public.users;
DROP POLICY IF EXISTS "Utilisateur_peut_voir_son_profil" ON public.users;
DROP POLICY IF EXISTS "Utilisateur_peut_modifier_son_profil" ON public.users;

-- Créer des politiques temporaires très permissives
CREATE POLICY "Politique_temporaire_permissive_SELECT" ON public.users
FOR SELECT TO authenticated, anon
USING (true);

CREATE POLICY "Politique_temporaire_permissive_INSERT" ON public.users
FOR INSERT TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Politique_temporaire_permissive_UPDATE" ON public.users
FOR UPDATE TO authenticated, anon
USING (true)
WITH CHECK (true);

-- Politique pour DELETE (plus restrictive)
CREATE POLICY "Politique_temporaire_permissive_DELETE" ON public.users
FOR DELETE TO authenticated
USING (true);

-- Créer une fonction RPC pour créer des utilisateurs en contournant RLS
CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email text,
  p_first_name text,
  p_last_name text,
  p_role text,
  p_status text DEFAULT 'active'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  new_user_id := gen_random_uuid();
  
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
    new_user_id,
    p_email,
    p_first_name,
    p_last_name,
    ARRAY[p_role::user_role],
    p_status,
    'temporary_password_hash',
    now(),
    now()
  );
  
  RETURN new_user_id;
END;
$$;
