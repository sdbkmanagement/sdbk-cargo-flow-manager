
-- Synchroniser les rôles de la table users vers user_roles
-- pour tous les utilisateurs qui n'ont pas encore d'entrée

INSERT INTO public.user_roles (user_id, role)
SELECT 
  u.id,
  unnest(u.roles)::user_role
FROM public.users u
WHERE u.id NOT IN (
  SELECT DISTINCT user_id FROM public.user_roles
)
AND u.status = 'active'
ON CONFLICT (user_id, role) DO NOTHING;

-- Log les utilisateurs synchronisés
DO $$
DECLARE
  synced_count INTEGER;
BEGIN
  GET DIAGNOSTICS synced_count = ROW_COUNT;
  RAISE NOTICE 'Synchronisé % utilisateurs vers user_roles', synced_count;
END $$;
