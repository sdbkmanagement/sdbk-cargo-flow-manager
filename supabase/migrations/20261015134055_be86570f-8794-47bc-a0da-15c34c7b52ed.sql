CREATE OR REPLACE FUNCTION public.get_formations_collaborateurs()
RETURNS TABLE(id uuid, nom text, prenom text, poste text, service text, statut text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  RETURN QUERY
  SELECT e.id, e.nom::text, e.prenom::text, e.poste::text, e.service::text, e.statut::text
  FROM public.employes e
  WHERE e.statut = 'actif'
    AND e.chauffeur_id IS NULL
  ORDER BY e.nom ASC, e.prenom ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_formations_collaborateurs() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_formations_collaborateurs() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_formations_collaborateurs() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_formations_collaborateurs() TO service_role;