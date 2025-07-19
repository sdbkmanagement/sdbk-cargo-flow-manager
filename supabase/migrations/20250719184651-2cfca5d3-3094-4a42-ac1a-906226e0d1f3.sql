
-- Ajouter le champ propriétaire à la table vehicules
ALTER TABLE public.vehicules 
ADD COLUMN IF NOT EXISTS proprietaire_nom VARCHAR(100),
ADD COLUMN IF NOT EXISTS proprietaire_prenom VARCHAR(100);

-- Ajouter le champ volume pour les porteurs
ALTER TABLE public.vehicules 
ADD COLUMN IF NOT EXISTS volume_tonnes NUMERIC;
