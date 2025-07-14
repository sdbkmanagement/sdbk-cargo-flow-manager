
-- Vérifier les données du compte igamerzcsl@gmail.com
SELECT 
  id,
  email,
  first_name,
  last_name,
  roles,
  status,
  module_permissions,
  created_at
FROM public.users 
WHERE email = 'igamerzcsl@gmail.com';

-- Vérifier s'il existe aussi dans auth.users
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users 
WHERE email = 'igamerzcsl@gmail.com';

-- Corriger le compte maintenance pour s'assurer qu'il a les bons rôles et permissions
UPDATE public.users 
SET 
  roles = ARRAY['maintenance']::user_role[],
  module_permissions = ARRAY['fleet', 'dashboard']::text[],
  status = 'active',
  updated_at = NOW()
WHERE email = 'igamerzcsl@gmail.com';

-- S'assurer que le compte admin principal existe avec tous les accès
INSERT INTO public.users (
  id,
  email,
  first_name,
  last_name,
  roles,
  status,
  module_permissions,
  password_hash
) VALUES (
  gen_random_uuid(),
  'sdbkmanagement@gmail.com',
  'Admin',
  'Système',
  ARRAY['admin']::user_role[],
  'active',
  ARRAY['fleet', 'drivers', 'rh', 'cargo', 'missions', 'billing', 'dashboard']::text[],
  'managed_by_supabase_auth'
) ON CONFLICT (email) DO UPDATE SET
  roles = ARRAY['admin']::user_role[],
  module_permissions = ARRAY['fleet', 'drivers', 'rh', 'cargo', 'missions', 'billing', 'dashboard']::text[],
  status = 'active',
  updated_at = NOW();
