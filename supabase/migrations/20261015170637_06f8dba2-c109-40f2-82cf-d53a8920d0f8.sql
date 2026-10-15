CREATE TABLE public.registre_appels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_fiche TEXT NOT NULL UNIQUE,
  date_appel DATE NOT NULL,
  heure_reception TEXT NOT NULL,
  recepteur_appel TEXT NOT NULL,
  appelant_nom TEXT NOT NULL,
  qualite_appelant TEXT,
  contact_telephonique TEXT,
  numero_tracteur TEXT NOT NULL,
  numero_citerne TEXT,
  produit_transporte TEXT,
  quantite_chargee NUMERIC,
  localisation TEXT NOT NULL,
  motif_appel TEXT NOT NULL,
  niveau_gravite TEXT NOT NULL DEFAULT 'G1',
  description_faits TEXT NOT NULL,
  nombre_blesses INTEGER DEFAULT 0,
  deversement BOOLEAN DEFAULT false,
  volume_deverse NUMERIC,
  heure_alerte_hierarchie TEXT,
  heure_depart_equipe TEXT,
  delai_mobilisation_min INTEGER,
  heure_arrivee_lieu TEXT,
  heure_fin_intervention TEXT,
  activation_plan_urgence BOOLEAN DEFAULT false,
  secours_externes TEXT,
  mesures_urgence TEXT,
  mesures_correctives TEXT,
  recommandations TEXT,
  statut TEXT NOT NULL DEFAULT 'nouveau' CHECK (statut IN ('nouveau', 'en_cours', 'clos')),
  date_cloture TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.registre_appels TO authenticated;
GRANT ALL ON public.registre_appels TO service_role;

ALTER TABLE public.registre_appels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs connectés gèrent le registre d'appels" ON public.registre_appels
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.generate_appel_fiche_numero()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_fiche IS NULL OR NEW.numero_fiche = '' THEN
    NEW.numero_fiche := 'RA-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('public.registre_appels_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE SEQUENCE IF NOT EXISTS public.registre_appels_seq START 1;

CREATE TRIGGER set_appel_fiche_numero
  BEFORE INSERT ON public.registre_appels
  FOR EACH ROW EXECUTE FUNCTION public.generate_appel_fiche_numero();

CREATE TRIGGER update_registre_appels_updated_at
  BEFORE UPDATE ON public.registre_appels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.calculer_delai_mobilisation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.heure_reception ~ '^\d{2}:\d{2}' AND NEW.heure_depart_equipe ~ '^\d{2}:\d{2}' THEN
    NEW.delai_mobilisation_min :=
      (SPLIT_PART(NEW.heure_depart_equipe, ':', 1)::INT * 60 + SPLIT_PART(NEW.heure_depart_equipe, ':', 2)::INT)
      - (SPLIT_PART(NEW.heure_reception, ':', 1)::INT * 60 + SPLIT_PART(NEW.heure_reception, ':', 2)::INT);
  END IF;
  IF NEW.statut = 'clos' AND NEW.date_cloture IS NULL THEN
    NEW.date_cloture := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_appel_delai_mobilisation
  BEFORE INSERT OR UPDATE ON public.registre_appels
  FOR EACH ROW EXECUTE FUNCTION public.calculer_delai_mobilisation();