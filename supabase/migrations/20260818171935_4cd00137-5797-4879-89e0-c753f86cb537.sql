UPDATE public.users
SET module_permissions = ARRAY(SELECT DISTINCT unnest(COALESCE(module_permissions,'{}') || ARRAY['gmao','maintenance']))
WHERE email = 'moriba.kpamou@societedbk.com';

INSERT INTO public.role_permissions (role, module, permission)
SELECT 'maintenance'::user_role, m, p
FROM (VALUES ('gmao'),('maintenance')) AS mods(m)
CROSS JOIN (VALUES ('read'),('write'),('validate'),('export')) AS perms(p)
WHERE NOT EXISTS (
  SELECT 1 FROM public.role_permissions rp
  WHERE rp.role = 'maintenance'::user_role AND rp.module = mods.m AND rp.permission = perms.p
);