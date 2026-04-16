
ALTER TABLE public.vehicules
  ADD COLUMN IF NOT EXISTS actif boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS date_sortie_flotte date,
  ADD COLUMN IF NOT EXISTS motif_sortie_flotte text;
