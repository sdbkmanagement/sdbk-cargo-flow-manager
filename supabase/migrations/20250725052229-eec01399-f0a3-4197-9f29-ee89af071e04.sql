-- Créer l'utilisateur administrateur par défaut
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
  'SDBK',
  ARRAY['admin']::user_role[],
  'active',
  'managed_by_supabase_auth',
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  roles = EXCLUDED.roles,
  status = EXCLUDED.status,
  updated_at = NOW();