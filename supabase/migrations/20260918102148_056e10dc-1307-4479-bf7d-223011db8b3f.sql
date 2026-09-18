CREATE TABLE public.fiches_evaluation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chauffeur_id uuid NOT NULL REFERENCES public.chauffeurs(id) ON DELETE CASCADE,
  type_fiche text NOT NULL CHECK (type_fiche IN ('theorique','pratique')),
  date_fiche date NOT NULL DEFAULT CURRENT_DATE,
  note_obtenue numeric,
  formateur_nom text,
  commentaire text,
  fichier_nom text,
  fichier_url text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fiches_evaluation TO authenticated;
GRANT ALL ON public.fiches_evaluation TO service_role;

ALTER TABLE public.fiches_evaluation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view fiches_evaluation" ON public.fiches_evaluation FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert fiches_evaluation" ON public.fiches_evaluation FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update fiches_evaluation" ON public.fiches_evaluation FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete fiches_evaluation" ON public.fiches_evaluation FOR DELETE TO authenticated USING (true);

CREATE INDEX idx_fiches_evaluation_chauffeur ON public.fiches_evaluation(chauffeur_id);

CREATE TRIGGER update_fiches_evaluation_updated_at
BEFORE UPDATE ON public.fiches_evaluation
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();