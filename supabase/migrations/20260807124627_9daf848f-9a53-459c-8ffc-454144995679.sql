ALTER TABLE public.employes
  ADD COLUMN IF NOT EXISTS departement TEXT,
  ADD COLUMN IF NOT EXISTS responsable_id UUID REFERENCES public.employes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS societe TEXT,
  ADD COLUMN IF NOT EXISTS site TEXT,
  ADD COLUMN IF NOT EXISTS situation_familiale TEXT,
  ADD COLUMN IF NOT EXISTS nombre_enfants INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS adresse TEXT,
  ADD COLUMN IF NOT EXISTS nationalite TEXT,
  ADD COLUMN IF NOT EXISTS lien_urgence TEXT,
  ADD COLUMN IF NOT EXISTS date_fin_essai DATE,
  ADD COLUMN IF NOT EXISTS salaire_base NUMERIC DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.documents_rh (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employe_id UUID NOT NULL REFERENCES public.employes(id) ON DELETE CASCADE,
  type_document TEXT NOT NULL,
  numero_document TEXT,
  date_emission DATE,
  date_expiration DATE,
  statut TEXT NOT NULL DEFAULT 'valide',
  fichier_url TEXT,
  fichier_nom TEXT,
  commentaire TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents_rh TO authenticated;
GRANT ALL ON public.documents_rh TO service_role;
ALTER TABLE public.documents_rh ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RH gere les documents RH"
ON public.documents_rh FOR ALL TO authenticated
USING (public.is_admin_or_rh(auth.uid()) OR public.has_module_permission(auth.uid(), 'rh'))
WITH CHECK (public.is_admin_or_rh(auth.uid()) OR public.has_module_permission(auth.uid(), 'rh'));

CREATE OR REPLACE FUNCTION public.set_statut_document_rh()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.date_expiration IS NULL THEN
    NEW.statut := 'valide';
  ELSIF NEW.date_expiration < CURRENT_DATE THEN
    NEW.statut := 'expire';
  ELSIF NEW.date_expiration <= CURRENT_DATE + INTERVAL '30 days' THEN
    NEW.statut := 'a_renouveler';
  ELSE
    NEW.statut := 'valide';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_statut_document_rh ON public.documents_rh;
CREATE TRIGGER trg_statut_document_rh
BEFORE INSERT OR UPDATE ON public.documents_rh
FOR EACH ROW EXECUTE FUNCTION public.set_statut_document_rh();

CREATE INDEX IF NOT EXISTS idx_documents_rh_employe ON public.documents_rh(employe_id);

CREATE TABLE IF NOT EXISTS public.alertes_rh_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_alerte TEXT NOT NULL UNIQUE,
  libelle TEXT NOT NULL,
  categorie TEXT NOT NULL,
  delai_jours INTEGER NOT NULL DEFAULT 30,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.alertes_rh_config TO authenticated;
GRANT ALL ON public.alertes_rh_config TO service_role;
ALTER TABLE public.alertes_rh_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RH gere la config des alertes"
ON public.alertes_rh_config FOR ALL TO authenticated
USING (public.is_admin_or_rh(auth.uid()) OR public.has_module_permission(auth.uid(), 'rh'))
WITH CHECK (public.is_admin_or_rh(auth.uid()) OR public.has_module_permission(auth.uid(), 'rh'));

INSERT INTO public.alertes_rh_config (type_alerte, libelle, categorie, delai_jours) VALUES
  ('document_expiration', 'Document RH arrivant à expiration', 'documents', 30),
  ('contrat_echeance', 'Fin de contrat proche', 'carriere', 60),
  ('periode_essai', 'Fin de période d''essai', 'carriere', 15),
  ('depart_retraite', 'Départ en retraite à venir', 'carriere', 180),
  ('visite_medicale', 'Visite médicale à renouveler', 'documents', 30),
  ('formation_obligatoire', 'Formation obligatoire expirée', 'formation', 30),
  ('evaluation_a_realiser', 'Évaluation annuelle à réaliser', 'performance', 30)
ON CONFLICT (type_alerte) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.objectifs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employe_id UUID REFERENCES public.employes(id) ON DELETE CASCADE,
  perimetre TEXT NOT NULL DEFAULT 'individuel',
  departement TEXT,
  service TEXT,
  intitule TEXT NOT NULL,
  description TEXT,
  kpi TEXT,
  valeur_cible NUMERIC,
  valeur_actuelle NUMERIC DEFAULT 0,
  unite TEXT,
  ponderation NUMERIC DEFAULT 100,
  avancement NUMERIC DEFAULT 0,
  date_debut DATE,
  date_echeance DATE,
  responsable_id UUID REFERENCES public.employes(id) ON DELETE SET NULL,
  statut TEXT NOT NULL DEFAULT 'en_cours',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.objectifs TO authenticated;
GRANT ALL ON public.objectifs TO service_role;
ALTER TABLE public.objectifs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RH gere les objectifs"
ON public.objectifs FOR ALL TO authenticated
USING (public.is_admin_or_rh(auth.uid()) OR public.has_module_permission(auth.uid(), 'rh'))
WITH CHECK (public.is_admin_or_rh(auth.uid()) OR public.has_module_permission(auth.uid(), 'rh'));

CREATE TRIGGER trg_objectifs_updated_at
BEFORE UPDATE ON public.objectifs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.competences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  libelle TEXT NOT NULL,
  categorie TEXT NOT NULL DEFAULT 'technique',
  description TEXT,
  niveau_requis INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.competences TO authenticated;
GRANT ALL ON public.competences TO service_role;
ALTER TABLE public.competences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RH gere les competences"
ON public.competences FOR ALL TO authenticated
USING (public.is_admin_or_rh(auth.uid()) OR public.has_module_permission(auth.uid(), 'rh'))
WITH CHECK (public.is_admin_or_rh(auth.uid()) OR public.has_module_permission(auth.uid(), 'rh'));

CREATE TABLE IF NOT EXISTS public.competences_employes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employe_id UUID NOT NULL REFERENCES public.employes(id) ON DELETE CASCADE,
  competence_id UUID NOT NULL REFERENCES public.competences(id) ON DELETE CASCADE,
  niveau INTEGER NOT NULL DEFAULT 1,
  certifie BOOLEAN NOT NULL DEFAULT false,
  annees_experience NUMERIC DEFAULT 0,
  date_evaluation DATE DEFAULT CURRENT_DATE,
  potentiel INTEGER,
  commentaire TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employe_id, competence_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.competences_employes TO authenticated;
GRANT ALL ON public.competences_employes TO service_role;
ALTER TABLE public.competences_employes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RH gere les competences employes"
ON public.competences_employes FOR ALL TO authenticated
USING (public.is_admin_or_rh(auth.uid()) OR public.has_module_permission(auth.uid(), 'rh'))
WITH CHECK (public.is_admin_or_rh(auth.uid()) OR public.has_module_permission(auth.uid(), 'rh'));

CREATE TABLE IF NOT EXISTS public.droits_conges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employe_id UUID NOT NULL REFERENCES public.employes(id) ON DELETE CASCADE,
  annee INTEGER NOT NULL,
  jours_acquis NUMERIC NOT NULL DEFAULT 0,
  jours_consommes NUMERIC NOT NULL DEFAULT 0,
  commentaire TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employe_id, annee)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.droits_conges TO authenticated;
