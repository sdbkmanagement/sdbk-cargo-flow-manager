-- Modifier les contraintes NOT NULL pour les champs marque, modele, immatriculation
-- Car pour les tracteur_remorque, ces champs ne sont pas utilisés (on utilise tracteur_* et remorque_*)

ALTER TABLE public.vehicules 
ALTER COLUMN marque DROP NOT NULL,
ALTER COLUMN modele DROP NOT NULL,
ALTER COLUMN immatriculation DROP NOT NULL;

-- Ajouter des contraintes conditionnelles pour assurer la cohérence
ALTER TABLE public.vehicules 
DROP CONSTRAINT IF EXISTS check_porteur_required,
ADD CONSTRAINT check_porteur_required 
  CHECK (
    (type_vehicule = 'tracteur_remorque') OR 
    (type_vehicule = 'porteur' AND marque IS NOT NULL AND modele IS NOT NULL AND immatriculation IS NOT NULL)
  );