CREATE OR REPLACE FUNCTION public.get_tbm_collaborateurs()
RETURNS TABLE(id uuid, nom text, prenom text, statut text, poste text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.id, e.nom, e.prenom, e.statut, e.poste
  FROM public.employes e
  WHERE e.statut = 'actif'
    AND e.chauffeur_id IS NULL
    AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.status = 'active')
  ORDER BY e.nom;
$$;