CREATE OR REPLACE FUNCTION public.count_employes()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*) FROM public.employes;
$$;