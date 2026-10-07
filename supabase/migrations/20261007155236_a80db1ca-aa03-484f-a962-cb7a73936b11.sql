CREATE OR REPLACE FUNCTION public.get_chauffeurs_fonction_rh()
RETURNS TABLE(chauffeur_id uuid, fonction text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT e.chauffeur_id, COALESCE(e.fonction, e.poste)::text FROM employes e WHERE e.chauffeur_id IS NOT NULL
$$;
GRANT EXECUTE ON FUNCTION public.get_chauffeurs_fonction_rh() TO authenticated;