CREATE OR REPLACE FUNCTION public.get_rh_employes()
RETURNS SETOF public.employes
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT (
    public.is_admin_or_rh(auth.uid())
    OR public.has_module_permission(auth.uid(), 'rh')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to view employees';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.employes
  ORDER BY nom ASC, prenom ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_rh_employes() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_rh_employes() TO authenticated;