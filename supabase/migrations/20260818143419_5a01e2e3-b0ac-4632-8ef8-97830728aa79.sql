ALTER TABLE public.gmao_equipements
  ADD COLUMN IF NOT EXISTS type_equipement TEXT NOT NULL DEFAULT 'autre',
  ADD COLUMN IF NOT EXISTS immatriculation TEXT,
  ADD COLUMN IF NOT EXISTS numero_chassis TEXT,
  ADD COLUMN IF NOT EXISTS volume_litres NUMERIC,
  ADD COLUMN IF NOT EXISTS configuration TEXT,
  ADD COLUMN IF NOT EXISTS date_mise_circulation DATE;

CREATE UNIQUE INDEX IF NOT EXISTS gmao_equipements_immatriculation_uniq
  ON public.gmao_equipements (upper(immatriculation)) WHERE immatriculation IS NOT NULL;

CREATE INDEX IF NOT EXISTS gmao_equipements_type_idx ON public.gmao_equipements (type_equipement);