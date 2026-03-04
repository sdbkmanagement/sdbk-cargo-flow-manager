
UPDATE public.users 
SET module_permissions = array_append(
  COALESCE(module_permissions, ARRAY[]::text[]), 
  'validations'
)
WHERE email IN ('aguibou.diallo@societedbk.com', 'aissatou.diallo@societedbk.com')
AND NOT ('validations' = ANY(COALESCE(module_permissions, ARRAY[]::text[])));