GRANT ALL ON public.droits_conges TO service_role;
ALTER TABLE public.droits_conges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RH gere les droits conges"
ON public.droits_conges FOR ALL TO authenticated
USING (public.is_admin_or_rh(auth.uid()) OR public.has_module_permission(auth.uid(), 'rh'))
WITH CHECK (public.is_admin_or_rh(auth.uid()) OR public.has_module_permission(auth.uid(), 'rh'));

CREATE OR REPLACE FUNCTION public.get_rh_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
        WHERE date_debut <= CURRENT_DATE AND date_fin >= CURRENT_DATE),
    'contrats_echeance', (SELECT count(*) FROM public.employes
        WHERE date_fin_contrat IS NOT NULL AND date_fin_contrat BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '60 days'),
    'documents_expirants', (SELECT count(*) FROM public.documents_rh
        WHERE date_expiration IS NOT NULL AND date_expiration <= CURRENT_DATE + INTERVAL '30 days'),
    'visites_medicales', (SELECT count(*) FROM public.employes
        WHERE date_prochaine_visite IS NOT NULL AND date_prochaine_visite <= CURRENT_DATE + INTERVAL '30 days'),
    'departs_retraite', (SELECT count(*) FROM public.employes
        WHERE date_naissance IS NOT NULL AND extract(year from age(date_naissance)) >= 59)
  ) INTO v;

  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_alertes_rh()
