
-- Ajouter les rôles transport et administratif à aguibou.diallo dans user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, r.role
FROM public.users u
CROSS JOIN (VALUES ('transport'::user_role), ('administratif'::user_role)) AS r(role)
WHERE u.email = 'aguibou.diallo@societedbk.com'
ON CONFLICT (user_id, role) DO NOTHING;
