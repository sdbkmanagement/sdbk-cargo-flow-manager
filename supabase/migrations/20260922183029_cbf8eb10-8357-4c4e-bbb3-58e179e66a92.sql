CREATE TABLE public.controles_historique (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_controle text NOT NULL,
  controle_id uuid NOT NULL,
  date_controle date,
  date_prochain_controle date,
  resultat text,
  motif_rejet text,
  observations text,
  documents jsonb DEFAULT '[]'::jsonb,
  enregistre_par text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.controles_historique TO authenticated;
GRANT ALL ON public.controles_historique TO service_role;

ALTER TABLE public.controles_historique ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Historique des controles lisible par les utilisateurs"
  ON public.controles_historique FOR SELECT TO authenticated USING (true);

CREATE INDEX idx_controles_historique_controle ON public.controles_historique (type_controle, controle_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.archiver_controle_precedent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.date_controle IS DISTINCT FROM OLD.date_controle THEN
    INSERT INTO public.controles_historique(
      type_controle, controle_id, date_controle, date_prochain_controle,
      resultat, motif_rejet, observations, documents, enregistre_par
    ) VALUES (
      TG_ARGV[0], OLD.id, OLD.date_controle, OLD.date_prochain_controle,
      OLD.resultat, OLD.motif_rejet, OLD.observations,
      COALESCE(OLD.documents, '[]'::jsonb), COALESCE(OLD.updated_by_nom, OLD.created_by_nom)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_archiver_socotac
  BEFORE UPDATE ON public.socotac_controles
  FOR EACH ROW EXECUTE FUNCTION public.archiver_controle_precedent('socotac');

CREATE TRIGGER trg_archiver_annuel
  BEFORE UPDATE ON public.controles_annuels
  FOR EACH ROW EXECUTE FUNCTION public.archiver_controle_precedent('annuel');