
UPDATE public.users 
SET module_permissions = array_append(
  COALESCE(module_permissions, ARRAY[]::text[]), 
  'societe'
)
WHERE email IN ('aguibou.diallo@societedbk.com', 'aissatou.diallo@societedbk.com')
AND NOT ('societe' = ANY(COALESCE(module_permissions, ARRAY[]::text[])));
