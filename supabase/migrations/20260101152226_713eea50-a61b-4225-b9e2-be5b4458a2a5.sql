-- Mettre à jour le bon de livraison BL-3022530707 avec le tarif Taressa
UPDATE bons_livraison 
SET 
  destination = 'Taressa - Cobad Taressa',
  prix_unitaire = 342.74,
  montant_total = quantite_prevue * 342.74,
  updated_at = now()
WHERE numero = 'BL-3022530707';