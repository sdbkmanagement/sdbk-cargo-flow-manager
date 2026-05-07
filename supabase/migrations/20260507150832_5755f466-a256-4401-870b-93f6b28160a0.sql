CREATE OR REPLACE FUNCTION public.sync_user_roles_to_user_roles_table()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Supprimer les rôles qui ne sont plus assignés
  DELETE FROM public.user_roles
  WHERE user_id = NEW.id
    AND role::text <> ALL(COALESCE(NEW.roles, ARRAY[]::user_role[])::text[]);

  -- Insérer les nouveaux rôles
  IF NEW.roles IS NOT NULL AND array_length(NEW.roles, 1) > 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    SELECT NEW.id, unnest(NEW.roles)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_user_roles ON public.users;
CREATE TRIGGER trg_sync_user_roles
AFTER INSERT OR UPDATE OF roles ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_roles_to_user_roles_table();