RETURNS TABLE(
  type_alerte TEXT,
  categorie TEXT,
  employe_id UUID,
  nom_complet TEXT,
  service TEXT,
  message TEXT,
  date_echeance DATE,
  jours_restants INTEGER,
  priorite TEXT
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF NOT (public.is_admin_or_rh(auth.uid()) OR public.has_module_permission(auth.uid(), 'rh')) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  RETURN QUERY
  WITH cfg AS (SELECT * FROM public.alertes_rh_config WHERE actif)
  SELECT d.type_document::text,
         'documents'::text,
         e.id,
         (e.nom || ' ' || e.prenom)::text,
         e.service::text,
         ('Document ' || d.type_document || ' expire le ' || to_char(d.date_expiration,'DD/MM/YYYY'))::text,
         d.date_expiration,
         (d.date_expiration - CURRENT_DATE)::int,
         CASE WHEN d.date_expiration < CURRENT_DATE THEN 'critique'
              WHEN d.date_expiration <= CURRENT_DATE + INTERVAL '15 days' THEN 'importante'
              ELSE 'normale' END::text
  FROM public.documents_rh d
  JOIN public.employes e ON e.id = d.employe_id
  WHERE d.date_expiration IS NOT NULL
    AND d.date_expiration <= CURRENT_DATE + ((SELECT coalesce(max(delai_jours),30) FROM cfg WHERE type_alerte='document_expiration') || ' days')::interval

  UNION ALL
  SELECT 'contrat_echeance', 'carriere', e.id, (e.nom || ' ' || e.prenom)::text, e.service::text,
         ('Fin de contrat le ' || to_char(e.date_fin_contrat,'DD/MM/YYYY'))::text,
         e.date_fin_contrat, (e.date_fin_contrat - CURRENT_DATE)::int,
         CASE WHEN e.date_fin_contrat < CURRENT_DATE THEN 'critique'
              WHEN e.date_fin_contrat <= CURRENT_DATE + INTERVAL '30 days' THEN 'importante'
              ELSE 'normale' END::text
  FROM public.employes e
  WHERE e.date_fin_contrat IS NOT NULL
    AND e.date_fin_contrat <= CURRENT_DATE + ((SELECT coalesce(max(delai_jours),60) FROM cfg WHERE type_alerte='contrat_echeance') || ' days')::interval

  UNION ALL
  SELECT 'periode_essai', 'carriere', e.id, (e.nom || ' ' || e.prenom)::text, e.service::text,
         ('Fin de période d''essai le ' || to_char(e.date_fin_essai,'DD/MM/YYYY'))::text,
         e.date_fin_essai, (e.date_fin_essai - CURRENT_DATE)::int, 'importante'::text
  FROM public.employes e
  WHERE e.date_fin_essai IS NOT NULL
    AND e.date_fin_essai BETWEEN CURRENT_DATE - INTERVAL '7 days'
      AND CURRENT_DATE + ((SELECT coalesce(max(delai_jours),15) FROM cfg WHERE type_alerte='periode_essai') || ' days')::interval

  UNION ALL
  SELECT 'visite_medicale', 'documents', e.id, (e.nom || ' ' || e.prenom)::text, e.service::text,
         ('Visite médicale à renouveler le ' || to_char(e.date_prochaine_visite,'DD/MM/YYYY'))::text,
         e.date_prochaine_visite, (e.date_prochaine_visite - CURRENT_DATE)::int,
         CASE WHEN e.date_prochaine_visite < CURRENT_DATE THEN 'critique' ELSE 'importante' END::text
  FROM public.employes e
  WHERE e.date_prochaine_visite IS NOT NULL
    AND e.date_prochaine_visite <= CURRENT_DATE + ((SELECT coalesce(max(delai_jours),30) FROM cfg WHERE type_alerte='visite_medicale') || ' days')::interval

  UNION ALL
  SELECT 'depart_retraite', 'carriere', e.id, (e.nom || ' ' || e.prenom)::text, e.service::text,
         ('Départ en retraite prévu (âge ' || extract(year from age(e.date_naissance))::int || ' ans)')::text,
         (e.date_naissance + INTERVAL '60 years')::date,
         ((e.date_naissance + INTERVAL '60 years')::date - CURRENT_DATE)::int,
         'normale'::text
  FROM public.employes e
  WHERE e.date_naissance IS NOT NULL
    AND (e.date_naissance + INTERVAL '60 years')::date <= CURRENT_DATE + ((SELECT coalesce(max(delai_jours),180) FROM cfg WHERE type_alerte='depart_retraite') || ' days')::interval

  UNION ALL
  SELECT 'formation_obligatoire', 'formation', e.id, (e.nom || ' ' || e.prenom)::text, e.service::text,
         ('Formation ' || f.nom_formation || ' expire le ' || to_char(f.date_expiration,'DD/MM/YYYY'))::text,
         f.date_expiration, (f.date_expiration - CURRENT_DATE)::int,
         CASE WHEN f.date_expiration < CURRENT_DATE THEN 'critique' ELSE 'importante' END::text
  FROM public.formations_employes f
  JOIN public.employes e ON e.id = f.employe_id
  WHERE f.date_expiration IS NOT NULL AND coalesce(f.obligatoire,false)
    AND f.date_expiration <= CURRENT_DATE + ((SELECT coalesce(max(delai_jours),30) FROM cfg WHERE type_alerte='formation_obligatoire') || ' days')::interval

  ORDER BY 8 ASC;
END;
$$;