
-- Ajouter des tarifs de péréquation exacts au départ de Conakry pour éviter les mauvais matchs du trigger
INSERT INTO public.tarifs_hydrocarbures (destination, lieu_depart, tarif_au_litre, numero_ordre, observations)
VALUES 
  ('Kérouané Station Total Kerouan', 'Conakry', 1205.67, 215, 'Tarif péréquation exact depuis Conakry'),
  ('Dabola Station Dabola Route Kouroussa', 'Conakry', 463.44, 216, 'Tarif péréquation exact depuis Conakry');

-- Recalculer les deux BL concernés (le trigger appliquera le tarif exact)
UPDATE public.bons_livraison
SET prix_unitaire = 1205.67,
    montant_total = COALESCE(quantite_livree, quantite_prevue, 0) * 1205.67,
    updated_at = now()
WHERE numero = 'BL-3022540799';

UPDATE public.bons_livraison
SET prix_unitaire = 463.44,
    montant_total = COALESCE(quantite_livree, quantite_prevue, 0) * 463.44,
    updated_at = now()
WHERE numero = 'BL-3022543000';
