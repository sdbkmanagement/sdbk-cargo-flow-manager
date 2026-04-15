UPDATE bons_livraison 
SET prix_unitaire = 463.44, 
    montant_total = COALESCE(quantite_livree, quantite_prevue, 0) * 463.44,
    updated_at = now()
WHERE numero = 'BL-3022539907';