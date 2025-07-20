
-- Ajouter la colonne observations à la table bons_livraison
ALTER TABLE public.bons_livraison 
ADD COLUMN IF NOT EXISTS observations text;
