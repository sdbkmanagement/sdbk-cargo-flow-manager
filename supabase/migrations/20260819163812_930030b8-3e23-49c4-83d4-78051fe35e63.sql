ALTER TABLE public.gmao_demandes_intervention
  ADD COLUMN IF NOT EXISTS traite_par_nom text,
  ADD COLUMN IF NOT EXISTS commentaire_validation text;