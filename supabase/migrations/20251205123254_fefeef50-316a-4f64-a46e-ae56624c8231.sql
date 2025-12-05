-- Ajouter le champ manquant_citerne pour les bons de livraison
ALTER TABLE public.bons_livraison 
ADD COLUMN IF NOT EXISTS manquant_citerne numeric DEFAULT 0;

-- Mettre à jour le trigger de calcul du total pour inclure citerne
CREATE OR REPLACE FUNCTION public.calculer_manquant_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.manquant_total := COALESCE(NEW.manquant_citerne, 0) + COALESCE(NEW.manquant_cuve, 0) + COALESCE(NEW.manquant_compteur, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;