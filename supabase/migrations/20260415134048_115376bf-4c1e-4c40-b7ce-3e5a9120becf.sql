UPDATE bons_livraison 
SET prix_unitaire = 99.93, 
    montant_total = COALESCE(quantite_livree, quantite_prevue, 0) * 99.93,
    updated_at = now()
WHERE numero IN ('BL-3022534469', 'BL-3022536221');