-- Add billing status columns to missions for tracking invoicing
ALTER TABLE public.missions
ADD COLUMN IF NOT EXISTS facturation_statut VARCHAR(50) NOT NULL DEFAULT 'en_attente',
ADD COLUMN IF NOT EXISTS facturation_date TIMESTAMP WITH TIME ZONE;

-- Optional index to query billed missions faster
CREATE INDEX IF NOT EXISTS idx_missions_facturation_statut ON public.missions(facturation_statut);
CREATE INDEX IF NOT EXISTS idx_missions_facturation_date ON public.missions(facturation_date);
