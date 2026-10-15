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
  SELECT e.id, e.nom, e.prenom, e.poste, e.service, e.statut
  FROM public.employes e
  WHERE e.statut = 'actif'
  ORDER BY e.nom ASC, e.prenom ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_formations_collaborateurs() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_formations_collaborateurs() TO authenticated;