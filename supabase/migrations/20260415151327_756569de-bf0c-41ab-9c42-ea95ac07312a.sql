UPDATE bons_livraison 
SET 
    quantite_prevue = 10000,
    quantite_livree = 10000,
    montant_total = 10000 * COALESCE(prix_unitaire, 0),
    updated_at = now()
WHERE numero = 'BL-3022539156';