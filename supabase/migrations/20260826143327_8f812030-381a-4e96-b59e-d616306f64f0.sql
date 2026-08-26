ALTER TABLE public.employes
  ADD COLUMN IF NOT EXISTS organisme_visite_medicale text,
  ADD COLUMN IF NOT EXISTS age_retraite integer NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS date_depart_retraite date,
  ADD COLUMN IF NOT EXISTS anciennete_annees numeric(6,2),
  ADD COLUMN IF NOT EXISTS jours_restants_contrat integer;

CREATE OR REPLACE FUNCTION public.employes_calculs_auto()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.date_naissance IS NOT NULL THEN
    NEW.age := date_part('year', age(CURRENT_DATE, NEW.date_naissance))::int;
    NEW.date_depart_retraite := (NEW.date_naissance + (COALESCE(NEW.age_retraite,60) || ' years')::interval)::date;
  ELSE
    NEW.age := NULL;
    NEW.date_depart_retraite := NULL;
  END IF;

  IF NEW.date_embauche IS NOT NULL THEN
    NEW.anciennete_annees := ROUND((CURRENT_DATE - NEW.date_embauche)::numeric / 365.25, 2);
    NEW.anciennete_transporteur :=
      date_part('year', age(CURRENT_DATE, NEW.date_embauche))::int || ' an(s) ' ||
      date_part('month', age(CURRENT_DATE, NEW.date_embauche))::int || ' mois';
    IF NEW.date_fin_contrat IS NULL AND NEW.type_contrat IN ('CDD','CS','CA','Stage','Interim') THEN
      NEW.date_fin_contrat := (NEW.date_embauche + interval '12 months')::date;
    END IF;
  ELSE
    NEW.anciennete_annees := NULL;
    NEW.anciennete_transporteur := NULL;
  END IF;

  IF NEW.date_fin_contrat IS NOT NULL THEN
    NEW.jours_restants_contrat := NEW.date_fin_contrat - CURRENT_DATE;
  ELSE
    NEW.jours_restants_contrat := NULL;
  END IF;

  IF NEW.date_prochaine_visite IS NULL AND NEW.date_derniere_visite_medicale IS NOT NULL THEN
    NEW.date_prochaine_visite := (NEW.date_derniere_visite_medicale + interval '12 months')::date;
  END IF;

  IF NEW.date_prochaine_visite IS NOT NULL THEN
    NEW.jours_restants_visite := NEW.date_prochaine_visite - CURRENT_DATE;
    IF NEW.statut_visite_medicale IS NULL OR NEW.statut_visite_medicale IN ('a_jour','expire','a_renouveler') THEN
      NEW.statut_visite_medicale := CASE
        WHEN NEW.date_prochaine_visite < CURRENT_DATE THEN 'expire'
        WHEN NEW.date_prochaine_visite <= CURRENT_DATE + 30 THEN 'a_renouveler'
        ELSE 'a_jour' END;
    END IF;
  ELSE
    NEW.jours_restants_visite := NULL;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_employes_calculs_auto ON public.employes;
CREATE TRIGGER trg_employes_calculs_auto
BEFORE INSERT OR UPDATE ON public.employes
FOR EACH ROW EXECUTE FUNCTION public.employes_calculs_auto();