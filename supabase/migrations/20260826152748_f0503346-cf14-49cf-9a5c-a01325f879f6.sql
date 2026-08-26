CREATE OR REPLACE FUNCTION public.get_rh_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF NOT (public.is_admin_or_rh(auth.uid()) OR public.has_module_permission(auth.uid(), 'rh')) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  SELECT jsonb_build_object(
    'effectif_total', (SELECT count(*) FROM public.employes),
    'effectif_actif', (SELECT count(*) FROM public.employes WHERE statut = 'actif'),
    'effectif_inactif', (SELECT count(*) FROM public.employes WHERE statut <> 'actif'),
    'hommes', (SELECT count(*) FROM public.employes WHERE lower(coalesce(genre,'')) IN ('m','masculin','homme')),
    'femmes', (SELECT count(*) FROM public.employes WHERE lower(coalesce(genre,'')) IN ('f','feminin','féminin','femme')),
    'age_moyen', (SELECT round(avg(extract(year from age(date_naissance)))::numeric, 1) FROM public.employes WHERE date_naissance IS NOT NULL),
    'anciennete_moyenne', (SELECT round(avg(extract(year from age(date_embauche)))::numeric, 1) FROM public.employes WHERE date_embauche IS NOT NULL),
    'masse_salariale', (SELECT coalesce(sum(salaire_base),0) FROM public.employes WHERE statut = 'actif'),
    'par_departement', (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM (
        SELECT coalesce(nullif(departement,''), service, 'Non défini') AS name, count(*) AS value
        FROM public.employes GROUP BY 1 ORDER BY 2 DESC) t),
    'par_service', (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM (
        SELECT coalesce(nullif(service,''),'Non défini') AS name, count(*) AS value
        FROM public.employes GROUP BY 1 ORDER BY 2 DESC) t),
    'par_fonction', (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM (
        SELECT coalesce(nullif(fonction,''), poste, 'Non défini') AS name, count(*) AS value
        FROM public.employes GROUP BY 1 ORDER BY 2 DESC LIMIT 12) t),
    'par_contrat', (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM (
        SELECT coalesce(nullif(type_contrat,''),'Non défini') AS name, count(*) AS value
        FROM public.employes GROUP BY 1 ORDER BY 2 DESC) t),
    'pyramide_ages', (SELECT coalesce(jsonb_agg(t ORDER BY t.name), '[]'::jsonb) FROM (
        SELECT CASE
                 WHEN extract(year from age(date_naissance)) < 25 THEN '< 25 ans'
                 WHEN extract(year from age(date_naissance)) < 35 THEN '25-34 ans'
                 WHEN extract(year from age(date_naissance)) < 45 THEN '35-44 ans'
                 WHEN extract(year from age(date_naissance)) < 55 THEN '45-54 ans'
                 ELSE '55 ans et +' END AS name,
               count(*) FILTER (WHERE lower(coalesce(genre,'')) IN ('m','masculin','homme')) AS hommes,
               count(*) FILTER (WHERE lower(coalesce(genre,'')) IN ('f','feminin','féminin','femme')) AS femmes,
               count(*) AS value
        FROM public.employes WHERE date_naissance IS NOT NULL GROUP BY 1) t),
    'absences_en_cours', (SELECT count(*) FROM public.absences
        WHERE statut = 'approuve' AND date_debut <= CURRENT_DATE AND date_fin >= CURRENT_DATE),
    'conges_en_cours', (SELECT count(*) FROM public.conges
        WHERE lower(coalesce(statut,'')) IN ('approuve','approuvé','valide','validé','en_cours')
          AND date_debut <= CURRENT_DATE AND date_fin >= CURRENT_DATE),
    'contrats_echeance', (SELECT count(*) FROM public.employes
        WHERE date_fin_contrat IS NOT NULL AND date_fin_contrat BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '60 days'),
    'documents_expirants', (SELECT count(*) FROM public.documents_rh
        WHERE date_expiration IS NOT NULL AND date_expiration BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'),
    'visites_medicales', (SELECT count(*) FROM public.employes
        WHERE date_prochaine_visite IS NOT NULL AND date_prochaine_visite BETWEEN CURRENT_DATE - INTERVAL '365 days' AND CURRENT_DATE + INTERVAL '30 days'),
    'departs_retraite', (SELECT count(*) FROM public.employes
        WHERE statut = 'actif' AND date_naissance IS NOT NULL AND extract(year from age(date_naissance)) >= 59)
  ) INTO v;

  RETURN v;
END;
$function$;