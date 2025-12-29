-- Mise à jour du prix_unitaire pour les BL vers Dian Dian Cobad
UPDATE bons_livraison 
SET prix_unitaire = 376.29, 
    montant_total = quantite_prevue * 376.29,
    updated_at = now()
WHERE numero IN ('BL-3022529582', 'BL-3022529624');