UPDATE public.users
SET module_permissions = ARRAY['fleet','validations']::text[],
    updated_at = now()
WHERE email = 'moriba.kpamou@societedbk.com';