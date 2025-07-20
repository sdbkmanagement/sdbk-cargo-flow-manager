
-- Supprimer la contrainte NOT NULL et la colonne client_nom de la table bons_livraison
ALTER TABLE public.bons_livraison 
ALTER COLUMN client_nom DROP NOT NULL;

ALTER TABLE public.bons_livraison 
DROP COLUMN client_nom;

-- Ajouter lieu_depart et lieu_arrivee s'ils n'existent pas déjà
ALTER TABLE public.bons_livraison 
ADD COLUMN IF NOT EXISTS lieu_depart VARCHAR,
ADD COLUMN IF NOT EXISTS lieu_arrivee VARCHAR;
