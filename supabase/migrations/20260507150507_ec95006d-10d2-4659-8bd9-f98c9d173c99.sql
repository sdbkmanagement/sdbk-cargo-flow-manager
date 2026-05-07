INSERT INTO public.user_roles (user_id, role)
SELECT u.id, unnest(u.roles)::user_role
FROM public.users u
WHERE array_length(u.roles, 1) > 0
ON CONFLICT (user_id, role) DO NOTHING;