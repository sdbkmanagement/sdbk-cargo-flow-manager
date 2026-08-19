CREATE TABLE IF NOT EXISTS public.controles_annuels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipement_id uuid REFERENCES public.gmao_equipements(id) ON DELETE SET NULL,
  equipement_remorque_id uuid REFERENCES public.gmao_equipements(id) ON DELETE SET NULL,
  immatriculation_tracteur text,
  immatriculation_remorque text,
  conducteur_nom text,
  conducteur_contact text,
  date_controle date NOT NULL,
  date_prochain_controle date,
  resultat text NOT NULL DEFAULT 'accepte',
  motif_rejet text,
  observations text,
  action_corrective text,
  responsable_action text,
  date_correction_prevue date,
  date_correction date,
  date_contre_visite date,
  resultat_contre_visite text,
  documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid,
  created_by_nom text,
  updated_by uuid,
  updated_by_nom text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.controles_annuels TO authenticated;
GRANT ALL ON public.controles_annuels TO service_role;

ALTER TABLE public.controles_annuels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture controles annuels authentifies"
  ON public.controles_annuels FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gestion controles annuels authentifies"
  ON public.controles_annuels FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.controles_annuels_echeance()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.date_prochain_controle := (NEW.date_controle + INTERVAL '12 months')::date;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_controles_annuels_echeance ON public.controles_annuels;
CREATE TRIGGER trg_controles_annuels_echeance
BEFORE INSERT OR UPDATE ON public.controles_annuels
FOR EACH ROW EXECUTE FUNCTION public.controles_annuels_echeance();

CREATE INDEX IF NOT EXISTS idx_controles_annuels_date ON public.controles_annuels (date_controle DESC);