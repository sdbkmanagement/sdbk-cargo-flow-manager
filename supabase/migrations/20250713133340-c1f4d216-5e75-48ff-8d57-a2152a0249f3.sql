
-- Créer une politique temporaire très permissive pour permettre la création d'utilisateurs
DROP POLICY IF EXISTS "Politique_temporaire_permissive_INSERT" ON public.users;
DROP POLICY IF EXISTS "Politique_temporaire_permissive_SELECT" ON public.users;
DROP POLICY IF EXISTS "Politique_temporaire_permissive_UPDATE" ON public.users;
DROP POLICY IF EXISTS "Politique_temporaire_permissive_DELETE" ON public.users;

-- Politique INSERT très permissive temporairement
CREATE POLICY "Politique_temporaire_permissive_INSERT" ON public.users
FOR INSERT TO authenticated, anon
WITH CHECK (true);

-- Politique SELECT permissive
CREATE POLICY "Politique_temporaire_permissive_SELECT" ON public.users
FOR SELECT TO authenticated, anon
USING (true);

-- Politique UPDATE permissive
CREATE POLICY "Politique_temporaire_permissive_UPDATE" ON public.users
FOR UPDATE TO authenticated, anon
USING (true)
WITH CHECK (true);

-- Politique DELETE permissive
CREATE POLICY "Politique_temporaire_permissive_DELETE" ON public.users
FOR DELETE TO authenticated, anon
USING (true);

-- S'assurer que la fonction handle_new_user existe et fonctionne
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

-- Recréer le trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
