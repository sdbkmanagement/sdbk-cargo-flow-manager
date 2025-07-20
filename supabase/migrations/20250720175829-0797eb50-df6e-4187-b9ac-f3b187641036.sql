
-- Ajouter la colonne mission_id à la table bons_livraison
ALTER TABLE public.bons_livraison 
ADD COLUMN IF NOT EXISTS mission_id uuid REFERENCES public.missions(id);

-- Créer un index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_bons_livraison_mission_id 
ON public.bons_livraison(mission_id);
