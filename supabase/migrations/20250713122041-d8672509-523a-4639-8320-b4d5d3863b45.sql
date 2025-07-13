
-- Vérification et correction de l'utilisateur admin

-- 1. Vérifier la structure actuelle de la table users
-- et s'assurer que admin@sdbk.com a bien le rôle admin

-- 2. Supprimer et recréer l'utilisateur admin avec les bons paramètres
DELETE FROM public.users WHERE email = 'admin@sdbk.com';

-- 3. Créer l'utilisateur admin avec les bons rôles
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
  'admin_temp_password'
);

-- 4. Vérifier que la fonction is_admin fonctionne
-- En testant avec une requête de diagnostic
SELECT 
  email,
  roles,
  status,
  'admin' = ANY(roles) as has_admin_role
FROM public.users 
WHERE email = 'admin@sdbk.com';
