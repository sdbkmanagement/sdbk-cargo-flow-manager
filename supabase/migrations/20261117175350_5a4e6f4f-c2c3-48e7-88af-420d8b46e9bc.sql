ALTER TABLE public.fiches_evaluation ADD COLUMN note_initiale numeric NULL;
COMMENT ON COLUMN public.fiches_evaluation.note_initiale IS 'Note initiale de la fiche d evaluation, en pourcentage.';
COMMENT ON COLUMN public.fiches_evaluation.note_obtenue IS 'Note finale de la fiche d evaluation, en pourcentage; conserve les notes historiques.';